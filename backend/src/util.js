import { createHmac, timingSafeEqual, randomInt } from "node:crypto";

export const now = () => Date.now();

export function safeEqual(a, b) {
  const x = Buffer.from(String(a)), y = Buffer.from(String(b));
  return x.length === y.length && timingSafeEqual(x, y);
}
export const genCode = () => String(randomInt(0, 1000000)).padStart(6, "0");
export const hashCode = (secret, contact, did, code) =>
  createHmac("sha256", secret).update(`${contact}|${did}|${code}`).digest("hex");

/** Limiteur de débit en mémoire : max `n` appels par `ms` pour une clé. */
export function makeLimiter() {
  const hits = new Map();
  return function hit(key, n, ms) {
    const t = now(), arr = (hits.get(key) || []).filter((x) => t - x < ms);
    if (arr.length >= n) { hits.set(key, arr); return false; }
    arr.push(t); hits.set(key, arr);
    if (hits.size > 50000) for (const [k, v] of hits) if (!v.length || t - v[v.length - 1] > ms) hits.delete(k);
    return true;
  };
}

export const str = (v, max) => (typeof v === "string" ? v.trim().slice(0, max) : "");

const ALPHA = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
/** Code Premium lié à l'identifiant d'appareil (calculé côté serveur uniquement). */
export function premiumCode(secret, did) {
  const h = createHmac("sha256", secret).update("PREM|" + String(did).trim().toUpperCase()).digest();
  let o = ""; for (let i = 0; i < 8; i++) o += ALPHA[h[i] % 32];
  return o.slice(0, 4) + "-" + o.slice(4);
}
export const cleanCode = (x) => String(x || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
