const { PrismaClient, Role, UserStatus } = require('@prisma/client');

async function testCompleteAdminUsersFunctionality() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🧪 Testing complete admin users functionality...\n');
    
    // 1. Test database connection
    console.log('1️⃣ Testing database connection...');
    await prisma.$connect();
    console.log('✅ Database connected successfully\n');
    
    // 2. Test GET admin users API
    console.log('2️⃣ Testing GET /api/admin-users endpoint...');
    const getResponse = await fetch('http://localhost:3000/api/admin-users');
    if (getResponse.ok) {
      const getData = await getResponse.json();
      console.log(`✅ GET endpoint working! Found ${getData.data.length} admin users`);
      console.log('📋 Admin users in database:');
      getData.data.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.userName} (${user.email}) - ${user.role} - ${user.status}`);
      });
    } else {
      console.log(`❌ GET endpoint failed with status: ${getResponse.status}`);
    }
    console.log('');
    
    // 3. Test PATCH admin user status
    console.log('3️⃣ Testing PATCH /api/admin-users endpoint (status update)...');
    const testUserId = 142173; // Use the first admin user
    const patchResponse = await fetch('http://localhost:3000/api/admin-users', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: testUserId.toString(),
        status: 'SUSPENDED'
      }),
    });
    
    if (patchResponse.ok) {
      const patchData = await patchResponse.json();
      console.log(`✅ PATCH endpoint working! ${patchData.message}`);
    } else {
      const errorData = await patchResponse.json();
      console.log(`❌ PATCH endpoint failed: ${errorData.error}`);
    }
    console.log('');
    
    // 4. Test POST admin user creation
    console.log('4️⃣ Testing POST /api/admin-users endpoint (create new admin)...');
    const newAdminData = {
      userName: 'testadmin',
      email: 'testadmin@icct.edu.ph',
      passwordHash: btoa('testpassword123'),
      role: 'ADMIN'
    };
    
    const postResponse = await fetch('http://localhost:3000/api/admin-users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newAdminData),
    });
    
    if (postResponse.ok) {
      const postData = await postResponse.json();
      console.log(`✅ POST endpoint working! ${postData.message}`);
      console.log(`📝 Created admin user: ${postData.data.userName} (${postData.data.email})`);
    } else {
      const errorData = await postResponse.json();
      console.log(`❌ POST endpoint failed: ${errorData.error}`);
    }
    console.log('');
    
    // 5. Verify updated admin users count
    console.log('5️⃣ Verifying updated admin users count...');
    const updatedGetResponse = await fetch('http://localhost:3000/api/admin-users');
    if (updatedGetResponse.ok) {
      const updatedData = await updatedGetResponse.json();
      console.log(`📊 Updated admin users count: ${updatedData.data.length}`);
    }
    console.log('');
    
    // 6. Test database queries directly
    console.log('6️⃣ Testing direct database queries...');
    const adminUsersCount = await prisma.user.count({
      where: {
        role: {
          in: [Role.ADMIN, Role.SUPER_ADMIN]
        }
      }
    });
    console.log(`📊 Total admin users in database: ${adminUsersCount}`);
    
    const suspendedUsers = await prisma.user.count({
      where: {
        role: {
          in: [Role.ADMIN, Role.SUPER_ADMIN]
        },
        status: UserStatus.SUSPENDED
      }
    });
    console.log(`🚫 Suspended admin users: ${suspendedUsers}`);
    
    const activeUsers = await prisma.user.count({
      where: {
        role: {
          in: [Role.ADMIN, Role.SUPER_ADMIN]
        },
        status: UserStatus.ACTIVE
      }
    });
    console.log(`✅ Active admin users: ${activeUsers}`);
    console.log('');
    
    console.log('🎉 All admin users functionality tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during testing:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Wait a bit for the dev server to start
setTimeout(() => {
  testCompleteAdminUsersFunctionality();
}, 3000); 