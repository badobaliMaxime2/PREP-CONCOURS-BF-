// Sauvegarde cohérente de la base (même serveur en marche) : node scripts/backup.js [dossier]
import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
const src = process.env.DB_FILE || "./data/prepconcours.db";
const dir = process.argv[2] || "./backups";
mkdirSync(dir, { recursive: true });
const out = `${dir}/prepconcours-${new Date().toISOString().slice(0, 10)}.db`;
const db = new DatabaseSync(src);
db.exec(`VACUUM INTO '${out.replace(/'/g, "''")}'`);
db.close();
console.log("Sauvegarde créée :", out);
