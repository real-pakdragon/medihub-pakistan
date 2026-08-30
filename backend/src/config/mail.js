import nodemailer from 'nodemailer';

import { env } from './env.js';

let transporter;

if (env.smtp.host && env.smtp.user && env.smtp.pass) {
  transporter = nodemailer.createTransport({
    host: env.smtp.host,
    port: env.smtp.port,
    secure: env.smtp.secure,
    auth: { user: env.smtp.user, pass: env.smtp.pass },
  });
} else {
  console.warn('[mail] SMTP is not configured — emails will be logged to the console instead of sent.');
  transporter = nodemailer.createTransport({ jsonTransport: true });
}

export const mailer = {
  async send({ to, subject, html, text, replyTo }) {
    if (!env.smtp.host) {
      console.log(`[mail] (not sent — no SMTP) to=${to} subject="${subject}"`);
      return null;
    }
    return transporter.sendMail({ from: env.mailFrom, to, subject, html, text, replyTo });
  },
};
