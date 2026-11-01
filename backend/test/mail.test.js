// Envoi des codes : MSY Mail en priorité, Resend sinon, console sans clé (aucun appel réseau : fetch simulé).
import { test } from "node:test";
import assert from "node:assert/strict";
import { makeMailer } from "../src/mail.js";

const faux = (status = 200) => { const appels = []; return { appels, fetchFn: async (url, o) => { appels.push({ url, o }); return { ok: status < 300, status }; } }; };

test("MSY Mail en priorité quand la clé est définie", async () => {
  const f = faux();
  await makeMailer({ apiKey: "re_x", from: "a@b", msyKey: "mcm_k", msyUrl: "https://mondiasystem.com/api/cloud/apps/prep-concours/mail", fetchFn: f.fetchFn })
    .send("eleve@exemple.bf", "Code d'activation", "Ton code : 123456");
  assert.equal(f.appels.length, 1);
  assert.equal(f.appels[0].url, "https://mondiasystem.com/api/cloud/apps/prep-concours/mail");
  assert.equal(f.appels[0].o.headers.Authorization, "Bearer mcm_k");
  assert.deepEqual(JSON.parse(f.appels[0].o.body), { to: "eleve@exemple.bf", subject: "Code d'activation", text: "Ton code : 123456" });
});

test("une erreur de MSY Mail est remontée (plafond 429 compris)", async () => {
  const f = faux(429);
  await assert.rejects(makeMailer({ msyKey: "mcm_k", msyUrl: "https://x", fetchFn: f.fetchFn }).send("a@b.c", "s", "t"), /MSY Mail 429/);
});

test("Resend sans clé MSY, console sans aucune clé", async () => {
  const f = faux(), lignes = [];
  await makeMailer({ apiKey: "re_x", from: "PREP <a@b>", fetchFn: f.fetchFn }).send("a@b.c", "s", "t");
  assert.equal(f.appels[0].url, "https://api.resend.com/emails");
  await makeMailer({ fetchFn: f.fetchFn, log: { log: (l) => lignes.push(l) } }).send("a@b.c", "s", "t");
  assert.equal(f.appels.length, 1);
  assert.match(lignes[0], /\[mail:dev\]/);
});
