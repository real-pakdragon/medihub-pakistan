import { env } from '../config/env.js';
import { mailer } from '../config/mail.js';

const layout = (title, bodyHtml) => `
  <div style="font-family:'Segoe UI',Helvetica,Arial,sans-serif;background:#e1f0f7;padding:32px 16px;">
    <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 8px 24px rgba(11,59,92,.12);">
      <div style="background:linear-gradient(135deg,#0b3b5c,#1a6b8a);padding:22px 28px;">
        <span style="color:#ffffff;font-size:20px;font-weight:700;">MediHub Pakistan</span>
      </div>
      <div style="padding:28px;color:#123;font-size:15px;line-height:1.6;">
        <h2 style="margin:0 0 14px;color:#0b3b5c;font-size:18px;">${title}</h2>
        ${bodyHtml}
        <p style="margin-top:26px;font-size:13px;color:#64748b;">
          You are receiving this email because you interacted with medihub.pk.
          If this wasn't you, you can safely ignore it.
        </p>
      </div>
      <div style="background:#f1f7fa;padding:16px 28px;text-align:center;font-size:12px;color:#5a7d90;">
        Study resources for Pakistani MBBS &amp; MDCAT students
      </div>
    </div>
  </div>`;

export const emails = {
  contactAdminNotification: ({ name, email, subject, message }) => ({
    to: env.adminNotifyEmail,
    replyTo: email,
    subject: `New contact message: ${subject}`,
    text: `From: ${name} <${email}>\nSubject: ${subject}\n\n${message}`,
    html: layout(
      'New contact form submission',
      `<p><strong>Name:</strong> ${name}<br/>
         <strong>Email:</strong> <a href="mailto:${email}">${email}</a><br/>
         <strong>Subject:</strong> ${subject}</p>
       <p style="white-space:pre-line;">${message}</p>
       <p style="font-size:12px;color:#94a3b8;">Reply directly to this email — it will reach the sender.</p>`
    ),
  }),

  contactAutoReply: ({ name, email, subject }) => ({
    to: email,
    subject: 'We have received your message — MediHub Pakistan',
    text: `Hello ${name},\n\nThank you for contacting MediHub Pakistan regarding "${subject}". Your message has been received and our team will respond within 48 hours.\n\nRegards,\nThe MediHub Pakistan Team`,
    html: layout(
      'Thank you for contacting us',
      `<p>Hello ${name},</p>
       <p>Thank you for contacting MediHub Pakistan regarding <strong>"${subject}"</strong>. Your message has been received and our team will respond within 48 hours.</p>
       <p>In the meantime, feel welcome to browse the MBBS Resource Library and the MDCAT Prep section on our website.</p>
       <p style="margin-bottom:0;"><strong>Regards,</strong><br/>The MediHub Pakistan Team</p>`
    ),
  }),

  subscriberConfirmation: ({ email }, token) => ({
    to: email,
    subject: 'Confirm your MDCAT early-access registration',
    text: `Thank you for registering for early access to the MediHub MDCAT mock test.\n\nConfirm your email address:\n${env.apiUrl}/api/subscribe/confirm/${token}\n\nIf you did not register, please ignore this email.`,
    html: layout(
      'Confirm your email address',
      `<p>Hello,</p>
       <p>You have registered for <strong>early access</strong> to the MediHub MDCAT mock test and solutions pack. Please confirm your email address to complete your registration:</p>
       <p style="text-align:center;margin:26px 0;">
         <a href="${env.apiUrl}/api/subscribe/confirm/${token}"
            style="display:inline-block;background:#1a6b8a;color:#fff;text-decoration:none;padding:12px 30px;border-radius:999px;font-weight:600;">
           Confirm my registration
         </a>
       </p>
       <p style="font-size:13px;color:#64748b;">Or paste this link into your browser:<br/>${env.apiUrl}/api/subscribe/confirm/${token}</p>`
    ),
  }),
};

export function sendEmail(message) {
  return mailer.send(message).catch((err) => {
    console.error(`[mail] Failed to deliver "${message.subject}":`, err.message);
  });
}
