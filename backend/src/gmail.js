import nodemailer from "nodemailer";

export function makeGmail(env) {
  if (!env.GMAIL_USER || !env.GMAIL_APP_PASSWORD) return null;
  const t = nodemailer.createTransport({
    service: "gmail",
    auth: { user: env.GMAIL_USER, pass: env.GMAIL_APP_PASSWORD },
  });
  return {
    send: (to, subject, text) =>
      t.sendMail({ from: `"PREP' CONCOURS BF" <${env.GMAIL_USER}>`, to, subject, text }),
  };
}
