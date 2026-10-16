import { randomBytes, createHash } from "node:crypto";
import { now, genCode, hashCode, safeEqual, str, premiumCode, cleanCode } from "./util.js";
import { cleanSync, mergeSync } from "./sync.js";

const sha = (x) => createHash("sha256").update(x).digest("hex");

const CODE_TTL = 24 * 3600e3;   // validité d'un code d'activation
const MAX_ATTEMPTS = 5;         // essais avant verrouillage (un renvoi de code réinitialise)
const RESEND_GAP = 60e3;        // délai minimum entre deux envois

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/;

export function makeAccounts({ db, cfg, mail, sms, hit }) {
  const find = (contact, did) => db.prepare("SELECT * FROM users WHERE contact=? AND did=?").get(contact, did);

  function newSession(userId) {
    const t = randomBytes(32).toString("hex");
    db.prepare("INSERT INTO sessions (token_hash,user_id,created_at) VALUES (?,?,?)").run(sha(t), userId, now());
    db.prepare("DELETE FROM sessions WHERE user_id=? AND token_hash NOT IN (SELECT token_hash FROM sessions WHERE user_id=? ORDER BY created_at DESC LIMIT 5)").run(userId, userId);
    return t;
  }
  function byToken(token) {
    if (typeof token !== "string" || token.length !== 64) return null;
    return db.prepare("SELECT u.* FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=? AND u.active=1").get(sha(token)) || null;
  }

  async function issueCode(u) {
    const code = genCode();
    db.prepare(`UPDATE users SET code_hash=?, code_plain=?, code_expires=?, attempts=0, last_sent=? WHERE id=?`)
      .run(hashCode(cfg.serverSecret, u.contact, u.did, code), u.type === "tel" ? code : null, now() + CODE_TTL, now(), u.id);
    if (u.type === "email")
      await mail.send(u.contact, "Code d'activation PREP' CONCOURS BF",
        `Bonjour ${u.prenom || ""},\nTon code d'activation : ${code}\nIl est valable 24 heures.`);
  }

  const validContact = (type, contact) => (type === "email" && EMAIL_RE.test(contact)) || (type === "tel" && /^\d{8}$/.test(contact));
  function createUser(d, contact, did) {
    const r = db.prepare(`INSERT INTO users (created_at,nom,prenom,naissance,contact,type,did) VALUES (?,?,?,?,?,?,?)`)
      .run(now(), str(d.nom, 80), str(d.prenom, 80), str(d.naissance, 20), contact, d.type, did);
    return db.prepare("SELECT * FROM users WHERE id=?").get(r.lastInsertRowid);
  }

  /** Vérification d'un code. Le code administrateur est prioritaire : il active n'importe quel compte (même créé seulement ici). */
  function verify(d, ip) {
    const contact = str(d.contact, 120).toLowerCase(), did = str(d.did, 100);
    const code = cleanCode(str(String(d.code ?? ""), 40));
    if (!hit(`vf:ip:${ip}`, 300, 3600e3)) return { ok: false, error: "rate" };
    if (code.length >= 6 && cfg.adminCodes.length && hit(`aa:ip:${ip}`, 200, 3600e3)
        && cfg.adminCodes.some((c) => safeEqual(cleanCode(c), code))) {
      let u = find(contact, did);
      if (!u) {
        if (!validContact(d.type, contact) || did.length < 6) return { ok: false, error: "invalid" };
        u = createUser(d, contact, did);
      }
      activate(u.id);
      return { ok: true, token: newSession(u.id) };
    }
    const u = find(contact, did);
    if (!u || !u.code_hash) return { ok: false };
    if (u.attempts >= MAX_ATTEMPTS) return { ok: false, error: "locked" };
    if (u.code_expires < now()) return { ok: false, error: "expired" };
    if (!safeEqual(u.code_hash, hashCode(cfg.serverSecret, contact, did, code))) {
      db.prepare("UPDATE users SET attempts=attempts+1 WHERE id=?").run(u.id);
      return { ok: false };
    }
    activate(u.id);
    return { ok: true, token: newSession(u.id) };
  }

  return {
    async signup(d, ip) {
      const contact = str(d.contact, 120).toLowerCase(), type = d.type, did = str(d.did, 100);
      if (!validContact(type, contact) || did.length < 6) return { ok: false, error: "invalid" };
      // limites volontairement larges : sur les réseaux mobiles, de nombreux utilisateurs partagent la même adresse IP
      if (!hit(`su:ip:${ip}`, 300, 3600e3) || !hit(`su:c:${contact}`, 10, 3600e3)) return { ok: false, error: "rate" };
      const u = find(contact, did) || createUser(d, contact, did);
      try { await issueCode(u); } catch (e) { console.error("[mail]", e.message); return { ok: true, sent: "failed" }; }   // le compte existe : l'admin peut donner un code
      return { ok: true, already: !!u.active };
    },

    async resend(d, ip) {
      const u = find(str(d.contact, 120).toLowerCase(), str(d.did, 100));
      if (!u) return { ok: false };
      if (!hit(`rs:ip:${ip}`, 300, 3600e3) || now() - u.last_sent < RESEND_GAP) return { ok: false, error: "rate" };
      try { await issueCode(u); } catch (e) { console.error("[mail]", e.message); return { ok: false, error: "mail" }; }
      return { ok: true };
    },

    verify,
    adminActivate: verify,   // ancien nom de l'action, même comportement

    /** Suppression du compte : efface toutes les données liées à ce contact (appareils, progression). */
    delete(d) {
      const u = find(str(d.contact, 120).toLowerCase(), str(d.did, 100));
      if (!u) return { ok: false };
      if (u.active) {
        const t = byToken(d.token);
        if (!t || t.contact !== u.contact) return { ok: false, error: "auth" };
        db.prepare("DELETE FROM users WHERE contact=?").run(u.contact);
        db.prepare("DELETE FROM sync WHERE contact=?").run(u.contact);
      } else db.prepare("DELETE FROM users WHERE id=?").run(u.id);
      return { ok: true };
    },

    logout(d) {
      if (typeof d.token === "string") db.prepare("DELETE FROM sessions WHERE token_hash=?").run(sha(d.token));
      return { ok: true };
    },

    /** Synchronisation de la progression : fusionne les données de l'appareil avec celles du compte. */
    sync(d) {
      const u = byToken(d.token);
      if (!u) return { ok: false, error: "auth" };
      if (!hit(`sy:${u.id}`, 120, 3600e3)) return { ok: false, error: "rate" };
      const row = db.prepare("SELECT data FROM sync WHERE contact=?").get(u.contact);
      const merged = mergeSync(row ? cleanSync(JSON.parse(row.data)) : cleanSync({}), cleanSync(d.data));
      const t = now();
      db.prepare("INSERT INTO sync (contact,data,updated_at) VALUES (?,?,?) ON CONFLICT(contact) DO UPDATE SET data=excluded.data, updated_at=excluded.updated_at")
        .run(u.contact, JSON.stringify(merged), t);
      return { ok: true, data: merged, updated_at: t };
    },

    /** Vérifie un code Premium (lié à l'identifiant d'appareil). */
    premium(d, ip) {
      if (!hit(`pm:ip:${ip}`, 20, 3600e3)) return { ok: false, error: "rate" };
      const did = str(d.did, 100).toUpperCase(), code = cleanCode(d.code);
      return { ok: !!did && code.length === 8 && safeEqual(cleanCode(premiumCode(cfg.serverSecret, did)), code) };
    },

    byToken,
    activateById: (id) => activate(id),
  };

  function activate(id) {
    db.prepare("UPDATE users SET active=1, activated_at=?, code_plain=NULL, code_hash=NULL, attempts=0 WHERE id=?").run(now(), id);
  }
}
