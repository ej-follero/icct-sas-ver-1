const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

(async () => {
  const prisma = new PrismaClient();
  try {
    const email = process.env.TEST_ADMIN_EMAIL || 'admin@test.local';
    const password = process.env.TEST_ADMIN_PASSWORD || 'Passw0rd!Admin';

    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          userName: 'admin_test',
          email,
          passwordHash: await bcrypt.hash(password, 10),
          role: 'ADMIN',
          status: 'ACTIVE',
          isEmailVerified: true,
        }
      });
      console.log('Created admin:', email);
    } else {
      console.log('Admin exists:', email);
    }
  } catch (e) {
    console.error('Failed to create admin:', e.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();
