import { createServer } from "node:http";
import { openDb, readActivationFile, seedActivationHashes } from "./db.js";
import { makeAccounts } from "./accounts.js";
import { makeAssistant } from "./ai.js";
import { makeExams } from "./exams.js";
import { makeMailer } from "./mail.js";
import { makeLimiter, safeEqual, now, str, premiumCode } from "./util.js";
import { makeMsyPay } from "./msypay.js";

const MAX_BODY = 512 * 1024;

export function createApp(cfg, overrides = {}) {
  const db = overrides.db || openDb(cfg.dbFile);
  const hit = makeLimiter();
  if (cfg.activationFile) { const n = seedActivationHashes(db, readActivationFile(cfg.activationFile)); if (n) console.log(`${n} code(s) d'activation chargé(s).`); }
  const mail = overrides.mail || makeMailer({ apiKey: cfg.resendKey, from: cfg.mailFrom });
  const accounts = makeAccounts({ db, cfg, mail, hit });
  const exams = makeExams({ db, accounts, hit });
  const ask = makeAssistant({ db, cfg, accounts, fetchFn: overrides.fetchFn });
  // Encaissement des abonnements par MONDIASYSTEM (MSY PAY Développeurs, convention 55/45) : actif seulement si
  // MSY_PAY_API_KEY, MSY_PAY_WEBHOOK_SECRET et MSY_PAY_RETURN_URL sont définis ; sinon le paiement manuel reste.
  const pay = overrides.pay || makeMsyPay({ apiKey: cfg.msyPayKey, webhookSecret: cfg.msyPayWebhookSecret,
    returnUrl: cfg.msyPayReturnUrl, prix: { month: cfg.prixMois || 1500, life: cfg.prixVie || 3000 }, fetchFn: overrides.fetchFn });

  const kvGet = (k, def) => { const r = db.prepare("SELECT value FROM kv WHERE key=?").get(k); return r ? JSON.parse(r.value) : def; };
  const kvSet = (k, v) => db.prepare("INSERT INTO kv (key,value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").run(k, JSON.stringify(v));

  // ---- abonnements : essai 48 h (une fois par contact ET par appareil), mensuel, à vie ----
  db.exec("CREATE TABLE IF NOT EXISTS subs (contact TEXT PRIMARY KEY, did TEXT, trial_start INTEGER, plan TEXT, expires INTEGER, updated_at INTEGER)");
  const TRIAL_MS = 48 * 3600e3, MONTH_MS = 30 * 864e5;
  db.exec("CREATE TABLE IF NOT EXISTS msy_payments (reference TEXT PRIMARY KEY, payment_id TEXT, contact TEXT, did TEXT, plan TEXT, amount INTEGER, status TEXT, payment_url TEXT, created_at INTEGER, applied_at INTEGER)");
  const normC = (s) => { const r = str(s, 100).trim(); if (r.includes("@")) return r.toLowerCase(); let d = r.replace(/\D/g, ""); if (d.startsWith("00226")) d = d.slice(5); else if (d.length > 8 && d.startsWith("226")) d = d.slice(3); return d; };
  const validC = (c) => /^\d{8}$/.test(c) || /^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(c);
  function subStatus(d, ip) {
    if (!hit(`ss:${ip}`, 120, 3600e3)) return { ok: false, error: "rate" };
    const c = normC(d.contact), did = str(d.did, 100).toUpperCase();
    if (!validC(c)) return { ok: false, error: "invalid" };
    let r = db.prepare("SELECT * FROM subs WHERE contact=?").get(c);
    if (!r) {
      const used = did && db.prepare("SELECT 1 FROM subs WHERE did=? AND trial_start IS NOT NULL").get(did);
      db.prepare("INSERT INTO subs (contact,did,trial_start,updated_at) VALUES (?,?,?,?)").run(c, did, used ? null : Date.now(), Date.now());
      r = db.prepare("SELECT * FROM subs WHERE contact=?").get(c);
    }
    return { ok: true, now: Date.now(), trial_end: r.trial_start ? r.trial_start + TRIAL_MS : 0, plan: r.plan || "", expires: r.expires || 0 };
  }

  /** Même règle pour l'administration et pour MSY PAY : mensuel = +30 jours (jamais au-dessus d'un « à vie »). */
  function applySub(c, plan) {
    const cur = db.prepare("SELECT * FROM subs WHERE contact=?").get(c) || {};
    let np = cur.plan || "", exp = cur.expires || 0;
    if (plan === "life") { np = "life"; exp = 0; }
    else if (plan === "month") { if (np !== "life") { np = "month"; exp = Math.max(Date.now(), exp) + MONTH_MS; } }
    else { np = ""; exp = 0; }
    db.prepare("INSERT INTO subs (contact,did,trial_start,plan,expires,updated_at) VALUES (?,?,?,?,?,?) ON CONFLICT(contact) DO UPDATE SET plan=excluded.plan, expires=excluded.expires, updated_at=excluded.updated_at").run(c, cur.did || "", cur.trial_start ?? null, np, exp, Date.now());
    return { plan: np, expires: exp };
  }

  /** Applique UNE fois un paiement confirmé PAID par MSY PAY, au montant attendu. */
  function appliquerPaiement(pm) {
    if (!pm || pm.status !== "PAID" || !pm.reference) return false;
    const row = db.prepare("SELECT * FROM msy_payments WHERE reference=?").get(String(pm.reference));
    if (!row || row.applied_at || Number(pm.amount) !== row.amount) return false;
    let fait = false;
    db.exec("BEGIN");                                        // node:sqlite : transaction explicite (comme exams.js)
    try {
      const r = db.prepare("UPDATE msy_payments SET status='PAID', payment_id=COALESCE(?, payment_id), applied_at=? WHERE reference=? AND applied_at IS NULL")
        .run(pm.payment_id || null, Date.now(), row.reference);
      if (Number(r.changes) === 1) { applySub(row.contact, row.plan); fait = true; }
      db.exec("COMMIT");
    } catch (e) { db.exec("ROLLBACK"); throw e; }
    if (fait) console.log(`MSY PAY : abonnement ${row.plan} activé (${row.reference})`);
    return fait;
  }

  async function payStart(d, ip) {
    if (!pay.actif) return { ok: false, error: "indisponible" };
    if (!hit(`ps:${ip}`, 10, 3600e3)) return { ok: false, error: "rate" };
    const c = normC(d.contact), plan = String(d.plan || ""), did = str(d.did, 100).toUpperCase();
    if (!validC(c) || !["month", "life"].includes(plan)) return { ok: false, error: "invalid" };
    const ref = pay.reference(plan), amount = pay.prix[plan];
    db.prepare("INSERT INTO msy_payments (reference,contact,did,plan,amount,status,created_at) VALUES (?,?,?,?,?,'PENDING_PAYMENT',?)").run(ref, c, did, plan, amount, Date.now());
    try {
      const pm = await pay.demander({ reference: ref, plan, phone: /^\d{8}$/.test(c) ? "+226" + c : "", name: "" });
      db.prepare("UPDATE msy_payments SET payment_id=?, payment_url=? WHERE reference=?").run(pm.payment_id || null, pm.payment_url || null, ref);
      return pm.payment_url ? { ok: true, ref, url: pm.payment_url, amount } : { ok: false, error: "msy" };
    } catch (e) {
      console.error("[MSY PAY]", e.message);
      return { ok: false, error: "msy" };
    }
  }

  async function payCheck(d) {
    const ref = str(d.ref, 80), row = ref && db.prepare("SELECT * FROM msy_payments WHERE reference=?").get(ref);
    if (!row) return { ok: false, error: "invalid" };
    if (row.applied_at) return { ok: true, status: "PAID" };
    try {
      const pm = await pay.statut(row.payment_id || row.reference);
      appliquerPaiement(pm);
      return { ok: true, status: pm.status || "PENDING_PAYMENT" };
    } catch (e) {
      console.error("[MSY PAY]", e.message);
      return { ok: false, error: "msy" };
    }
  }

  function readRaw(req) {
    return new Promise((resolve, reject) => {
      let size = 0; const chunks = [];
      req.on("data", (c) => { size += c.length; if (size > MAX_BODY) { reject(Object.assign(new Error("big"), { status: 413 })); req.destroy(); } else chunks.push(c); });
      req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
      req.on("error", reject);
    });
  }

  const send = (res, status, body, type = "application/json; charset=utf-8") => {
    res.writeHead(status, {
      "Content-Type": type,
      "Access-Control-Allow-Origin": cfg.corsOrigin,
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    });
    res.end(typeof body === "string" ? body : JSON.stringify(body));
  };

  function readJson(req) {
    return new Promise((resolve, reject) => {
      let size = 0; const chunks = [];
      req.on("data", (c) => { size += c.length; if (size > MAX_BODY) { reject(Object.assign(new Error("big"), { status: 413 })); req.destroy(); } else chunks.push(c); });
      req.on("end", () => { try { resolve(JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}")); } catch { reject(Object.assign(new Error("json"), { status: 400 })); } });
      req.on("error", reject);
    });
  }

  const clientIp = (req) => (cfg.trustProxy && String(req.headers["x-forwarded-for"] || "").split(",")[0].trim()) || req.socket.remoteAddress || "?";

  const csv = (rows, cols) => [cols.join(","), ...rows.map((r) => cols.map((c) => `"${String(r[c] ?? "").replace(/"/g, '""')}"`).join(","))].join("\n");

  async function handleAction(d, ip) {
    switch (d.action) {
      case "signup": return accounts.signup(d, ip);
      case "resend": return accounts.resend(d, ip);
      case "verify": return accounts.verify(d, ip);
      case "adminactivate": return accounts.adminActivate(d, ip);
      case "delete": return accounts.delete(d);
      case "logout": return accounts.logout(d);
      case "sync": return accounts.sync(d);
      case "premium": return accounts.premium(d, ip);
      case "substatus": return subStatus(d, ip);
      case "paystart": return payStart(d, ip);
      case "paycheck": return payCheck(d);
      case "ask": return ask(d);
      case "exam_list": case "exam_get": case "exam_submit": case "exam_result": return exams.client[d.action](d);
      default: return { ok: false };
    }
  }

  async function handleAdmin(req, res, url) {
    const tok = String(req.headers.authorization || "").replace(/^Bearer\s+/i, "");
    if (!safeEqual(tok, cfg.adminToken)) return send(res, 401, { ok: false, error: "unauthorized" });
    const p = url.pathname, m = req.method;
    let x;
    if (m === "GET" && p === "/admin/stats") {
      const n = (sql) => db.prepare(sql).get().n;
      return send(res, 200, {
        users: n("SELECT COUNT(*) n FROM users"), actifs: n("SELECT COUNT(*) n FROM users WHERE active=1"),
        inscriptions: n("SELECT COUNT(*) n FROM registrations"),
        ia_6h: db.prepare("SELECT n FROM ai_usage WHERE k='all' ORDER BY win DESC LIMIT 1").get()?.n ?? 0,
      });
    }
    if (m === "GET" && p === "/admin/users") {
      const a = url.searchParams.get("active");
      const rows = db.prepare(`SELECT id,created_at,nom,prenom,naissance,contact,type,did,active,activated_at FROM users ${a === "0" || a === "1" ? "WHERE active=" + a : ""} ORDER BY id DESC LIMIT 500`).all();
      return send(res, 200, { ok: true, users: rows });
    }
    if (m === "GET" && p === "/admin/premium-code") {
      const did = str(url.searchParams.get("did"), 100).toUpperCase();
      return did ? send(res, 200, { ok: true, did, code: premiumCode(cfg.serverSecret, did) }) : send(res, 400, { ok: false });
    }
    if (m === "POST" && p === "/admin/subs") {   // activer / prolonger / retirer un abonnement après paiement vérifié
      const b = await readJson(req), c = normC(b.contact), plan = String(b.plan || "");
      if (!validC(c) || !["month", "life", "revoke"].includes(plan)) return send(res, 400, { ok: false });
      return send(res, 200, { ok: true, contact: c, ...applySub(c, plan) });
    }
    if (m === "GET" && p === "/admin/msy-payments")   // paiements MSY PAY : demandés, payés, appliqués
      return send(res, 200, { ok: true, payments: db.prepare("SELECT reference,payment_id,contact,plan,amount,status,created_at,applied_at FROM msy_payments ORDER BY created_at DESC LIMIT 1000").all() });
    if (m === "GET" && p === "/admin/subs")
      return send(res, 200, { ok: true, subs: db.prepare("SELECT contact,plan,expires,trial_start,updated_at FROM subs ORDER BY updated_at DESC LIMIT 1000").all() });
    if (m === "GET" && p === "/admin/activation-codes")
      return send(res, 200, { ok: true, codes: db.prepare("SELECT label, used_by, used_at FROM activation_codes ORDER BY label").all() });
    if ((x = p.match(/^\/admin\/activation-codes\/([\w-]+)\/release$/)) && m === "POST") {   // libérer un code (ex. attribué par erreur)
      db.prepare("UPDATE activation_codes SET used_by=NULL, used_did=NULL, used_at=NULL WHERE label=?").run(x[1]);
      return send(res, 200, { ok: true });
    }
    if (m === "GET" && p === "/admin/pending-codes")   // codes à envoyer à la main (SMS/WhatsApp) aux comptes « tel »
      return send(res, 200, { ok: true, items: db.prepare("SELECT id,nom,prenom,contact,code_plain AS code,code_expires FROM users WHERE type='tel' AND code_plain IS NOT NULL ORDER BY id DESC").all() });
    if ((x = p.match(/^\/admin\/users\/(\d+)(\/activate)?$/))) {
      const id = Number(x[1]);
      if (m === "POST" && x[2]) { accounts.activateById(id); return send(res, 200, { ok: true }); }
      if (m === "DELETE" && !x[2]) { db.prepare("DELETE FROM users WHERE id=?").run(id); return send(res, 200, { ok: true }); }
    }
    if (m === "GET" && p === "/admin/registrations") {
      const rows = db.prepare("SELECT id,created_at,ref,concours,payload FROM registrations ORDER BY id DESC LIMIT 5000").all();
      if (url.searchParams.get("format") === "csv") {
        const flat = rows.map((r) => ({ id: r.id, date: new Date(r.created_at).toISOString(), ...JSON.parse(r.payload) }));
        const cols = ["id", "date", "ref", "concours", "nom", "prenom", "naissance", "lieu", "sexe", "tel", "email", "cnib", "diplome"];
        return send(res, 200, csv(flat, cols), "text/csv; charset=utf-8");
      }
      return send(res, 200, { ok: true, registrations: rows.map((r) => ({ ...r, payload: JSON.parse(r.payload) })) });
    }
    if (m === "PUT" && (p === "/admin/feed" || p === "/admin/config")) {
      const body = await readJson(req);
      if (typeof body !== "object" || !body) return send(res, 400, { ok: false });
      kvSet(p === "/admin/feed" ? "feed" : "config", body);
      return send(res, 200, { ok: true });
    }
    const ex = await exams.admin(m, p, url, () => readJson(req));
    if (ex) return send(res, ex[0], ex[1], ex[2]);
    return send(res, 404, { ok: false, error: "not_found" });
  }

  const server = createServer(async (req, res) => {
    try {
      const url = new URL(req.url, "http://x"), p = url.pathname, ip = clientIp(req);
      if (req.method === "OPTIONS") return send(res, 204, "");
      if (p.startsWith("/admin/")) return await handleAdmin(req, res, url);
      if (req.method === "GET" && (p === "/" || p === "/health")) return send(res, 200, { ok: true, service: "prepconcours" });
      if (req.method === "GET" && p === "/feed.json") return send(res, 200, kvGet("feed", { notifications: [], concours: [] }));
      if (req.method === "GET" && p === "/config.json") return send(res, 200, kvGet("config", {}));
      if (req.method === "POST" && p === "/msy-pay/avis") {      // avis signé de MSY PAY (paiement confirmé)
        const brut = await readRaw(req);
        if (!pay.avisValide(brut, req.headers["x-msy-timestamp"], req.headers["x-msy-signature"])) return send(res, 401, { ok: false });
        let avis = {}; try { avis = JSON.parse(brut); } catch { return send(res, 400, { ok: false }); }
        const id = avis && avis.payment && (avis.payment.payment_id || avis.payment.reference);
        if (!id) return send(res, 400, { ok: false });
        appliquerPaiement(await pay.statut(id));                  // l'avis est un signal ; le statut fait foi
        return send(res, 200, { ok: true });
      }
      if (req.method === "GET" && p === "/msy-pay/retour")         // page de retour après paiement (navigateur)
        return send(res, 200, "<!doctype html><meta charset=utf-8><meta name=viewport content='width=device-width'><title>PREP' CONCOURS BF</title><body style='font-family:sans-serif;text-align:center;padding:40px'><h2>Merci !</h2><p>Retourne dans l'application PREP' CONCOURS BF et touche <b>« Vérifier mon abonnement »</b>.</p></body>", "text/html; charset=utf-8");
      if (req.method === "POST" && p === "/register") {          // REGISTER_URL de l'app
        const d = await readJson(req);
        if (!hit(`rg:${ip}`, 20, 3600e3)) return send(res, 429, { ok: false, error: "rate" });
        if (!d || typeof d !== "object" || !str(d.ref, 60)) return send(res, 400, { ok: false });
        const payload = {}; for (const k of ["ref", "concours", "nom", "prenom", "naissance", "lieu", "sexe", "tel", "email", "cnib", "diplome"]) payload[k] = str(String(d[k] ?? ""), 200);
        db.prepare("INSERT INTO registrations (created_at,ref,concours,payload) VALUES (?,?,?,?)").run(now(), payload.ref, payload.concours, JSON.stringify(payload));
        return send(res, 200, { ok: true });
      }
      if (req.method === "POST" && (p === "/" || p === "/api")) {  // ACCOUNT_URL / AI_URL de l'app
        const d = await readJson(req);
        return send(res, 200, await handleAction(d && typeof d === "object" ? d : {}, ip));
      }
      return send(res, 404, { ok: false, error: "not_found" });
    } catch (e) {
      if (e.status) return send(res, e.status, { ok: false });
      console.error("[erreur]", e);
      return send(res, 500, { ok: false, error: "server" });
    }
  });
  server.on("close", () => { try { db.close(); } catch {} });
  return server;
}
