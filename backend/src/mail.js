/** Envoi d'e-mails.
 * 1. MSY Mail (MONDIASYSTEM, MSY CLOUD) si MSY_MAIL_KEY est défini : expéditeur no-reply@mondiasystem.com au nom de
 *    l'application, signé DKIM — les codes arrivent en boîte de réception.
 * 2. Sinon Resend (https://resend.com) si RESEND_API_KEY est défini (attention : l'expéditeur de test
 *    onboarding@resend.dev ne livre qu'au titulaire du compte Resend).
 * 3. Sans clé : le message est écrit dans la console (développement).
 */
export function makeMailer({ apiKey, from, msyKey = "", msyUrl = "", fetchFn = fetch, log = console }) {
  return {
    async send(to, subject, text) {
      if (msyKey && msyUrl) {
        const r = await fetchFn(msyUrl, {
          method: "POST",
          headers: { Authorization: `Bearer ${msyKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({ to, subject, text }),
        });
        if (!r.ok) throw new Error(`MSY Mail ${r.status}`);
        return;
      }
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
