// MSY PAY Développeurs — module d'encaissement (aucun appel réseau : fetch simulé).
import { test } from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { makeMsyPay, LIBELLES } from "../src/msypay.js";

const T = 1793500000000;
function faux(reponses) {
  const appels = [];
  const fetchFn = async (url, o) => {
    appels.push({ url, methode: o.method, auth: o.headers.Authorization, corps: o.body ? JSON.parse(o.body) : null });
    const r = reponses.shift();
    return { ok: r.status < 300, status: r.status, json: async () => r.body };
  };
  return { appels, fetchFn };
}
const conf = (f) => makeMsyPay({ apiKey: "msk_a.mss_b", webhookSecret: "whs_secret", returnUrl: "https://prep-concours.mondiasystem.com/msy-pay/retour",
                                 fetchFn: f.fetchFn, nowFn: () => T });

test("inactif sans les deux secrets et une adresse de retour https", () => {
  assert.equal(makeMsyPay({}).actif, false);
  assert.equal(makeMsyPay({ apiKey: "k", webhookSecret: "w", returnUrl: "http://x" }).actif, false);
  return assert.rejects(makeMsyPay({}).demander({ reference: "r", plan: "month" }), /non configuré/);
});

test("le montant vient du serveur et la référence ne contient aucune donnée personnelle", async () => {
  const f = faux([{ status: 200, body: { payment: { payment_id: "IAP-1", payment_url: "https://pay/1", status: "PENDING_PAYMENT" } } }]);
  const p = conf(f);
  const ref = p.reference("month");
  assert.match(ref, /^PCBF-month-1793500000000-[0-9a-f]{8}$/);
  assert.match(ref, /^[A-Za-z0-9._:-]{3,80}$/);                      // règle MSY PAY
  const r = await p.demander({ reference: ref, plan: "month", phone: "+22670000000" });
  assert.equal(r.payment_url, "https://pay/1");
  const a = f.appels[0];
  assert.equal(a.url, "https://mondiasystem.com/api/store/apps/iap/payments");
  assert.equal(a.methode, "POST");
  assert.equal(a.auth, "Bearer msk_a.mss_b");
  assert.deepEqual([a.corps.amount, a.corps.label, a.corps.return_url], [1500, LIBELLES.month, "https://prep-concours.mondiasystem.com/msy-pay/retour"]);
  await assert.rejects(p.demander({ reference: ref, plan: "gratuit" }), /plan inconnu/);
});

test("statut : la source de vérité, référence encodée", async () => {
  const f = faux([{ status: 200, body: { payment: { status: "PAID", reference: "PCBF-life-1", amount: 3000 } } },
                  { status: 404, body: { detail: "Paiement inconnu" } }]);
  const p = conf(f);
  assert.equal((await p.statut("PCBF-life-1")).status, "PAID");
  assert.equal(f.appels[0].url, "https://mondiasystem.com/api/store/apps/iap/payments/PCBF-life-1");
  await assert.rejects(p.statut("x/../y"), (e) => e.status === 404);
  assert.equal(f.appels[1].url.endsWith("/x%2F..%2Fy"), true);
});

test("avis signé : bonne signature seulement, 10 minutes au plus", () => {
  const p = conf(faux([]));
  const corps = '{"event":"payment.paid","payment":{"payment_id":"IAP-1"}}', h = String(T / 1000);
  const sig = createHmac("sha256", "whs_secret").update(`${h}.${corps}`).digest("hex");
  assert.equal(p.avisValide(corps, h, sig), true);
  assert.equal(p.avisValide(corps + " ", h, sig), false);           // corps modifié
  assert.equal(p.avisValide(corps, h, sig.slice(0, -1) + "0"), false);
  assert.equal(p.avisValide(corps, String(T / 1000 - 601), createHmac("sha256", "whs_secret").update(`${T / 1000 - 601}.${corps}`).digest("hex")), false);
  assert.equal(p.avisValide(corps, "abc", sig), false);
});
