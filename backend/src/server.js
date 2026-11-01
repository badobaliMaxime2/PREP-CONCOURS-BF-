import { createApp } from "./app.js";

const env = process.env;
const need = (k) => { if (!env[k]) { console.error(`Variable d'environnement manquante : ${k} (voir .env.example)`); process.exit(1); } return env[k]; };

const cfg = {
  port: Number(env.PORT || 3000),
  dbFile: env.DB_FILE || "./data/prepconcours.db",
  serverSecret: need("SERVER_SECRET"),
  adminToken: need("ADMIN_TOKEN"),
  adminCodes: (env.ADMIN_CODES || "").split(",").map((s) => s.trim()).filter(Boolean),
  corsOrigin: env.CORS_ORIGIN || "*",
  trustProxy: env.TRUST_PROXY === "1",
  aiProvider: env.AI_PROVIDER || "gemini",
  aiKey: env.AI_KEY || "",
  aiModel: env.AI_MODEL || "",
  useWeb: env.USE_WEB === "1",
  maxParAppareil: Number(env.MAX_PAR_APPAREIL || 25),
  maxGlobal: Number(env.MAX_GLOBAL || 800),
  resendKey: env.RESEND_API_KEY || "",
  mailFrom: env.MAIL_FROM || "PREP' CONCOURS BF <onboarding@resend.dev>",
  smsSid: env.SMS_SID,
  smsToken: env.SMS_TOKEN,
  smsFrom: env.SMS_FROM,
  // MSY PAY Développeurs (encaissement par MONDIASYSTEM) : les deux secrets viennent de mondiasystem.com/store-publier
  msyPayKey: env.MSY_PAY_API_KEY || "",
  msyPayWebhookSecret: env.MSY_PAY_WEBHOOK_SECRET || "",
  msyPayReturnUrl: env.MSY_PAY_RETURN_URL || "",
  prixMois: Number(env.PRIX_MOIS || 1500),
  prixVie: Number(env.PRIX_VIE || 3000),
  // MSY Mail (MONDIASYSTEM) : e-mails signés DKIM depuis no-reply@mondiasystem.com — clé créée sur mondiasystem.com/msy-cloud
  msyMailKey: env.MSY_MAIL_KEY || "",
  msyMailUrl: env.MSY_MAIL_URL || "https://mondiasystem.com/api/cloud/apps/prep-concours/mail",
};
if (cfg.serverSecret.length < 16 || cfg.adminToken.length < 16) { console.error("SERVER_SECRET et ADMIN_TOKEN doivent faire au moins 16 caractères."); process.exit(1); }

if (!cfg.adminCodes.length) console.warn("ADMIN_CODES vide : aucun code administrateur ne fonctionnera (voir DEPLOY.md).");
for (const c of cfg.adminCodes) if (c.replace(/[^A-Za-z0-9]/g, "").length < 10) console.warn("Un code administrateur est trop court (moins de 10 caractères) : génère-en un avec « node scripts/admin-code.js ».");

const server = createApp(cfg);
server.listen(cfg.port, () => console.log(`PREP' CONCOURS BF : serveur prêt sur le port ${cfg.port}`));
for (const s of ["SIGINT", "SIGTERM"]) process.on(s, () => server.close(() => process.exit(0)));
