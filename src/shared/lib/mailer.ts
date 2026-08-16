import { env } from '@/config/env';

export function isEmailConfigured(): boolean {
  return Boolean(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS);
}

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

let cachedTransporter: import('nodemailer').Transporter | null = null;

async function getTransporter() {
  if (cachedTransporter) return cachedTransporter;
  const nodemailer = await import('nodemailer');
  cachedTransporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
  });
  return cachedTransporter;
}

/**
 * Sends an email when SMTP is configured; otherwise logs it to the console
 * as a safe dev-mode fallback so callers never need an if/else on whether
 * email is wired up yet. Never throws — a failed/unconfigured send should
 * not break the request that triggered it (registration, checkout, etc.).
 */
export async function sendEmail({ to, subject, html, text }: SendEmailParams): Promise<boolean> {
  if (!isEmailConfigured()) {
    console.log(`[mailer] Email not configured — would have sent to ${to}: "${subject}"\n${text || html}`);
    return false;
  }

  try {
    const transporter = await getTransporter();
    await transporter.sendMail({
      from: env.SMTP_FROM || env.SMTP_USER,
      to,
      subject,
      html,
      text,
    });
    return true;
  } catch (error) {
    console.error('[mailer] Failed to send email', error);
    return false;
  }
}
