import { randomInt } from "node:crypto";
import { now, str } from "./util.js";

const ALPHA = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const GRACE = 5 * 60e3;               // marge réseau après la fin du temps : au-delà, la copie est reçue mais marquée « hors délai »
const STATUTS = ["brouillon", "ouvert", "ferme"];
const J = (v, d) => { try { return v ? JSON.parse(v) : d; } catch { return d; } };
const round2 = (x) => Math.round(x * 100) / 100;
const ts = (v) => { if (v === null || v === "" || v === undefined) return null; const n = typeof v === "number" ? v : Date.parse(v); return Number.isFinite(n) ? n : null; };

export function mention(n20) {
  if (n20 >= 16) return "Très bien";
  if (n20 >= 14) return "Bien";
  if (n20 >= 12) return "Assez bien";
  if (n20 >= 10) return "Passable";
  return "Ajourné";
}

/** La copie appartient à l'examen, pas au compte : si le compte est supprimé, la copie reste (user_id = NULL) et garde sa place au classement. */
const copiesDdl = (head) => `${head} (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      exam_id INTEGER NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
      user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      ref TEXT NOT NULL UNIQUE,
      created_at INTEGER NOT NULL, started_at INTEGER, late INTEGER NOT NULL DEFAULT 0,
      candidat TEXT NOT NULL, reponses TEXT NOT NULL,
      statut TEXT NOT NULL DEFAULT 'recue',          -- recue | encours | corrigee
      notes TEXT, total REAL, sur REAL, appreciation TEXT, corrected_at INTEGER,
      auto INTEGER NOT NULL DEFAULT 0,               -- 1 = copie créée par le serveur à partir du dernier brouillon, à l'échéance
      UNIQUE (exam_id, user_id)
    )`;
const COPY_COLS = "id,exam_id,user_id,ref,created_at,started_at,late,candidat,reponses,statut,notes,total,sur,appreciation,corrected_at,auto";

export function initExamTables(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS exams (
      id INTEGER PRIMARY KEY AUTOINCREMENT, created_at INTEGER NOT NULL,
      titre TEXT NOT NULL, description TEXT, consignes TEXT,
      duree_min INTEGER NOT NULL DEFAULT 120,
      ouvre INTEGER, ferme INTEGER,
      statut TEXT NOT NULL DEFAULT 'brouillon',
      questions TEXT NOT NULL,
      resultats_publies INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS exam_starts (
      exam_id INTEGER NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      started_at INTEGER NOT NULL, PRIMARY KEY (exam_id, user_id)
    );
    ${copiesDdl("CREATE TABLE IF NOT EXISTS copies")};
    CREATE TABLE IF NOT EXISTS exam_drafts (        -- dernier brouillon reçu du téléphone (sauvegarde toutes les ~30 s)
      exam_id INTEGER NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      candidat TEXT NOT NULL, reponses TEXT NOT NULL, saved_at INTEGER NOT NULL,
      PRIMARY KEY (exam_id, user_id)
    );
  `);
  if (!db.prepare("PRAGMA table_info(copies)").all().some((c) => c.name === "auto"))   // base créée avant cette version
    db.exec("ALTER TABLE copies ADD COLUMN auto INTEGER NOT NULL DEFAULT 0");
  /* Migration : anciennes bases où supprimer un compte supprimait aussi ses copies (ON DELETE CASCADE) → reconstruction de la table, données conservées. */
  if (db.prepare("PRAGMA foreign_key_list(copies)").all().some((f) => f.table === "users" && f.on_delete === "CASCADE")) {
    db.exec("PRAGMA foreign_keys = OFF");
    try {
      db.exec("BEGIN");
      db.exec(copiesDdl("CREATE TABLE copies_new"));
      db.exec(`INSERT INTO copies_new (${COPY_COLS}) SELECT ${COPY_COLS} FROM copies`);
      db.exec("DROP TABLE copies; ALTER TABLE copies_new RENAME TO copies");
      db.exec("COMMIT");
    } catch (e) { try { db.exec("ROLLBACK"); } catch {} throw e; }
    finally { db.exec("PRAGMA foreign_keys = ON"); }
  }
}

export function makeExams({ db, accounts, hit }) {
  const examRow = (id) => db.prepare("SELECT * FROM exams WHERE id=?").get(Number(id));
  const qsOf = (e) => J(e.questions, []);
  const sur = (qs) => qs.reduce((s, q) => s + q.points, 0);
  const newRef = (examId) => { for (;;) { let r = ""; for (let i = 0; i < 5; i++) r += ALPHA[randomInt(0, 32)]; r = `CP${examId}-${r}`; if (!db.prepare("SELECT 1 FROM copies WHERE ref=?").get(r)) return r; } };
  const window_ = (e, t) => (!e.ouvre || t >= e.ouvre) && (!e.ferme || t <= e.ferme);
  /** Fin du temps du candidat : durée écoulée depuis son ouverture, sans jamais dépasser la fermeture de l'examen. */
  const deadline = (e, started) => { const d = started + e.duree_min * 60e3; return e.ferme ? Math.min(d, e.ferme) : d; };
  const cleanRep = (e, src) => { const o = {}, s = src && typeof src === "object" ? src : {}; for (const q of qsOf(e)) o[q.id] = str(String(s[q.id] ?? ""), 20000); return o; };
  const cleanCand = (src) => { const c = src && typeof src === "object" ? src : {}, o = {};
    for (const [k, n] of [["nom", 80], ["prenom", 80], ["naissance", 20], ["lieu", 80], ["sexe", 10], ["tel", 20], ["contact", 120], ["did", 100], ["cnib", 30], ["concours", 120], ["niveau", 80]]) o[k] = str(String(c[k] ?? ""), n);
    return o; };
  const insertCopy = (e, userId, started, t, late, cand, rep, auto) => { const ref = newRef(e.id);
    db.prepare("INSERT INTO copies (exam_id,user_id,ref,created_at,started_at,late,candidat,reponses,sur,auto) VALUES (?,?,?,?,?,?,?,?,?,?)")
      .run(e.id, userId, ref, t, started, late, JSON.stringify(cand), JSON.stringify(rep), sur(qsOf(e)), auto ? 1 : 0);
    db.prepare("DELETE FROM exam_drafts WHERE exam_id=? AND user_id=?").run(e.id, userId);
    return ref; };

  /** Transforme en copies les brouillons dont le temps est écoulé (marge réseau comprise) et dont le candidat n'a rien envoyé. */
  function sweep(t = now()) {
    const rows = db.prepare(`SELECT d.exam_id, d.user_id, d.candidat, d.reponses, s.started_at FROM exam_drafts d
      JOIN exam_starts s ON s.exam_id=d.exam_id AND s.user_id=d.user_id
      WHERE NOT EXISTS (SELECT 1 FROM copies c WHERE c.exam_id=d.exam_id AND c.user_id=d.user_id)`).all();
    let n = 0;
    for (const r of rows) {
      const e = examRow(r.exam_id); if (!e) continue;
      const end = deadline(e, r.started_at); if (t <= end + GRACE) continue;   // il peut encore envoyer lui-même
      const cand = J(r.candidat, {}), u = db.prepare("SELECT nom,prenom,contact,did FROM users WHERE id=?").get(r.user_id) || {};
      for (const k of ["nom", "prenom", "contact", "did"]) if (!cand[k]) cand[k] = u[k] || (k === "nom" || k === "prenom" ? "?" : "");
      insertCopy(e, r.user_id, r.started_at, end, 0, cand, J(r.reponses, {}), true); n++;
    }
    return n;
  }

  function cleanQuestions(arr) {
    if (!Array.isArray(arr) || arr.length < 1 || arr.length > 60) return null;
    const out = [];
    for (let i = 0; i < arr.length; i++) {
      const enonce = str(arr[i] && arr[i].enonce, 4000), p = Number(arr[i] && arr[i].points);
      if (!enonce) return null;
      out.push({ id: "q" + (i + 1), enonce, points: Number.isFinite(p) && p > 0 && p <= 100 ? round2(p) : 1 });
    }
    return out;
  }

  function ranking(examId) {
    const rows = db.prepare("SELECT * FROM copies WHERE exam_id=? AND statut='corrigee' ORDER BY total DESC, created_at ASC").all(examId);
    let rang = 0, last = null, i = 0;
    return rows.map((c) => { i++; if (c.total !== last) { rang = i; last = c.total; } const cand = J(c.candidat, {}); const n20 = c.sur ? round2(c.total / c.sur * 20) : 0;
      return { rang, ref: c.ref, copie_id: c.id, nom: cand.nom, prenom: cand.prenom, contact: cand.contact, total: c.total, sur: c.sur, note20: n20, mention: mention(n20) }; });
  }

  /* ------------------------- côté candidat (jeton de session) ------------------------- */
  const client = {
    exam_list(d) {
      const u = accounts.byToken(d.token); if (!u) return { ok: false, error: "auth" };
      const t = now();
      const items = db.prepare("SELECT * FROM exams WHERE statut IN ('ouvert','ferme') ORDER BY id DESC LIMIT 50").all().map((e) => {
        const c = db.prepare("SELECT ref,statut,created_at FROM copies WHERE exam_id=? AND user_id=?").get(e.id, u.id);
        return { id: e.id, titre: e.titre, description: e.description || "", duree_min: e.duree_min, ouvre: e.ouvre, ferme: e.ferme,
          ouvert: e.statut === "ouvert" && window_(e, t), nb_questions: qsOf(e).length, sur: sur(qsOf(e)),
          resultats: !!e.resultats_publies, copie: c ? { ref: c.ref, statut: c.statut === "corrigee" && e.resultats_publies ? "corrigee" : "recue", date: c.created_at } : null };
      });
      return { ok: true, now: t, items };
    },

    /** Ouvre l'épreuve : le chronomètre démarre ici, côté serveur (la première ouverture fait foi). */
    exam_get(d) {
      const u = accounts.byToken(d.token); if (!u) return { ok: false, error: "auth" };
      if (!hit(`eg:${u.id}`, 60, 3600e3)) return { ok: false, error: "rate" };
      const e = examRow(d.id); if (!e || e.statut === "brouillon") return { ok: false, error: "notfound" };
      const c = db.prepare("SELECT ref FROM copies WHERE exam_id=? AND user_id=?").get(e.id, u.id);
      if (c) return { ok: true, deja: true, ref: c.ref };
      const t = now();
      let st = db.prepare("SELECT started_at FROM exam_starts WHERE exam_id=? AND user_id=?").get(e.id, u.id);
      if (!st) {
        if (e.statut !== "ouvert" || !window_(e, t)) return { ok: false, error: "closed" };
        db.prepare("INSERT INTO exam_starts (exam_id,user_id,started_at) VALUES (?,?,?)").run(e.id, u.id, t);
        st = { started_at: t };
      }
      const qs = qsOf(e);
      return { ok: true, now: t, debut: st.started_at, limite: deadline(e, st.started_at),
        exam: { id: e.id, titre: e.titre, description: e.description || "", consignes: e.consignes || "", duree_min: e.duree_min, sur: sur(qs), questions: qs } };
    },

    /** Dépôt de la copie. Idempotent : un renvoi après coupure réseau renvoie la même référence. */
    exam_submit(d) {
      const u = accounts.byToken(d.token); if (!u) return { ok: false, error: "auth" };
      if (!hit(`es:${u.id}`, 30, 3600e3)) return { ok: false, error: "rate" };
      const e = examRow(d.id); if (!e || e.statut === "brouillon") return { ok: false, error: "notfound" };
      const old = db.prepare("SELECT ref,created_at FROM copies WHERE exam_id=? AND user_id=?").get(e.id, u.id);
      if (old) return { ok: true, already: true, ref: old.ref, recu: old.created_at };
      const st = db.prepare("SELECT started_at FROM exam_starts WHERE exam_id=? AND user_id=?").get(e.id, u.id);
      if (!st) return { ok: false, error: "notstarted" };
      const qs = qsOf(e), rep = cleanRep(e, d.reponses), cand = cleanCand(d.candidat);
      if (!cand.nom || !cand.prenom) return { ok: false, error: "invalid" };
      const t = now(), late = t > deadline(e, st.started_at) + GRACE ? 1 : 0;
      const ref = insertCopy(e, u.id, st.started_at, t, late, cand, rep, false);
      return { ok: true, ref, recu: t, late: !!late };
    },

    /** Sauvegarde du brouillon sur le serveur : si le candidat disparaît, sa dernière version devient sa copie à l'échéance. */
    exam_draft(d) {
      const u = accounts.byToken(d.token); if (!u) return { ok: false, error: "auth" };
      if (!hit(`ed:${u.id}`, 400, 3600e3)) return { ok: false, error: "rate" };
      const e = examRow(d.id); if (!e || e.statut === "brouillon") return { ok: false, error: "notfound" };
      const old = db.prepare("SELECT ref FROM copies WHERE exam_id=? AND user_id=?").get(e.id, u.id);
      if (old) return { ok: true, deja: true, ref: old.ref };
      const st = db.prepare("SELECT started_at FROM exam_starts WHERE exam_id=? AND user_id=?").get(e.id, u.id);
      if (!st) return { ok: false, error: "notstarted" };
      const t = now(); if (t > deadline(e, st.started_at) + GRACE) return { ok: false, error: "closed" };
      db.prepare(`INSERT INTO exam_drafts (exam_id,user_id,candidat,reponses,saved_at) VALUES (?,?,?,?,?)
        ON CONFLICT(exam_id,user_id) DO UPDATE SET candidat=excluded.candidat, reponses=excluded.reponses, saved_at=excluded.saved_at`)
        .run(e.id, u.id, JSON.stringify(cleanCand(d.candidat)), JSON.stringify(cleanRep(e, d.reponses)), t);
      return { ok: true, saved: t };
    },

    /** Résultat personnel : uniquement une fois publié par le président du jury. */
    exam_result(d) {
      const u = accounts.byToken(d.token); if (!u) return { ok: false, error: "auth" };
      const e = examRow(d.id); if (!e) return { ok: false, error: "notfound" };
      const c = db.prepare("SELECT * FROM copies WHERE exam_id=? AND user_id=?").get(e.id, u.id);
      if (!c) return { ok: false, error: "nocopy" };
      if (!e.resultats_publies || c.statut !== "corrigee") return { ok: true, publie: false, ref: c.ref };
      const n20 = c.sur ? round2(c.total / c.sur * 20) : 0, rk = ranking(e.id), me = rk.find((r) => r.copie_id === c.id);
      return { ok: true, publie: true, ref: c.ref, total: c.total, sur: c.sur, note20: n20, mention: mention(n20), appreciation: c.appreciation || "",
        rang: me ? me.rang : null, effectif: rk.length, notes: J(c.notes, {}) };
    },
  };

  /* ------------------------- côté jury (jeton administrateur déjà vérifié) ------------------------- */
  const copyView = (c) => { const cand = J(c.candidat, {}); return { id: c.id, ref: c.ref, created_at: c.created_at, late: !!c.late, auto: !!c.auto, statut: c.statut,
    nom: cand.nom, prenom: cand.prenom, contact: cand.contact, total: c.total, sur: c.sur,
    note20: c.statut === "corrigee" && c.total != null && c.sur ? round2(c.total / c.sur * 20) : null,   // pas de note affichée tant que la correction est partielle
    mention: c.statut === "corrigee" && c.total != null && c.sur ? mention(c.total / c.sur * 20) : null }; };
  const flat = (v) => { const s = String(v ?? ""); return /^[=+\-@\t\r]/.test(s) ? "'" + s : s; };
  const csv = (rows, cols) => [cols.join(","), ...rows.map((r) => cols.map((c) => `"${flat(r[c]).replace(/"/g, '""')}"`).join(","))].join("\n");

  async function admin(m, p, url, body) {
    let x; sweep();   // les brouillons échus deviennent des copies avant toute lecture ou publication
    if (m === "GET" && p === "/admin/exams") {
      const rows = db.prepare("SELECT * FROM exams ORDER BY id DESC LIMIT 200").all().map((e) => ({
        id: e.id, titre: e.titre, statut: e.statut, duree_min: e.duree_min, ouvre: e.ouvre, ferme: e.ferme, resultats_publies: !!e.resultats_publies,
        nb_questions: qsOf(e).length, sur: sur(qsOf(e)),
        copies: db.prepare("SELECT COUNT(*) n FROM copies WHERE exam_id=?").get(e.id).n,
        corrigees: db.prepare("SELECT COUNT(*) n FROM copies WHERE exam_id=? AND statut='corrigee'").get(e.id).n }));
      return [200, { ok: true, exams: rows }];
    }
    if (m === "POST" && p === "/admin/exams") {
      const d = await body(), qs = cleanQuestions(d.questions), titre = str(d.titre, 200);
      if (!titre || !qs) return [400, { ok: false, error: "invalid" }];
      const dur = Math.min(600, Math.max(5, Math.round(Number(d.duree_min)) || 120));
      const statut = STATUTS.includes(d.statut) ? d.statut : "brouillon";
      const r = db.prepare("INSERT INTO exams (created_at,titre,description,consignes,duree_min,ouvre,ferme,statut,questions) VALUES (?,?,?,?,?,?,?,?,?)")
        .run(now(), titre, str(d.description, 1000), str(d.consignes, 3000), dur, ts(d.ouvre), ts(d.ferme), statut, JSON.stringify(qs));
      return [200, { ok: true, id: Number(r.lastInsertRowid) }];
    }
    if ((x = p.match(/^\/admin\/exams\/(\d+)$/))) {
      const e = examRow(x[1]); if (!e) return [404, { ok: false, error: "notfound" }];
      const nb = db.prepare("SELECT COUNT(*) n FROM copies WHERE exam_id=?").get(e.id).n;
      if (m === "GET") return [200, { ok: true, exam: { id: e.id, titre: e.titre, description: e.description, consignes: e.consignes, duree_min: e.duree_min, ouvre: e.ouvre, ferme: e.ferme,
        statut: e.statut, resultats_publies: !!e.resultats_publies, questions: qsOf(e), sur: sur(qsOf(e)), copies: nb } }];
      if (m === "PUT") {
        const d = await body(), sets = [], vals = [];
        if (d.titre !== undefined) { const t = str(d.titre, 200); if (!t) return [400, { ok: false, error: "invalid" }]; sets.push("titre=?"); vals.push(t); }
        if (d.description !== undefined) { sets.push("description=?"); vals.push(str(d.description, 1000)); }
        if (d.consignes !== undefined) { sets.push("consignes=?"); vals.push(str(d.consignes, 3000)); }
        if (d.duree_min !== undefined) { sets.push("duree_min=?"); vals.push(Math.min(600, Math.max(5, Math.round(Number(d.duree_min)) || 120))); }
        if (d.ouvre !== undefined) { sets.push("ouvre=?"); vals.push(ts(d.ouvre)); }
        if (d.ferme !== undefined) { sets.push("ferme=?"); vals.push(ts(d.ferme)); }
        if (d.statut !== undefined) { if (!STATUTS.includes(d.statut)) return [400, { ok: false, error: "invalid" }]; sets.push("statut=?"); vals.push(d.statut); }
        if (d.questions !== undefined) {
          if (nb) return [409, { ok: false, error: "has_copies" }];   // sujet figé dès qu'une copie est reçue
          const qs = cleanQuestions(d.questions); if (!qs) return [400, { ok: false, error: "invalid" }];
          sets.push("questions=?"); vals.push(JSON.stringify(qs));
        }
        if (sets.length) db.prepare(`UPDATE exams SET ${sets.join(",")} WHERE id=?`).run(...vals, e.id);
        return [200, { ok: true }];
      }
      if (m === "DELETE") {
        if (nb) return [409, { ok: false, error: "has_copies" }];
        db.prepare("DELETE FROM exams WHERE id=?").run(e.id); return [200, { ok: true }];
      }
    }
    if ((x = p.match(/^\/admin\/exams\/(\d+)\/copies$/)) && m === "GET") {
      const e = examRow(x[1]); if (!e) return [404, { ok: false, error: "notfound" }];
      return [200, { ok: true, titre: e.titre, sur: sur(qsOf(e)), copies: db.prepare("SELECT * FROM copies WHERE exam_id=? ORDER BY created_at ASC").all(e.id).map(copyView) }];
    }
    if ((x = p.match(/^\/admin\/exams\/(\d+)\/publish$/)) && m === "POST") {
      const e = examRow(x[1]); if (!e) return [404, { ok: false, error: "notfound" }];
      const d = await body(), pub = d.publie === true;
      if (pub && !d.force) {
        const n = db.prepare("SELECT COUNT(*) n FROM copies WHERE exam_id=? AND statut!='corrigee'").get(e.id).n;
        if (n) return [409, { ok: false, error: "ungraded", restantes: n }];
      }
      db.prepare("UPDATE exams SET resultats_publies=? WHERE id=?").run(pub ? 1 : 0, e.id);
      return [200, { ok: true, publie: pub }];
    }
    if ((x = p.match(/^\/admin\/exams\/(\d+)\/ranking$/)) && m === "GET") {
      const e = examRow(x[1]); if (!e) return [404, { ok: false, error: "notfound" }];
      const rk = ranking(e.id);
      if (url.searchParams.get("format") === "csv") return [200, csv(rk, ["rang", "ref", "nom", "prenom", "contact", "total", "sur", "note20", "mention"]), "text/csv; charset=utf-8"];
      return [200, { ok: true, titre: e.titre, classement: rk }];
    }
    if ((x = p.match(/^\/admin\/copies\/(\d+)$/)) && m === "GET") {
      const c = db.prepare("SELECT * FROM copies WHERE id=?").get(Number(x[1])); if (!c) return [404, { ok: false, error: "notfound" }];
      const e = examRow(c.exam_id);
      return [200, { ok: true, copie: { ...copyView(c), candidat: J(c.candidat, {}), reponses: J(c.reponses, {}), notes: J(c.notes, {}), appreciation: c.appreciation || "", debut: c.started_at },
        exam: { id: e.id, titre: e.titre, questions: qsOf(e), sur: sur(qsOf(e)), resultats_publies: !!e.resultats_publies } }];
    }
    if ((x = p.match(/^\/admin\/copies\/(\d+)\/grade$/)) && m === "POST") {
      const c = db.prepare("SELECT * FROM copies WHERE id=?").get(Number(x[1])); if (!c) return [404, { ok: false, error: "notfound" }];
      const e = examRow(c.exam_id), qs = qsOf(e), d = await body(), src = d.notes && typeof d.notes === "object" ? d.notes : {};
      const notes = {}; let total = 0, all = true;
      for (const q of qs) {
        const raw = src[q.id], n = raw === "" || raw === null || raw === undefined ? NaN : Number(raw);
        if (Number.isFinite(n)) { notes[q.id] = Math.min(q.points, Math.max(0, round2(n))); total += notes[q.id]; } else all = false;
      }
      total = round2(total);
      db.prepare("UPDATE copies SET notes=?, total=?, sur=?, appreciation=?, statut=?, corrected_at=? WHERE id=?")
        .run(JSON.stringify(notes), total, sur(qs), str(d.appreciation, 1000), all ? "corrigee" : "encours", now(), c.id);
      const n20 = round2(total / sur(qs) * 20);
      return [200, { ok: true, total, sur: sur(qs), note20: n20, mention: mention(n20), statut: all ? "corrigee" : "encours" }];
    }
    return null;
  }

  return { client, admin, sweep };
}
