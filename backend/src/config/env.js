import 'dotenv/config';
import path from 'node:path';

const required = (name, fallback) => {
  const value = process.env[name] ?? fallback;
  if (value === undefined || value === '') {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
};

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  isProd: (process.env.NODE_ENV ?? 'development') === 'production',
  port: Number(process.env.PORT ?? 5000),

  databaseUrl: required('DATABASE_URL', 'postgresql://postgres:postgres@localhost:5432/medihub?schema=public'),

  jwtSecret: required('JWT_SECRET', 'dev-only-secret-change-me'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '12h',

  clientOrigins: (process.env.CLIENT_ORIGIN ?? 'http://localhost:5173')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean),
  webAppUrl: process.env.WEB_APP_URL ?? 'http://localhost:5173',

  filesDir: process.env.FILES_DIR ?? path.resolve(process.cwd(), 'data/files'),
  apiUrl: process.env.API_URL ?? `http://localhost:${process.env.PORT ?? 5000}`,

  mailFrom: process.env.MAIL_FROM ?? 'MediHub Pakistan <no-reply@medihub.pk>',
  adminNotifyEmail: process.env.ADMIN_NOTIFY_EMAIL,
  contactAutoReply: process.env.CONTACT_AUTOREPLY !== 'false',
  smtp: {
    host: process.env.SMTP_HOST || null,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === 'true' || Number(process.env.SMTP_PORT) === 465,
    user: process.env.SMTP_USER || null,
    pass: process.env.SMTP_PASS || null,
  },

  studentsBaseline: Number(process.env.STUDENTS_BASELINE ?? 12400),

  seedAdminEmail: process.env.SEED_ADMIN_EMAIL ?? 'admin@medihub.pk',
  seedAdminPassword: process.env.SEED_ADMIN_PASSWORD ?? 'ChangeMe!2024',
};
