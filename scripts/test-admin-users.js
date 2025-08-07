const { PrismaClient, Role, UserStatus } = require('@prisma/client');

async function testAdminUsers() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Testing admin users database connection...');
    
    // Test database connection
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    
    // Count all users
    const totalUsers = await prisma.user.count();
    console.log(`📊 Total users in database: ${totalUsers}`);
    
    // Count admin users
    const adminUsers = await prisma.user.findMany({
      where: {
        role: {
          in: [Role.ADMIN, Role.SUPER_ADMIN]
        }
      }
    });
    
    console.log(`👥 Admin users found: ${adminUsers.length}`);
    
    // Display admin users
    adminUsers.forEach((user, index) => {
      console.log(`\n${index + 1}. Admin User:`);
      console.log(`   ID: ${user.userId}`);
      console.log(`   Username: ${user.userName}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Status: ${user.status}`);
      console.log(`   2FA Enabled: ${user.twoFactorEnabled}`);
      console.log(`   Last Login: ${user.lastLogin || 'Never'}`);
    });
    
    // Test API endpoint
    console.log('\n🌐 Testing API endpoint...');
    const response = await fetch('http://localhost:3000/api/admin-users');
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ API endpoint working! Found ${data.data.length} admin users`);
    } else {
      console.log(`❌ API endpoint failed with status: ${response.status}`);
    }
    
  } catch (error) {
    console.error('❌ Error testing admin users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testAdminUsers(); 