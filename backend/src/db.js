import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { initExamTables } from "./exams.js";
import { readFileSync, existsSync } from "node:fs";

export function openDb(file) {
  if (file !== ":memory:") mkdirSync(dirname(file), { recursive: true });
  const db = new DatabaseSync(file);
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS users (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      created_at   INTEGER NOT NULL,
      nom          TEXT, prenom TEXT, naissance TEXT,
      contact      TEXT NOT NULL,
      type         TEXT NOT NULL CHECK (type IN ('email','tel')),
      did          TEXT NOT NULL,
      code_hash    TEXT,
      code_plain   TEXT,              -- uniquement pour type 'tel' (envoi manuel par l'admin), effacé à l'activation
      code_expires INTEGER,
      attempts     INTEGER NOT NULL DEFAULT 0,
      last_sent    INTEGER NOT NULL DEFAULT 0,
      active       INTEGER NOT NULL DEFAULT 0,
      activated_at INTEGER,
      UNIQUE (contact, did)
    );
    CREATE INDEX IF NOT EXISTS users_did ON users(did);
    CREATE TABLE IF NOT EXISTS registrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      created_at INTEGER NOT NULL,
      ref TEXT, concours TEXT, payload TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS ai_usage (
      k TEXT NOT NULL, win INTEGER NOT NULL, n INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (k, win)
    );
    CREATE TABLE IF NOT EXISTS sessions (
      token_hash TEXT PRIMARY KEY,
      user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS sync (
      contact TEXT PRIMARY KEY, data TEXT NOT NULL, updated_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS activation_codes (
      hash TEXT PRIMARY KEY, label TEXT, created_at INTEGER NOT NULL,
      used_by TEXT, used_did TEXT, used_at INTEGER
    );
    CREATE TABLE IF NOT EXISTS kv (key TEXT PRIMARY KEY, value TEXT NOT NULL);
  `);
  initExamTables(db);
  return db;
}

/** Lit activation-hashes.txt (lignes « 001 <sha256> ») : seules les empreintes sont stockées, jamais les codes. */
export function readActivationFile(file) {
  if (!file || !existsSync(file)) return [];
  return readFileSync(file, "utf8").split("\n").map((l) => l.trim().split(/\s+/)).filter((p) => p.length === 2 && /^[0-9a-f]{64}$/.test(p[1])).map((p) => ({ label: p[0], hash: p[1] }));
}
/** Ajoute les codes manquants (les codes déjà utilisés ne sont jamais réinitialisés). */
export function seedActivationHashes(db, entries) {
  const st = db.prepare("INSERT OR IGNORE INTO activation_codes (hash,label,created_at) VALUES (?,?,?)");
  let n = 0; for (const e of entries) n += Number(st.run(e.hash, e.label, Date.now()).changes);
  return n;
}
