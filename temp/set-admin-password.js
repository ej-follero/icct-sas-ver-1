const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

async function main() {
  const prisma = new PrismaClient();
  try {
    const hash = await bcrypt.hash('Admin123!', 12);
    await prisma.user.update({
      where: { email: 'admin1@icct.edu.ph' },
      data: { passwordHash: hash, failedLoginAttempts: 0 },
    });
    console.log('OK');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


