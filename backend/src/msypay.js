// MSY PAY Développeurs — encaissement des abonnements PREP' CONCOURS BF par MONDIASYSTEM (convention 55/45).
// Documentation : https://mondiasystem.com (MSY PAY Développeurs, achats intégrés).
// - le montant vient TOUJOURS de ce serveur (jamais de l'application) ;
// - un abonnement n'est activé qu'après la preuve lue par MSY PAY chez le fournisseur (statut PAID) ;
// - chaque paiement n'est appliqué qu'une fois ; la référence ne contient aucune donnée personnelle.
// Aucune dépendance : node:crypto et fetch (Node ≥ 18).
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

export const URL_MSY_PAY = "https://mondiasystem.com/api/store/apps/iap/payments";
export const LIBELLES = { month: "Abonnement mensuel PREP' CONCOURS BF", life: "Abonnement à vie PREP' CONCOURS BF" };

export function makeMsyPay({ apiKey = "", webhookSecret = "", returnUrl = "", prix = { month: 1500, life: 3000 },
                             baseUrl = URL_MSY_PAY, fetchFn = globalThis.fetch, nowFn = () => Date.now() } = {}) {
  const actif = Boolean(apiKey && webhookSecret && /^https:\/\//.test(returnUrl));

  async function appel(methode, chemin, corps) {
    const r = await fetchFn(baseUrl + chemin, {
      method: methode,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: corps ? JSON.stringify(corps) : undefined,
    });
    let d = {};
    try { d = await r.json(); } catch { d = {}; }
    if (!r.ok) throw Object.assign(new Error(`MSY PAY ${r.status}`), { status: r.status, detail: d && d.detail });
    return d.payment || {};
  }

  /** Référence unique, sans donnée personnelle : PCBF-<plan>-<horodatage>-<aléa>. */
  function reference(plan) {
    return `PCBF-${plan}-${nowFn()}-${randomBytes(4).toString("hex")}`;
  }

  /** Demande un paiement. Renvoie { payment_id, payment_url, status }. */
  async function demander({ reference: ref, plan, phone = "", name = "" }) {
    if (!actif) throw Object.assign(new Error("MSY PAY non configuré"), { status: 503 });
    if (!prix[plan]) throw Object.assign(new Error("plan inconnu"), { status: 400 });
    return appel("POST", "", { reference: ref, amount: prix[plan], label: LIBELLES[plan], return_url: returnUrl,
                               customer_phone: phone, customer_name: name });
  }

  /** Statut, source de vérité (MSY PAY relit la preuve chez le fournisseur si besoin). */
  function statut(id) {
    return appel("GET", "/" + encodeURIComponent(String(id)));
  }

  /** Avis signé : HMAC-SHA256(webhook_secret, "<horodatage>.<corps brut>"), 10 minutes au plus. */
  function avisValide(corpsBrut, horodatage, signature) {
    if (!webhookSecret || !/^\d{9,12}$/.test(String(horodatage || ""))) return false;
    if (Math.abs(nowFn() / 1000 - Number(horodatage)) > 600) return false;
    const attendu = Buffer.from(createHmac("sha256", webhookSecret).update(`${horodatage}.${corpsBrut}`).digest("hex"));
    const recu = Buffer.from(String(signature || ""));
    return attendu.length === recu.length && timingSafeEqual(attendu, recu);
  }

  return { actif, prix, reference, demander, statut, avisValide };
}
