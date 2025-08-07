const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const ALL_PERMISSIONS = [
  'View Users', 'Edit Users', 'Delete Users', 'View Attendance', 'Edit Attendance', 
  'Delete Attendance', 'Manage Courses', 'Manage Departments', 'Manage Subjects', 
  'Manage Instructors', 'Manage Students', 'Manage Rooms', 'View Reports', 
  'Export Data', 'System Settings', 'User Management', 'Role Management', 
  'Department Management', 'Department Reports', 'Department Users', 
  'Send Announcements', 'Manage Communications', 'Audit Logs', 'System Analytics',
  'Emergency Access', 'Super Admin Access'
];

const originalRoles = [
  { 
    name: 'Super Admin', 
    description: 'Highest level of system access with all permissions', 
    permissions: ALL_PERMISSIONS,
    status: 'ACTIVE',
    totalUsers: 1
  },
  { 
    name: 'Admin', 
    description: 'Full administrative access to system features', 
    permissions: ALL_PERMISSIONS.filter(p => !p.includes('Super Admin') && !p.includes('Emergency Access')),
    status: 'ACTIVE',
    totalUsers: 5
  },
  { 
    name: 'Department Head', 
    description: 'Manage department-specific operations and users', 
    permissions: [
      'View Users', 'Edit Users', 'View Attendance', 'Edit Attendance', 
      'Manage Courses', 'Manage Departments', 'Manage Subjects', 'Manage Instructors',
      'View Reports', 'Export Data', 'Department Management', 'Department Reports',
      'Department Users', 'Send Announcements', 'Manage Communications'
    ],
    status: 'ACTIVE',
    totalUsers: 8
  },
  { 
    name: 'Instructor', 
    description: 'Manage classes and attendance', 
    permissions: ['View Users', 'View Attendance', 'Edit Attendance', 'View Reports', 'Send Announcements'],
    status: 'ACTIVE',
    totalUsers: 25
  },
  { 
    name: 'Student', 
    description: 'View own attendance and schedule', 
    permissions: ['View Attendance', 'View Reports'],
    status: 'ACTIVE',
    totalUsers: 500
  },
  { 
    name: 'Parent',
    description: 'View student attendance and reports', 
    permissions: ['View Users', 'View Attendance', 'View Reports'],
    status: 'ACTIVE',
    totalUsers: 150
  },
  { 
    name: 'System Auditor', 
    description: 'Read-only access for compliance and audit purposes', 
    permissions: ['View Users', 'View Attendance', 'View Reports', 'Audit Logs', 'System Analytics'],
    status: 'ACTIVE',
    totalUsers: 2
  }
];

async function restoreOriginalRoles() {
  try {
    console.log('🔄 Starting role restoration...');
    
    // Clear existing roles
    console.log('🧹 Clearing existing roles...');
    await prisma.roleManagement.deleteMany({});
    console.log('✅ Existing roles cleared');
    
    // Create original roles
    console.log('👥 Creating original roles...');
    const createdRoles = [];
    
    for (const roleData of originalRoles) {
      const role = await prisma.roleManagement.create({
        data: {
          name: roleData.name,
          description: roleData.description,
          permissions: roleData.permissions,
          status: roleData.status,
          totalUsers: roleData.totalUsers
        }
      });
      
      createdRoles.push(role);
      console.log(`✅ Created role: ${role.name}`);
    }
    
    console.log(`\n🎉 Successfully restored ${createdRoles.length} original roles:`);
    createdRoles.forEach(role => {
      console.log(`  - ${role.name} (${role.permissions.length} permissions)`);
    });
    
  } catch (error) {
    console.error('❌ Error restoring roles:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the restoration
restoreOriginalRoles(); 