const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function setupAdminCredentials() {
  try {
    console.log('🔍 Checking existing admin users...');
    
    // Check existing admin users
    const existingAdmins = await prisma.user.findMany({
      where: { role: { in: ['SUPER_ADMIN', 'ADMIN'] } }
    });
    
    console.log('📋 Existing admin users:');
    existingAdmins.forEach(user => {
      console.log(`- Email: ${user.email}, Role: ${user.role}, Status: ${user.status}`);
    });
    
    // Create/update SUPER_ADMIN
    console.log('\n🔧 Setting up SUPER_ADMIN credentials...');
    const superAdminPassword = await bcrypt.hash('admin123', 10);
    
    const superAdmin = await prisma.user.upsert({
      where: { email: 'admin@icct.edu.ph' },
      update: {
        passwordHash: superAdminPassword,
        role: 'SUPER_ADMIN',
        status: 'ACTIVE',
        failedLoginAttempts: 0,
        isEmailVerified: true
      },
      create: {
        userName: 'superadmin',
        email: 'admin@icct.edu.ph',
        passwordHash: superAdminPassword,
        role: 'SUPER_ADMIN',
        status: 'ACTIVE',
        isEmailVerified: true
      }
    });
    
    // Create/update regular ADMIN
    console.log('🔧 Setting up ADMIN credentials...');
    const adminPassword = await bcrypt.hash('admin456', 10);
    
    const admin = await prisma.user.upsert({
      where: { email: 'admin1@icct.edu.ph' },
      update: {
        passwordHash: adminPassword,
        role: 'ADMIN',
        status: 'ACTIVE',
        failedLoginAttempts: 0,
        isEmailVerified: true
      },
      create: {
        userName: 'admin1',
        email: 'admin1@icct.edu.ph',
        passwordHash: adminPassword,
        role: 'ADMIN',
        status: 'ACTIVE',
        isEmailVerified: true
      }
    });
    
    console.log('\n✅ Admin credentials setup complete!');
    console.log('\n🔑 VALID LOGIN CREDENTIALS:');
    console.log('\n📧 SUPER_ADMIN:');
    console.log('   Email: admin@icct.edu.ph');
    console.log('   Password: admin123');
    console.log('   Role: SUPER_ADMIN (Full system access)');
    console.log('\n📧 ADMIN:');
    console.log('   Email: admin1@icct.edu.ph');
    console.log('   Password: admin456');
    console.log('   Role: ADMIN (General admin access)');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

setupAdminCredentials();
