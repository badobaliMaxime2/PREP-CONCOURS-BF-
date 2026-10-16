import { str } from "./util.js";

/** Nettoie et borne les données de progression envoyées par l'app (jamais de confiance au client). */
export function cleanSync(d) {
  d = d && typeof d === "object" ? d : {};
  const hist = (Array.isArray(d.hist) ? d.hist : []).slice(-1500).map((x) => {
    if (!x || typeof x !== "object") return null;
    const by = {};
    if (x.by && typeof x.by === "object")
      for (const [k, v] of Object.entries(x.by).slice(0, 30)) if (Array.isArray(v) && v.length === 2) by[str(k, 20)] = [+v[0] || 0, +v[1] || 0];
    return { m: str(x.m, 20), s: +x.s || 0, t: +x.t || 0, d: +x.d || 0, mode: str(x.mode, 20), by };
  }).filter((x) => x && x.d > 0 && x.t > 0);
  const cq = (Array.isArray(d.cq) ? d.cq : []).slice(0, 500).map((x) => {
    if (!x || !Array.isArray(x.o) || x.o.length !== 4) return null;
    const q = str(x.q, 500); if (!q) return null;
    return { m: str(x.m, 20), q, o: x.o.map((o) => str(String(o), 300)), a: Math.max(0, Math.min(3, Math.trunc(+x.a) || 0)), e: str(x.e, 600) };
  }).filter(Boolean);
  return { hist, cq, cqAt: +d.cqAt || 0, target: str(d.target, 200), targetAt: +d.targetAt || 0 };
}

/** Fusion : historique = union (par date+matière) ; questions perso et objectif = le plus récent gagne. */
export function mergeSync(a, b) {
  const seen = new Map();
  for (const x of [...a.hist, ...b.hist]) seen.set(x.d + "|" + x.m, x);
  const hist = [...seen.values()].sort((x, y) => x.d - y.d).slice(-1500);
  const empty = (v) => (Array.isArray(v) ? !v.length : !v);
  const pick = (k, at) => (b[at] > a[at] || (b[at] === a[at] && empty(a[k]))) ? b : a;
  const c = pick("cq", "cqAt"), t = pick("target", "targetAt");
  return { hist, cq: c.cq, cqAt: c.cqAt, target: t.target, targetAt: t.targetAt };
}
