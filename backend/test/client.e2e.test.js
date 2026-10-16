// Fait tourner le vrai code de l'application (ext.js) contre le vrai serveur, avec un faux navigateur.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import fs from "node:fs";
import { createHash } from "node:crypto";
import http from "node:http";
import { createApp } from "../src/app.js";
import { openDb } from "../src/db.js";

const EXT_JS = fs.readFileSync(new URL("../../app/src/main/assets/www/ext.js", import.meta.url), "utf8");
const ADMIN = "t".repeat(32);
const cfg = { dbFile: ":memory:", serverSecret: "s".repeat(32), adminToken: ADMIN, adminCodes: ["069833", "T68K-NXHR-QQ3Z"], corsOrigin: "*", trustProxy: false,
  aiProvider: "anthropic", aiKey: "k", aiModel: "", useWeb: false, maxParAppareil: 25, maxGlobal: 100 };
const sent = [];
let server, base;

const hashOf = (code) => createHash("sha256").update("PCBF|" + code.replace(/[^A-Za-z0-9]/g, "").toUpperCase()).digest("hex");
function makeClient(url, did) {
  const store = new Map(), toasts = [], els = {};
  const localStorage = { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k), clear: () => store.clear() };
  const el = (id) => els[id] || (els[id] = { value: "", innerHTML: "", disabled: false, style: {}, hidden: false, textContent: "" });
  const document = { querySelector: (s) => (s.startsWith("#") ? el(s.slice(1)) : { style: {}, classList: { add() {}, remove() {} } }), addEventListener() {}, body: { classList: { add() {}, remove() {} } } };
  const sb = { document, localStorage, navigator: { onLine: true }, fetch, AbortController, URL, console, JSON, Date, Promise, String, Number, Array, Object, RegExp, Math, encodeURIComponent,
    setTimeout: (f, ms) => { const t = setTimeout(f, ms); t.unref?.(); return t; }, clearTimeout, setInterval: () => 0, clearInterval() {} };
  sb.window = sb; sb.REP = {};
  vm.runInNewContext(EXT_JS, sb);
  const ls = { g: (k, d) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } }, s: (k, v) => localStorage.setItem(k, JSON.stringify(v)) };
  const C = { ACCOUNT_URL: url, REQUIRE_ACCOUNT: true, ADMIN_EMAILS: [], WHATSAPP: "22656837328", EMAIL: "a@b.cd", SITES: [], PRICE: "3000 FCFA", ADMIN_HASHES: [hashOf("T68K-NXHR-QQ3Z")] };
  const APP = { C, D: {}, ls, esc: (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])),
    toast: (m) => toasts.push(m), S: {}, T: {}, cur: () => "home", reset() {}, draw() {}, did: () => did, cleanCode: (x) => String(x || "").toUpperCase().replace(/[^A-Z0-9]/g, ""), h53: () => 0 };
  sb.EXT.init(APP);
  const form = (o) => { for (const [k, v] of Object.entries(o)) el(k).value = v; };
  return { EXT: sb.EXT, C, ls, toasts, el, form, store, act: (a, arg = "") => sb.EXT.act(a, arg, el("btn")), last: () => toasts.at(-1) };
}
const admin = (path) => fetch(base + path, { headers: { Authorization: "Bearer " + ADMIN } }).then((r) => r.json());

before(async () => {
  server = createApp(cfg, { db: openDb(":memory:"), mail: { send: async (to, s, text) => sent.push({ to, text }) }, fetchFn: async () => ({ status: 200, json: async () => ({ content: [{ type: "text", text: "ok" }] }) }) });
  await new Promise((r) => server.listen(0, r));
  base = `http://127.0.0.1:${server.address().port}`;
});
after(() => server.close());

const fillSignup = (c, contact) => c.form({ sn: "Zigani", sp: "Diane", sb: "2004-01-14", sc: contact });

test("BUG SIGNALÉ — serveur injoignable : message précis (et non un message trompeur)", async () => {
  const c = makeClient("https://127.0.0.1:1/", "DEVICE-A1");
  fillSignup(c, "67837913");
  await c.act("signup");
  assert.match(c.last(), /injoignable/);
  assert.equal(c.ls.g("acct", null).pending, true);          // …et le compte est quand même créé
});

test("BUG SIGNALÉ — adresse qui ne renvoie pas du JSON : message précis", async () => {
  const html = http.createServer((q, r) => { r.writeHead(200, { "Content-Type": "text/html" }); r.end("<html>Connexion Google requise</html>"); });
  await new Promise((r) => html.listen(0, r));
  const c = makeClient(`http://127.0.0.1:${html.address().port}/`, "DEVICE-A2");
  fillSignup(c, "67837913");
  await c.act("signup");
  html.close();
  assert.match(c.last(), /inattendue/);
});

test("inscription par téléphone (cas de la capture d'écran) → code envoyé par l'admin → activation", async () => {
  const c = makeClient(base + "/", "DEVICE-A3");
  fillSignup(c, "67 83 79 13");
  await c.act("signup");
  const a = c.ls.g("acct", null);
  assert.equal(a.contact, "67837913"); assert.equal(a.pending, true); assert.equal(a.act, false);
  const code = (await admin("/admin/pending-codes")).items.find((i) => i.contact === "67837913").code;
  c.form({ ac: "000000" }); await c.act("actv");
  assert.equal(c.last(), "Code incorrect");
  c.form({ ac: code }); await c.act("actv");
  const a2 = c.ls.g("acct", null);
  assert.equal(a2.act, true); assert.match(a2.token, /^[0-9a-f]{64}$/);
});

test("inscription par e-mail : si l'envoi du mail échoue, le compte est créé et l'utilisateur est orienté vers l'administrateur", async () => {
  const bad = createApp(cfg, { db: openDb(":memory:"), mail: { send: async () => { throw new Error("smtp"); } } });
  await new Promise((r) => bad.listen(0, r));
  const c = makeClient(`http://127.0.0.1:${bad.address().port}/`, "DEVICE-A4");
  fillSignup(c, "diane@example.com");
  await c.act("signup");
  bad.close();
  assert.match(c.last(), /administrateur/);
  assert.equal(c.ls.g("acct", null).pending, true);
});

test("CODE ADMINISTRATEUR — avec le serveur en panne : le compte est créé puis activé hors ligne", async () => {
  const c = makeClient("https://127.0.0.1:1/", "DEVICE-E1");
  fillSignup(c, "67837913"); await c.act("signup");
  assert.equal(c.ls.g("acct", null).act, false);
  c.form({ ac: "t68k-nxhr-qq3z" }); await c.act("actv");       // code donné par l'administrateur (saisie en minuscules)
  const a = c.ls.g("acct", null);
  assert.equal(a.act, true); assert.equal(a.token, undefined);   // activé sur le téléphone, sans serveur
  const bad = makeClient("https://127.0.0.1:1/", "DEVICE-E2");
  fillSignup(bad, "67837914"); await bad.act("signup");
  bad.form({ ac: "AAAA-BBBB-CCCC" }); await bad.act("actv");
  assert.equal(bad.ls.g("acct", null).act, false);              // un mauvais code ne passe pas
});

test("CODE ADMINISTRATEUR — dès que le serveur répond, le compte hors ligne obtient sa session et son compte serveur", async () => {
  const c = makeClient("https://127.0.0.1:1/", "DEVICE-E3");
  fillSignup(c, "diane3@example.com"); await c.act("signup");
  c.form({ ac: "T68K-NXHR-QQ3Z" }); await c.act("actv");
  assert.equal(c.ls.g("acct", null).token, undefined);
  c.C.ACCOUNT_URL = base + "/";                                  // le serveur redevient joignable
  await c.EXT.sync(false);
  assert.match(c.ls.g("acct", null).token, /^[0-9a-f]{64}$/);
  const users = await admin("/admin/users?active=1");
  assert.ok(users.users.some((u) => u.contact === "diane3@example.com"));
});

test("CODE ADMINISTRATEUR — avec le serveur en marche, même si l'inscription avait échoué", async () => {
  const c = makeClient(base + "/", "DEVICE-E4");
  fillSignup(c, "diane4@example.com"); await c.act("signup");
  c.form({ ac: "T68K-NXHR-QQ3Z" }); await c.act("actv");
  const a = c.ls.g("acct", null);
  assert.equal(a.act, true); assert.match(a.token, /^[0-9a-f]{64}$/);
});

test("synchronisation : la progression est retrouvée sur un nouvel appareil, puis effacée à la déconnexion", async () => {
  const c1 = makeClient(base + "/", "DEVICE-B1");
  fillSignup(c1, "diane2@example.com"); await c1.act("signup");
  c1.form({ ac: sent.at(-1).text.match(/\b(\d{6})\b/)[1] }); await c1.act("actv");
  assert.equal(c1.ls.g("acct", null).act, true);
  c1.ls.s("hist", [{ m: "cg", s: 8, t: 10, d: 12345, mode: "free", by: { cg: [8, 10] } }]);
  c1.ls.s("target", "ENAREF");
  await c1.act("cloudsync");
  assert.equal(c1.last(), "Progression synchronisée ✔");

  const c2 = makeClient(base + "/", "DEVICE-B2");          // nouveau téléphone, même compte
  fillSignup(c2, "diane2@example.com"); await c2.act("signup");
  c2.form({ ac: sent.at(-1).text.match(/\b(\d{6})\b/)[1] }); await c2.act("actv");
  await c2.act("cloudsync");
  assert.equal(c2.ls.g("hist", []).length, 1);
  assert.equal(c2.ls.g("target", ""), "ENAREF");

  c2.ls.s("hist", [...c2.ls.g("hist", []), { m: "fr", s: 5, t: 10, d: 99999, mode: "free", by: {} }]);
  await c2.act("cloudsync");
  await c1.act("cloudsync");
  assert.equal(c1.ls.g("hist", []).length, 2);              // l'appareil 1 reçoit le résultat de l'appareil 2

  await c1.act("logout"); await c1.act("logout");      // 1er appui = confirmation, 2e = déconnexion
  assert.equal(c1.ls.g("acct", null), null);
  assert.deepEqual(c1.ls.g("hist", []), []);                 // plus de données personnelles sur l'appareil
});

test("administration par jeton (aucun secret dans l'app) + code Premium serveur", async () => {
  const c = makeClient(base + "/", "DEVICE-C1");
  c.form({ apin: "mauvais-jeton" }); await c.act("stats");
  assert.equal(c.last(), "Jeton administrateur incorrect");
  c.form({ apin: ADMIN }); await c.act("stats");
  assert.match(c.el("sout").innerHTML, /comptes/);
  c.form({ aid: "device-c1" }); await c.act("gen");
  const code = c.el("aout").innerHTML.match(/[A-Z2-9]{4}-[A-Z2-9]{4}/)[0];
  c.form({ pc: "AAAA-AAAA" }); await c.act("activate");
  assert.equal(c.last(), "Code incorrect");
  c.form({ pc: code }); await c.act("activate");               // code calculé pour l'identifiant de cet appareil
  assert.equal(c.last(), "Premium activé 🎉");
  assert.equal(c.ls.g("prem", null).did, "DEVICE-C1");
  const other = makeClient(base + "/", "AUTRE-APPAREIL");       // le même code ne marche pas sur un autre appareil
  other.form({ pc: code }); await other.act("activate");
  assert.equal(other.last(), "Code incorrect");
});

test("une modification faite PENDANT une synchronisation n'est jamais écrasée", async () => {
  const c = makeClient(base + "/", "DEVICE-D1");
  fillSignup(c, "race@example.com"); await c.act("signup");
  c.form({ ac: sent.at(-1).text.match(/\b(\d{6})\b/)[1] }); await c.act("actv");
  await c.EXT.sync(false);
  const p = c.act("cloudsync");                                   // synchronisation en cours…
  c.ls.s("hist", [{ m: "cg", s: 9, t: 10, d: 777, mode: "free", by: {} }]);   // …l'utilisateur termine un quiz
  await p;
  assert.equal(c.ls.g("hist", []).length, 1);                     // résultat conservé localement
  await c.act("cloudsync");                                        // la resynchronisation suivante l'envoie au compte
  const d = await fetch(base + "/", { method: "POST", body: JSON.stringify({ action: "sync", token: c.ls.g("acct", null).token, data: {} }) }).then((r) => r.json());
  assert.equal(d.data.hist.length, 1);
});
