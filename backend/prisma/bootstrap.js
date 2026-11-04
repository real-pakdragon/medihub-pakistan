// First-run setup for a fresh server.
//
// Creates the admin login (and the MDCAT countdown row) without adding any
// sample books, topics or posts. Safe to run every time the API starts.
import bcrypt from 'bcryptjs';

import { prisma } from '../src/lib/prisma.js';
import { env } from '../src/config/env.js';

const passwordHash = await bcrypt.hash(env.seedAdminPassword, 10);

await prisma.admin.upsert({
  where: { email: env.seedAdminEmail },
  update: {},
  create: { email: env.seedAdminEmail, passwordHash, role: 'admin' },
});
console.log(`[bootstrap] admin ready: ${env.seedAdminEmail}`);

const existingConfig = await prisma.mdcatConfig.findUnique({ where: { id: 1 } });
if (!existingConfig) {
  await prisma.mdcatConfig.create({
    data: {
      id: 1,
      launchDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
      currentPhase: 'Registration Open',
      phaseDescription:
        'The full-length MDCAT mock test goes live soon. Register below for early access and receive the paper and solutions before public release.',
    },
  });
  console.log('[bootstrap] mdcat config created');
}

await prisma.$disconnect();
