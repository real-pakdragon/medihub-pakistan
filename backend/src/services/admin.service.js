import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import { env } from '../config/env.js';
import { prisma } from '../lib/prisma.js';
import { createHttpError } from '../lib/httpError.js';

export const adminService = {
  async login(email, password) {
    const admin = await prisma.admin.findUnique({ where: { email } });
    if (!admin) throw createHttpError(401, 'Incorrect email or password.');

    const valid = await bcrypt.compare(password, admin.passwordHash);
    if (!valid) throw createHttpError(401, 'Incorrect email or password.');

    const token = jwt.sign({ sub: admin.id, email: admin.email, role: admin.role }, env.jwtSecret, {
      expiresIn: env.jwtExpiresIn,
    });

    return { token, admin: { id: admin.id, email: admin.email, role: admin.role } };
  },

  async dashboardStats() {
    const [resources, messages, newMessages, subscribers, categories, contentItems, posts] = await prisma.$transaction([
      prisma.resource.count(),
      prisma.contactMessage.count(),
      prisma.contactMessage.count({ where: { status: 'new' } }),
      prisma.subscriber.count(),
      prisma.category.count(),
      prisma.contentItem.count(),
      prisma.post.count(),
    ]);
    return { resources, messages, newMessages, subscribers, categories, contentItems, posts };
  },
};
