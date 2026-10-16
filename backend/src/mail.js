/** Envoi d'e-mails via l'API Resend (https://resend.com). Sans clé : le message est écrit dans la console (développement). */
export function makeMailer({ apiKey, from, fetchFn = fetch, log = console }) {
  return {
    async send(to, subject, text) {
      if (!apiKey) { log.log(`[mail:dev] à ${to} | ${subject} | ${text.replace(/\n/g, " ")}`); return; }
      const r = await fetchFn("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from, to: [to], subject, text }),
      });
      if (!r.ok) throw new Error(`mail ${r.status}`);
    },
  };
}
