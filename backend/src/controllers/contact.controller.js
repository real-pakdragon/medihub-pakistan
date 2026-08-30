import { contactService, subscriberService } from '../services/contact.service.js';
import { emails, sendEmail } from '../services/email.service.js';
import { env } from '../config/env.js';

export const contactController = {
  async submit(req, res, next) {
    try {
      const saved = await contactService.submitMessage(req.body);

      if (env.adminNotifyEmail) {
        sendEmail(emails.contactAdminNotification(saved));
      }
      if (env.contactAutoReply) {
        sendEmail(emails.contactAutoReply(req.body));
      }

      res.status(201).json({ message: 'Message received. Our team will reply within 48 hours.' });
    } catch (err) {
      next(err);
    }
  },

  async list(req, res, next) {
    try {
      res.json(await contactService.listMessages(req.query));
    } catch (err) {
      next(err);
    }
  },

  async updateStatus(req, res, next) {
    try {
      const updated = await contactService.updateStatus(req.params.id, req.body.status);
      if (!updated) {
        return res.status(404).json({ error: { message: 'Message not found' } });
      }
      res.json({ data: updated });
    } catch (err) {
      next(err);
    }
  },
};

export const subscribeController = {
  async subscribe(req, res, next) {
    try {
      const { email } = req.body;
      const { alreadyConfirmed, token } = await subscriberService.subscribe(email);

      if (!alreadyConfirmed && token) {
        sendEmail(emails.subscriberConfirmation({ email }, token));
      }

      res.status(201).json({
        message: alreadyConfirmed
          ? 'This email is already registered for early access — no further action is required.'
          : 'Registration received. Check your inbox and confirm your email address to complete your early-access registration.',
      });
    } catch (err) {
      next(err);
    }
  },

  async confirm(req, res, next) {
    try {
      const subscriber = await subscriberService.confirm(req.params.token);
      if (!subscriber) {
        return res.redirect(`${env.webAppUrl}/subscribe/confirmed?status=invalid`);
      }
      res.redirect(`${env.webAppUrl}/subscribe/confirmed?status=success`);
    } catch (err) {
      next(err);
    }
  },

  async list(_req, res, next) {
    try {
      const { items, confirmedCount } = await subscriberService.listAll();
      res.json({ data: items, meta: { total: items.length, confirmedCount } });
    } catch (err) {
      next(err);
    }
  },
};
