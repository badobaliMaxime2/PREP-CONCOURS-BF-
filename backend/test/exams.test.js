import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../src/app.js";
import { openDb } from "../src/db.js";

const AT = "t".repeat(32);
const cfg = { dbFile: ":memory:", serverSecret: "s".repeat(32), adminToken: AT, adminCodes: ["T68K-NXHR-QQ3Z"], corsOrigin: "*", trustProxy: false,
  aiProvider: "anthropic", aiKey: "k", aiModel: "", useWeb: false, maxParAppareil: 2, maxGlobal: 100 };
let server, base;
before(async () => {
  server = createApp(cfg, { db: openDb(":memory:"), mail: { send: async () => {} }, fetchFn: async () => ({ status: 200, json: async () => ({}) }) });
  await new Promise((r) => server.listen(0, r));
  base = `http://127.0.0.1:${server.address().port}`;
});
after(() => server.close());

const post = (body) => fetch(base + "/", { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(body) }).then((r) => r.json());
const adm = (method, path, body) => fetch(base + path, { method, headers: { Authorization: "Bearer " + AT, "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined })
  .then(async (r) => ({ status: r.status, json: (r.headers.get("content-type") || "").includes("json") ? await r.json() : await r.text() }));
async function newUser(n) {
  const u = { nom: "NOM" + n, prenom: "Pre" + n, naissance: "2000-01-0" + n, contact: `c${n}@example.com`, type: "email", did: "device-00000" + n };
  const r = await post({ action: "verify", code: "T68K-NXHR-QQ3Z", ...u });
  assert.ok(r.ok && r.token); return { ...u, token: r.token };
}
const cand = (u) => ({ nom: u.nom, prenom: u.prenom, naissance: u.naissance, contact: u.contact, did: u.did, tel: "70000000", concours: "Greffier" });

let A, B, id, qids;
test("accès jury protégé", async () => {
  const r = await fetch(base + "/admin/exams"); assert.equal(r.status, 401);
});
test("le jury crée un examen (brouillon invisible pour les candidats)", async () => {
  A = await newUser(1); B = await newUser(2);
  const bad = await adm("POST", "/admin/exams", { titre: "x", questions: [] }); assert.equal(bad.status, 400);
  const r = await adm("POST", "/admin/exams", { titre: "Concours blanc Greffier", duree_min: 90, consignes: "Rédige.", questions: [{ enonce: "Q un", points: 10 }, { enonce: "Q deux", points: 10 }] });
  assert.equal(r.status, 200); id = r.json.id;
  assert.equal((await post({ action: "exam_list", token: A.token })).items.length, 0);
  assert.equal((await post({ action: "exam_get", token: A.token, id })).error, "notfound");
});
test("ouverture : liste sans les questions, épreuve avec chronomètre serveur", async () => {
  await adm("PUT", `/admin/exams/${id}`, { statut: "ouvert" });
  const l = await post({ action: "exam_list", token: A.token });
  assert.equal(l.items.length, 1); assert.equal(l.items[0].ouvert, true); assert.equal(l.items[0].questions, undefined);
  assert.equal((await post({ action: "exam_list", token: "x".repeat(64) })).error, "auth");
  const g = await post({ action: "exam_get", token: A.token, id });
  assert.equal(g.ok, true); assert.equal(g.exam.questions.length, 2); qids = g.exam.questions.map((q) => q.id);
  assert.equal(g.limite - g.debut, 90 * 60e3);
  const g2 = await post({ action: "exam_get", token: A.token, id }); assert.equal(g2.debut, g.debut);   // le chrono ne repart pas
});
test("dépôt : sans ouverture refusé, nom obligatoire, idempotent", async () => {
  assert.equal((await post({ action: "exam_submit", token: B.token, id, candidat: cand(B), reponses: {} })).error, "notstarted");
  assert.equal((await post({ action: "exam_submit", token: A.token, id, candidat: { prenom: "x" }, reponses: {} })).error, "invalid");
  const r = await post({ action: "exam_submit", token: A.token, id, candidat: cand(A), reponses: { [qids[0]]: "Ma réponse 1", [qids[1]]: "Ma réponse 2" } });
  assert.ok(r.ok && /^CP\d+-[A-Z0-9]{5}$/.test(r.ref)); assert.equal(r.late, false);
  const again = await post({ action: "exam_submit", token: A.token, id, candidat: cand(A), reponses: { [qids[0]]: "AUTRE" } });
  assert.equal(again.already, true); assert.equal(again.ref, r.ref);
  assert.equal((await post({ action: "exam_get", token: A.token, id })).deja, true);
});
test("le sujet est figé dès qu'une copie existe", async () => {
  assert.equal((await adm("PUT", `/admin/exams/${id}`, { questions: [{ enonce: "nouveau" }] })).status, 409);
  assert.equal((await adm("DELETE", `/admin/exams/${id}`)).status, 409);
});
test("le jury reçoit et note les copies", async () => {
  const L = await adm("GET", `/admin/exams/${id}/copies`);
  assert.equal(L.json.copies.length, 1); assert.equal(L.json.copies[0].statut, "recue"); assert.equal(L.json.copies[0].nom, "NOM1");
  const cid = L.json.copies[0].id;
  const C = await adm("GET", `/admin/copies/${cid}`);
  assert.equal(C.json.copie.reponses[qids[0]], "Ma réponse 1"); assert.equal(C.json.copie.candidat.concours, "Greffier");
  const part = await adm("POST", `/admin/copies/${cid}/grade`, { notes: { [qids[0]]: 8 } });
  assert.equal(part.json.statut, "encours");
  const res = await adm("POST", `/admin/copies/${cid}/grade`, { notes: { [qids[0]]: 8, [qids[1]]: 99 }, appreciation: "Bon travail" });   // 99 est plafonné à 10
  assert.equal(res.json.total, 18); assert.equal(res.json.note20, 18); assert.equal(res.json.mention, "Très bien"); assert.equal(res.json.statut, "corrigee");
});
test("résultats : invisibles tant que non publiés, puis visibles uniquement pour le candidat", async () => {
  assert.equal((await post({ action: "exam_result", token: A.token, id })).publie, false);
  await post({ action: "exam_submit", token: B.token, id, candidat: cand(B), reponses: {} }).catch(() => {});
  await post({ action: "exam_get", token: B.token, id });
  await post({ action: "exam_submit", token: B.token, id, candidat: cand(B), reponses: { [qids[0]]: "B" } });
  const blocked = await adm("POST", `/admin/exams/${id}/publish`, { publie: true });
  assert.equal(blocked.status, 409); assert.equal(blocked.json.restantes, 1);
  const cB = (await adm("GET", `/admin/exams/${id}/copies`)).json.copies.find((c) => c.nom === "NOM2");
  await adm("POST", `/admin/copies/${cB.id}/grade`, { notes: { [qids[0]]: 4, [qids[1]]: 4 } });
  assert.equal((await adm("POST", `/admin/exams/${id}/publish`, { publie: true })).json.publie, true);
  const ra = await post({ action: "exam_result", token: A.token, id }), rb = await post({ action: "exam_result", token: B.token, id });
  assert.equal(ra.rang, 1); assert.equal(rb.rang, 2); assert.equal(ra.effectif, 2); assert.equal(ra.appreciation, "Bon travail"); assert.equal(rb.note20, 8); assert.equal(rb.mention, "Ajourné");
});
test("classement et export CSV", async () => {
  const r = await adm("GET", `/admin/exams/${id}/ranking`); assert.equal(r.json.classement.length, 2); assert.equal(r.json.classement[0].nom, "NOM1");
  const c = await adm("GET", `/admin/exams/${id}/ranking?format=csv`); assert.match(c.json, /^rang,ref,nom/); assert.match(c.json, /NOM1/);
});
test("copie hors délai et épreuve fermée", async () => {
  const e = await adm("POST", "/admin/exams", { titre: "Fermé", statut: "ouvert", ferme: Date.now() - 1000, questions: [{ enonce: "Q" }] });
  assert.equal((await post({ action: "exam_get", token: A.token, id: e.json.id })).error, "closed");
});
