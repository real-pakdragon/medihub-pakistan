import { randomBytes } from 'node:crypto';

import { prisma } from '../lib/prisma.js';
import { env } from '../config/env.js';

const newToken = () => randomBytes(32).toString('hex');

export const contactService = {
  async submitMessage({ name, email, subject, message }) {
    return prisma.contactMessage.create({ data: { name, email, subject, message } });
  },

  async listMessages({ status, page, limit }) {
    const where = status ? { status } : {};
    const [items, total] = await prisma.$transaction([
      prisma.contactMessage.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.contactMessage.count({ where }),
    ]);
    return { data: items, meta: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) } };
  },

  async updateStatus(id, status) {
    const existing = await prisma.contactMessage.findUnique({ where: { id } });
    if (!existing) return null;
    return prisma.contactMessage.update({ where: { id }, data: { status } });
  },
};

export const subscriberService = {
  async subscribe(email) {
    const existing = await prisma.subscriber.findUnique({ where: { email } });

    if (existing?.confirmed) {
      return { alreadyConfirmed: true, token: null };
    }

    if (existing) {
      const updated = await prisma.subscriber.update({
        where: { id: existing.id },
        data: { subscribedAt: new Date() },
      });
      return { alreadyConfirmed: false, token: updated.confirmationToken };
    }

    const created = await prisma.subscriber.create({
      data: { email, confirmationToken: newToken() },
    });
    return { alreadyConfirmed: false, token: created.confirmationToken };
  },

  async confirm(token) {
    const subscriber = await prisma.subscriber.findUnique({ where: { confirmationToken: token } });
    if (!subscriber) return null;
    if (subscriber.confirmed) return subscriber;
    return prisma.subscriber.update({ where: { id: subscriber.id }, data: { confirmed: true } });
  },

  async listAll() {
    const [items, confirmedCount] = await prisma.$transaction([
      prisma.subscriber.findMany({ orderBy: { subscribedAt: 'desc' }, take: 500 }),
      prisma.subscriber.count({ where: { confirmed: true } }),
    ]);
    return { items, confirmedCount };
  },

  async studentsConnected() {
    const confirmed = await prisma.subscriber.count({ where: { confirmed: true } });
    return env.studentsBaseline + confirmed;
  },
};
