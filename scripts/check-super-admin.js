const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkSuperAdmin() {
  try {
    console.log('🔍 Checking SUPER_ADMIN user...');
    
    const superAdmin = await prisma.user.findUnique({
      where: { email: 'admin@icct.edu.ph' }
    });
    
    if (superAdmin) {
      console.log('✅ SUPER_ADMIN user found:');
      console.log('Email:', superAdmin.email);
      console.log('Role:', superAdmin.role);
      console.log('Status:', superAdmin.status);
      console.log('Failed attempts:', superAdmin.failedLoginAttempts);
      console.log('Email verified:', superAdmin.isEmailVerified);
      
      // Test password verification
      const testPassword = 'admin123';
      const isValid = await bcrypt.compare(testPassword, superAdmin.passwordHash);
      console.log('Password verification test:', isValid ? '✅ PASS' : '❌ FAIL');
      
      if (!isValid) {
        console.log('\n🔧 Fixing password...');
        const newPasswordHash = await bcrypt.hash('admin123', 10);
        await prisma.user.update({
          where: { email: 'admin@icct.edu.ph' },
          data: { 
            passwordHash: newPasswordHash,
            failedLoginAttempts: 0
          }
        });
        console.log('✅ Password updated successfully!');
        
        // Test again
        const updatedUser = await prisma.user.findUnique({
          where: { email: 'admin@icct.edu.ph' }
        });
        const isValidAfter = await bcrypt.compare('admin123', updatedUser.passwordHash);
        console.log('Password verification after fix:', isValidAfter ? '✅ PASS' : '❌ FAIL');
      }
    } else {
      console.log('❌ SUPER_ADMIN user not found');
      console.log('🔧 Creating SUPER_ADMIN user...');
      
      const passwordHash = await bcrypt.hash('admin123', 10);
      const newSuperAdmin = await prisma.user.create({
        data: {
          userName: 'superadmin',
          email: 'admin@icct.edu.ph',
          passwordHash: passwordHash,
          role: 'SUPER_ADMIN',
          status: 'ACTIVE',
          isEmailVerified: true,
          twoFactorEnabled: false
        }
      });
      
      console.log('✅ SUPER_ADMIN user created successfully!');
      console.log('Email: admin@icct.edu.ph');
      console.log('Password: admin123');
    }
    
    console.log('\n🔑 FINAL CREDENTIALS:');
    console.log('Email: admin@icct.edu.ph');
    console.log('Password: admin123');
    console.log('Role: SUPER_ADMIN');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkSuperAdmin();
