const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

async function main() {
  const prisma = new PrismaClient();
  const email = process.env.NEW_SUPERADMIN_EMAIL || 'superadmin@icct.edu.ph';
  const password = process.env.NEW_SUPERADMIN_PASSWORD || 'SuperAdmin123!';
  const userName = process.env.NEW_SUPERADMIN_NAME || 'Super Administrator';

  try {
    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.upsert({
      where: { email },
      update: {
        userName,
        passwordHash,
        role: 'SUPER_ADMIN',
        status: 'ACTIVE',
        failedLoginAttempts: 0,
      },
      create: {
        userName,
        email,
        passwordHash,
        role: 'SUPER_ADMIN',
        status: 'ACTIVE',
      },
      select: {
        userId: true,
        email: true,
        role: true,
        status: true,
      },
    });

    console.log(JSON.stringify({
      success: true,
      message: 'SUPER_ADMIN user upserted',
      user,
      generatedPassword: process.env.NEW_SUPERADMIN_PASSWORD ? undefined : password,
    }));
  } catch (e) {
    console.error(JSON.stringify({ success: false, error: e?.message || String(e) }));
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();


