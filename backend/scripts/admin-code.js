// Génère un code administrateur long (impossible à deviner) et les lignes à copier.
//   node scripts/admin-code.js          → 1 code      |   node scripts/admin-code.js 2   → 2 codes
import { randomInt, createHash } from "node:crypto";
const A = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";   // sans caractères ambigus (0/O, 1/I)
const n = Math.max(1, Math.min(10, Number(process.argv[2]) || 1));
const codes = Array.from({ length: n }, () => {
  const c = Array.from({ length: 12 }, () => A[randomInt(0, 32)]).join("");
  return c.replace(/(.{4})(.{4})(.{4})/, "$1-$2-$3");
});
const hash = (c) => createHash("sha256").update("PCBF|" + c.replace(/[^A-Za-z0-9]/g, "").toUpperCase()).digest("hex");
console.log("Codes (à donner aux personnes à activer, à garder secrets) :\n  " + codes.join("\n  "));
console.log("\nSur le serveur (variable d'environnement) :\n  ADMIN_CODES=" + codes.join(","));
console.log("\nDans l'application, fichier data.js (empreintes seulement : les codes ne sont jamais dans l'APK) :\n  ADMIN_HASHES: [" + codes.map((c) => `"${hash(c)}"`).join(", ") + "],");
