// Updates the admin password on a running server.
// Used by deploy/selfhost/reset-password.sh
import bcrypt from 'bcryptjs';

import { prisma } from '../src/lib/prisma.js';

const email = process.env.ADMIN_EMAIL || process.env.SEED_ADMIN_EMAIL || 'admin@medihub.pk';
const password = process.env.ADMIN_PASSWORD;

if (!password || password.length < 6) {
  console.error('ADMIN_PASSWORD must be at least 6 characters');
  process.exit(1);
}

const passwordHash = await bcrypt.hash(password, 10);

await prisma.admin.upsert({
  where: { email },
  update: { passwordHash },
  create: { email, passwordHash, role: 'admin' },
});

console.log(`Password updated for ${email}`);
await prisma.$disconnect();
