import nodemailer from "nodemailer";

/**
 * Отправка email. В production использует Yandex SMTP (env SMTP_*).
 * В dev (нет SMTP_HOST) — логирует письмо в консоль, реально не отправляет.
 */

const host = process.env["SMTP_HOST"];
const port = Number(process.env["SMTP_PORT"] ?? 465);
const user = process.env["SMTP_USER"];
const pass = process.env["SMTP_PASS"];
const from = process.env["SMTP_FROM"] ?? user ?? "noreply@svadba.local";

const isConfigured = Boolean(host && user && pass);

const transporter = isConfigured
  ? nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user: user!, pass: pass! },
    })
  : null;

export async function sendMail(opts: {
  to: string;
  subject: string;
  text: string;
}): Promise<void> {
  if (!transporter) {
    console.log(
      `[email:dev] To: ${opts.to}\nSubject: ${opts.subject}\n${opts.text}`,
    );
    return;
  }
  await transporter.sendMail({
    from,
    to: opts.to,
    subject: opts.subject,
    text: opts.text,
  });
}

/** true если SMTP не настроен — тогда код можно показать прямо в UI (dev) */
export const isEmailDevMode = !isConfigured;
