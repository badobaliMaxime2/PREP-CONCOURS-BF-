export function createSms(cfg = {}) {
  const { smsSid, smsToken, smsFrom } = cfg;

  return {
    async send(to, text) {
      if (!smsSid || !smsToken || !smsFrom) {
        console.log(`[SMS simulé] ${to} : ${text}`);
        return { ok: true, simulated: true };
      }
      const res = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${smsSid}/Messages.json`,
        {
          method: "POST",
          headers: {
            Authorization:
              "Basic " + Buffer.from(`${smsSid}:${smsToken}`).toString("base64"),
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({ To: to, From: smsFrom, Body: text }),
        }
      );
      if (!res.ok) {
        const err = await res.text();
        throw new Error(`Échec SMS (${res.status}) : ${err}`);
      }
      return { ok: true };
    },
  };
}
