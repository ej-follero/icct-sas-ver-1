const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

async function main() {
  const prisma = new PrismaClient();
  const email = process.env.NEW_ADMIN_EMAIL || 'admin2@icct.edu.ph';
  const password = process.env.NEW_ADMIN_PASSWORD || 'Admin123!';

  try {
    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.upsert({
      where: { email },
      update: {
        passwordHash,
        failedLoginAttempts: 0,
        status: 'ACTIVE',
      },
      create: {
        userName: 'Administrator',
        email,
        passwordHash,
        role: 'ADMIN',
        status: 'ACTIVE',
      }
    });

    console.log(JSON.stringify({
      success: true,
      email: user.email,
      password,
      role: user.role,
    }));
  } catch (e) {
    console.error(JSON.stringify({ success: false, error: e?.message || String(e) }));
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();


