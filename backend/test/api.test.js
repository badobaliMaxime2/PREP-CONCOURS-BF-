import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../src/app.js";
import { openDb } from "../src/db.js";

const cfg = { dbFile: ":memory:", serverSecret: "s".repeat(32), adminToken: "t".repeat(32), adminCodes: ["069833", "T68K-NXHR-QQ3Z"], corsOrigin: "*",
  trustProxy: false, aiProvider: "anthropic", aiKey: "k", aiModel: "", useWeb: false, maxParAppareil: 2, maxGlobal: 100 };
const sent = [];
const mail = { send: async (to, subj, text) => sent.push({ to, text }) };
const aiCalls = [];
const fetchFn = async (url, opts) => { aiCalls.push({ url, body: JSON.parse(opts.body) }); return { status: 200, json: async () => ({ content: [{ type: "text", text: "Réponse test" }] }) }; };

let server, base, tokenA, tokenB;
before(async () => {
  server = createApp(cfg, { db: openDb(":memory:"), mail, fetchFn });
  await new Promise((r) => server.listen(0, r));
  base = `http://127.0.0.1:${server.address().port}`;
});
after(() => server.close());

const post = (path, body) => fetch(base + path, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(body) }).then((r) => r.json());
const admin = (path, opts = {}) => fetch(base + path, { ...opts, headers: { Authorization: "Bearer " + "t".repeat(32), ...(opts.headers || {}) } });
const user = { nom: "BADO", prenom: "Aminata", naissance: "2000-01-01", contact: "ami@example.com", type: "email", did: "device-123456" };

test("santé", async () => {
  assert.deepEqual(await (await fetch(base + "/")).json(), { ok: true, service: "prepconcours" });
});

test("inscription refusée si données invalides", async () => {
  assert.equal((await post("/", { action: "signup", ...user, contact: "pas-un-mail" })).ok, false);
});

test("parcours complet : signup → mauvais code → bon code → IA → limite → suppression", async () => {
  assert.equal((await post("/", { action: "signup", ...user })).ok, true);
  assert.equal(sent.length, 1);
  const code = sent[0].text.match(/\b(\d{6})\b/)[1];

  // l'IA est refusée sans session
  assert.equal((await post("/", { action: "ask", token: "x".repeat(64), message: "Bonjour" })).error, "auth");

  const bad = code === "000000" ? "111111" : "000000";
  assert.equal((await post("/", { action: "verify", contact: user.contact, did: user.did, code: bad })).ok, false);
  const v = await post("/", { action: "verify", contact: user.contact, did: user.did, code });
  assert.equal(v.ok, true);
  assert.match(v.token, /^[0-9a-f]{64}$/);
  tokenA = v.token;

  const r = await post("/", { action: "ask", token: tokenA, message: "Capitale du Burkina ?", history: [{ role: "assistant", content: "x" }], context: "ctx" });
  assert.deepEqual(r, { ok: true, reply: "Réponse test" });
  assert.equal(aiCalls[0].body.messages[0].role, "user");          // alternance corrigée
  assert.ok(aiCalls[0].body.system.includes("PREP' CONCOURS BF"));  // consignes côté serveur

  await post("/", { action: "ask", token: tokenA, message: "2" });
  assert.equal((await post("/", { action: "ask", token: tokenA, message: "3" })).error, "limit");   // plafond = 2
});

test("synchronisation : fusion entre deux appareils du même compte", async () => {
  const h1 = { m: "cg", s: 7, t: 10, d: 1000, mode: "free", by: { cg: [7, 10] } };
  const h2 = { m: "fr", s: 5, t: 10, d: 2000, mode: "free", by: { fr: [5, 10] } };
  const q = { m: "cg", q: "Question ?", o: ["a", "b", "c", "d"], a: 2, e: "" };
  // appareil A pousse
  let r = await post("/", { action: "sync", token: tokenA, data: { hist: [h1], cq: [q], cqAt: 50, target: "ENAREF", targetAt: 50 } });
  assert.equal(r.ok, true);
  // appareil B (autre did, même contact) s'active puis synchronise avec ses propres données
  await post("/", { action: "signup", ...user, did: "device-B-654321" });
  const codeB = sent.at(-1).text.match(/\b(\d{6})\b/)[1];
  const vB = await post("/", { action: "verify", contact: user.contact, did: "device-B-654321", code: codeB });
  assert.equal(vB.ok, true);
  r = await post("/", { action: "sync", token: vB.token, data: { hist: [h2], cq: [], cqAt: 0, target: "", targetAt: 0 } });
  assert.deepEqual(r.data.hist.map((x) => x.m), ["cg", "fr"]);     // union des historiques
  assert.equal(r.data.cq.length, 1);                              // questions de A conservées (B n'a rien de plus récent)
  assert.equal(r.data.target, "ENAREF");
  // B change d'objectif plus tard : le plus récent gagne
  r = await post("/", { action: "sync", token: vB.token, data: { hist: [], cq: [], cqAt: 99, target: "ENAM", targetAt: 99 } });
  assert.equal(r.data.target, "ENAM");
  assert.equal(r.data.cq.length, 0);                              // suppression plus récente prise en compte
  // données invalides nettoyées, jeton obligatoire
  r = await post("/", { action: "sync", token: tokenA, data: { hist: [{ d: -1 }, "x", { m: "cg", s: 1, t: 2, d: 5 }], cq: [{ q: "sans options" }] } });
  assert.equal(r.data.hist.length, 3); assert.equal(r.data.cq.length, 0);
  assert.equal((await post("/", { action: "sync", token: "z".repeat(64), data: {} })).error, "auth");
  tokenB = vB.token;
});

test("Premium : code calculé par le serveur, lié à l'appareil", async () => {
  const c = await (await admin("/admin/premium-code?did=abcd2345")).json();
  assert.match(c.code, /^[A-Z2-9]{4}-[A-Z2-9]{4}$/);
  assert.equal((await post("/", { action: "premium", did: "ABCD2345", code: c.code.toLowerCase() })).ok, true);
  assert.equal((await post("/", { action: "premium", did: "ZZZZ2345", code: c.code })).ok, false);
  assert.equal((await post("/", { action: "premium", did: "ABCD2345", code: "AAAA-AAAA" })).ok, false);
});

test("déconnexion révoque la session ; suppression exige le jeton et efface tout", async () => {
  await post("/", { action: "logout", token: tokenB });
  assert.equal((await post("/", { action: "sync", token: tokenB, data: {} })).error, "auth");
  assert.equal((await post("/", { action: "delete", contact: user.contact, did: user.did })).error, "auth");   // sans jeton : refusé
  assert.equal((await post("/", { action: "delete", contact: user.contact, did: user.did, token: tokenA })).ok, true);
  assert.equal((await post("/", { action: "sync", token: tokenA, data: {} })).error, "auth");
  const u = await (await admin("/admin/users")).json();
  assert.equal(u.users.filter((x) => x.contact === user.contact).length, 0);   // tous les appareils effacés
});

test("un code administrateur est aussi accepté à la vérification",async()=>{
  const u={...user,contact:"adm@example.com",did:"device-adm-01"};
  await post("/",{action:"signup",...u});
  const r=await post("/",{action:"verify",contact:u.contact,did:u.did,code:"069833"});
  assert.equal(r.ok,true);assert.ok(r.token);
});

test("verrouillage après 5 mauvais essais", async () => {
  const u = { ...user, contact: "lock@example.com", did: "device-lock-1" };
  await post("/", { action: "signup", ...u });
  for (let i = 0; i < 5; i++) await post("/", { action: "verify", contact: u.contact, did: u.did, code: "abcdef" });
  const code = sent.at(-1).text.match(/\b(\d{6})\b/)[1];
  assert.equal((await post("/", { action: "verify", contact: u.contact, did: u.did, code })).error, "locked");
});

test("code administrateur active un compte « tel » ; le code est visible de l'admin", async () => {
  const u = { ...user, contact: "70123456", type: "tel", did: "device-tel-1" };
  assert.equal((await post("/", { action: "signup", ...u })).ok, true);
  const pend = await (await admin("/admin/pending-codes")).json();
  assert.match(pend.items.find((i) => i.contact === "70123456").code, /^\d{6}$/);
  assert.equal((await post("/", { action: "adminactivate", contact: u.contact, did: u.did, code: "999999" })).ok, false);
  const aa = await post("/", { action: "adminactivate", contact: u.contact, did: u.did, code: "069833" });
  assert.equal(aa.ok, true); assert.match(aa.token, /^[0-9a-f]{64}$/);
  assert.equal((await (await admin("/admin/pending-codes")).json()).items.length, 0);   // code effacé après activation
});

test("inscriptions aux concours + export CSV (admin)", async () => {
  assert.equal((await post("/register", { ref: "CD-0001", concours: "Concours test", nom: "A", prenom: "B", email: "a@b.cd" })).ok, true);
  assert.equal((await post("/register", { nom: "sans ref" }).catch(() => ({ ok: false }))).ok, false);
  const csv = await (await admin("/admin/registrations?format=csv")).text();
  assert.match(csv, /CD-0001/);
});

test("API admin protégée par jeton", async () => {
  assert.equal((await fetch(base + "/admin/stats")).status, 401);
  assert.equal((await fetch(base + "/admin/stats", { headers: { Authorization: "Bearer mauvais" } })).status, 401);
  const s = await (await admin("/admin/stats")).json();
  assert.ok(s.users >= 1 && s.inscriptions === 1);
});

test("annonces publiées via l'admin, lues par l'app (FEED_URL)", async () => {
  const feed = { notifications: [{ id: "1", titre: "Test", texte: "t", date: "2026-10-13", lien: "https://www.econcours.gov.bf/" }], concours: [] };
  assert.equal((await (await admin("/admin/feed", { method: "PUT", body: JSON.stringify(feed) })).json()).ok, true);
  assert.deepEqual(await (await fetch(base + "/feed.json")).json(), feed);
});

test("un code administrateur permet de créer et d'activer un compte SANS inscription préalable", async () => {
  const u = { action: "verify", contact: "nouveau@example.com", did: "device-nouveau-1", type: "email", nom: "Test", prenom: "Nouveau", naissance: "2001-02-03" };
  const r = await post("/", { ...u, code: "t68k nxhr-qq3z" });          // tolère minuscules, espaces et tirets
  assert.equal(r.ok, true); assert.match(r.token, /^[0-9a-f]{64}$/);
  const list = await (await admin("/admin/users?active=1")).json();
  assert.ok(list.users.some((x) => x.contact === "nouveau@example.com" && x.prenom === "Nouveau"));
  assert.equal((await post("/", { action: "ask", token: r.token, message: "Bonjour" })).ok, true);   // et la session fonctionne
  assert.equal((await post("/", { ...u, contact: "autre@example.com", did: "device-autre-01", code: "AAAA-BBBB-CCCC" })).ok, false);   // mauvais code : refusé
});

test("le code administrateur fonctionne même si le compte est verrouillé après de mauvais essais", async () => {
  const u = { ...user, contact: "verrou2@example.com", did: "device-verrou2" };
  await post("/", { action: "signup", ...u });
  for (let i = 0; i < 6; i++) await post("/", { action: "verify", contact: u.contact, did: u.did, code: "123456" });
  assert.equal((await post("/", { action: "verify", contact: u.contact, did: u.did, code: "123456" })).error, "locked");
  assert.equal((await post("/", { action: "verify", contact: u.contact, did: u.did, code: "T68K-NXHR-QQ3Z" })).ok, true);
});

test("l'inscription n'est pas bloquée quand l'envoi de l'e-mail échoue (le compte est créé)", async () => {
  const failing = createApp(cfg, { db: openDb(":memory:"), mail: { send: async () => { throw new Error("smtp"); } } });
  await new Promise((r) => failing.listen(0, r));
  const b = `http://127.0.0.1:${failing.address().port}`;
  const r = await fetch(b + "/", { method: "POST", body: JSON.stringify({ action: "signup", ...user, contact: "panne@example.com", did: "device-panne-1" }) }).then((x) => x.json());
  failing.close();
  assert.deepEqual({ ok: r.ok, sent: r.sent }, { ok: true, sent: "failed" });
});

test("de nombreux utilisateurs derrière la même adresse IP ne se bloquent pas entre eux", async () => {
  for (let i = 0; i < 40; i++) {
    const r = await post("/", { action: "signup", ...user, contact: `70${String(100000 + i)}`, type: "tel", did: `device-ip-${i}-xx` });
    assert.equal(r.ok, true, "inscription " + i);
  }
});
