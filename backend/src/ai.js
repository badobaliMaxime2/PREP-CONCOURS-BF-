import { SYSTEM } from "./prompt.js";
import { now } from "./util.js";

const DEFAULT_MODELS = { gemini: "gemini-2.5-flash", openai: "gpt-4o-mini", anthropic: "claude-haiku-5-5" };
const WINDOW = 6 * 3600e3;

export function makeAssistant({ db, cfg, accounts, fetchFn = fetch }) {
  const provider = (cfg.aiProvider || "gemini").toLowerCase();
  const model = cfg.aiModel || DEFAULT_MODELS[provider];

  function bump(k, win, max) {   // incrémente de façon atomique ; false si le plafond est atteint
    db.prepare("INSERT OR IGNORE INTO ai_usage (k,win,n) VALUES (?,?,0)").run(k, win);
    return db.prepare("UPDATE ai_usage SET n=n+1 WHERE k=? AND win=? AND n<?").run(k, win, max).changes > 0;
  }

  async function post(url, headers, body) {
    const res = await fetchFn(url, { method: "POST", headers: { "Content-Type": "application/json", ...headers }, body: JSON.stringify(body), signal: AbortSignal.timeout(30000) });
    let j = {}; try { j = await res.json(); } catch {}
    return { code: res.status, j };
  }
  const fail = (r, extra) => {
    if (r.code === 429) return { ok: false, error: "limit" };
    const m = (r.j && r.j.error && (r.j.error.message || r.j.error)) || extra || r.code;
    return { ok: false, error: "ai", detail: String(m).slice(0, 140) };
  };

  const callers = {
    async gemini(msgs) {
      const body = {
        systemInstruction: { parts: [{ text: SYSTEM }] },
        contents: msgs.map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] })),
        generationConfig: { maxOutputTokens: 1500, temperature: 0.4 },
      };
      if (/2\.5-flash/.test(model)) body.generationConfig.thinkingConfig = { thinkingBudget: 0 };
      if (cfg.useWeb) body.tools = [{ google_search: {} }];
      const r = await post(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, { "x-goog-api-key": cfg.aiKey }, body);
      const cand = r.j?.candidates?.[0];
      const t = (cand?.content?.parts || []).filter((p) => p.text && !p.thought).map((p) => p.text).join("");
      return t ? { ok: true, reply: t } : fail(r, cand?.finishReason || r.j?.promptFeedback?.blockReason);
    },
    async openai(msgs) {
      const r = await post("https://api.openai.com/v1/chat/completions", { Authorization: `Bearer ${cfg.aiKey}` },
        { model, max_completion_tokens: 900, messages: [{ role: "system", content: SYSTEM }, ...msgs] });
      const t = r.j?.choices?.[0]?.message?.content;
      return t ? { ok: true, reply: t } : fail(r);
    },
    async anthropic(msgs) {
      const body = { model, max_tokens: 700, system: SYSTEM, messages: msgs };
      if (cfg.useWeb) body.tools = [{ type: "web_search_20250305", name: "web_search", max_uses: 3 }];
      const r = await post("https://api.anthropic.com/v1/messages", { "x-api-key": cfg.aiKey, "anthropic-version": "2023-06-01" }, body);
      const t = (r.j?.content || []).filter((b) => b.type === "text").map((b) => b.text).join("");
      return t ? { ok: true, reply: t } : fail(r);
    },
  };

  return async function ask(d) {
    if (!cfg.aiKey || !callers[provider]) return { ok: false, error: "config" };
    const user = accounts.byToken(d.token);
    if (!user) return { ok: false, error: "auth" };   // comptes activés (avec session) uniquement

    const win = Math.floor(now() / WINDOW);
    if (!bump("all", win, cfg.maxGlobal) || !bump("u:" + user.contact, win, cfg.maxParAppareil)) return { ok: false, error: "limit" };

    const msgs = [];
    (Array.isArray(d.history) ? d.history : []).slice(-6).forEach((m) => {
      if (m && (m.role === "user" || m.role === "assistant") && m.content) msgs.push({ role: m.role, content: String(m.content).slice(0, 600) });
    });
    const q = String(d.message || "").slice(0, 600), ctx = String(d.context || "").slice(0, 900);
    if (!q.trim()) return { ok: false, error: "invalid" };
    msgs.push({ role: "user", content: ctx ? `Contenu de l'application (à utiliser s'il est pertinent) :\n${ctx}\n\nQuestion : ${q}` : q });

    const clean = [];                                   // alternance stricte user / assistant
    for (const m of msgs) {
      if (clean.length && clean[clean.length - 1].role === m.role) clean[clean.length - 1].content += "\n" + m.content;
      else clean.push({ ...m });
    }
    while (clean.length && clean[0].role !== "user") clean.shift();
    try { return await callers[provider](clean); }
    catch (e) { return { ok: false, error: "ai", detail: String(e.message || e).slice(0, 120) }; }
  };
}
