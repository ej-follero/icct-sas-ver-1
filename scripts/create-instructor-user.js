const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// Configuration
const INSTRUCTOR_CONFIG = {
  // Personal Information
  firstName: process.env.INSTRUCTOR_FIRST_NAME || 'John',
  middleName: process.env.INSTRUCTOR_MIDDLE_NAME || 'Michael',
  lastName: process.env.INSTRUCTOR_LAST_NAME || 'Doe',
  suffix: process.env.INSTRUCTOR_SUFFIX || null,
  email: process.env.INSTRUCTOR_EMAIL || 'instructor@icct.edu.ph',
  phoneNumber: process.env.INSTRUCTOR_PHONE || '+639123456789',
  gender: process.env.INSTRUCTOR_GENDER || 'MALE', // MALE or FEMALE
  address: process.env.INSTRUCTOR_ADDRESS || '123 Main Street, Cainta, Rizal',
  
  // Professional Information
  instructorType: process.env.INSTRUCTOR_TYPE || 'FULL_TIME', // FULL_TIME or PART_TIME
  employeeId: process.env.INSTRUCTOR_EMPLOYEE_ID || 'EMP001',
  specialization: process.env.INSTRUCTOR_SPECIALIZATION || 'Computer Science',
  officeLocation: process.env.INSTRUCTOR_OFFICE || 'Room 101, Building A',
  officeHours: process.env.INSTRUCTOR_HOURS || '8:00 AM - 5:00 PM',
  
  // System Information
  userName: process.env.INSTRUCTOR_USERNAME || 'instructor',
  password: process.env.INSTRUCTOR_PASSWORD || 'Instructor123!',
  rfidTag: process.env.INSTRUCTOR_RFID || null, // Will be generated if not provided
  departmentId: process.env.INSTRUCTOR_DEPARTMENT_ID || null, // Will be selected if not provided
};

async function generateRFIDTag() {
  // Generate a unique RFID tag
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `INST${timestamp}${random}`;
}

async function getAvailableDepartments() {
  try {
    const departments = await prisma.department.findMany({
      where: {
        departmentStatus: 'ACTIVE'
      },
      select: {
        departmentId: true,
        departmentName: true,
        departmentCode: true,
        departmentDescription: true
      },
      orderBy: {
        departmentName: 'asc'
      }
    });
    
    return departments;
  } catch (error) {
    console.error('Error fetching departments:', error);
    return [];
  }
}

async function selectDepartment() {
  const departments = await getAvailableDepartments();
  
  if (departments.length === 0) {
    throw new Error('No active departments found. Please create a department first.');
  }
  
  // If department ID is provided, validate it
  if (INSTRUCTOR_CONFIG.departmentId) {
    const dept = departments.find(d => d.departmentId === parseInt(INSTRUCTOR_CONFIG.departmentId));
    if (!dept) {
      throw new Error(`Department with ID ${INSTRUCTOR_CONFIG.departmentId} not found.`);
    }
    return dept;
  }
  
  // Otherwise, select the first available department
  console.log('Available departments:');
  departments.forEach((dept, index) => {
    console.log(`${index + 1}. ${dept.departmentName} (${dept.departmentCode})`);
  });
  
  return departments[0]; // Return first department
}

async function createInstructorUser() {
  try {
    console.log('🔍 Creating instructor user...');
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: INSTRUCTOR_CONFIG.email }
    });
    
    if (existingUser) {
      console.log('⚠️  User with this email already exists:', INSTRUCTOR_CONFIG.email);
      return {
        success: false,
        error: 'User with this email already exists',
        existingUser: {
          userId: existingUser.userId,
          email: existingUser.email,
          role: existingUser.role,
          status: existingUser.status
        }
      };
    }
    
    // Get department
    const department = await selectDepartment();
    console.log(`📚 Selected department: ${department.departmentName} (ID: ${department.departmentId})`);
    
    // Generate RFID tag if not provided
    const rfidTag = INSTRUCTOR_CONFIG.rfidTag || await generateRFIDTag();
    console.log(`🏷️  Generated RFID tag: ${rfidTag}`);
    
    // Hash password
    const passwordHash = await bcrypt.hash(INSTRUCTOR_CONFIG.password, 12);
    
    // Create user and instructor in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the base user
      const user = await tx.user.create({
        data: {
          userName: INSTRUCTOR_CONFIG.userName,
          email: INSTRUCTOR_CONFIG.email,
          passwordHash: passwordHash,
          role: 'INSTRUCTOR',
          status: 'ACTIVE',
          isEmailVerified: true,
          twoFactorEnabled: false,
          failedLoginAttempts: 0
        }
      });
      
      // Create the instructor profile
      const instructor = await tx.instructor.create({
        data: {
          instructorId: user.userId, // Use the same ID as user
          email: INSTRUCTOR_CONFIG.email,
          phoneNumber: INSTRUCTOR_CONFIG.phoneNumber,
          firstName: INSTRUCTOR_CONFIG.firstName,
          middleName: INSTRUCTOR_CONFIG.middleName,
          lastName: INSTRUCTOR_CONFIG.lastName,
          suffix: INSTRUCTOR_CONFIG.suffix,
          gender: INSTRUCTOR_CONFIG.gender,
          instructorType: INSTRUCTOR_CONFIG.instructorType,
          status: 'ACTIVE',
          departmentId: department.departmentId,
          officeLocation: INSTRUCTOR_CONFIG.officeLocation,
          officeHours: INSTRUCTOR_CONFIG.officeHours,
          specialization: INSTRUCTOR_CONFIG.specialization,
          rfidTag: rfidTag,
          employeeId: INSTRUCTOR_CONFIG.employeeId
        }
      });
      
      return { user, instructor, department };
    });
    
    console.log('✅ Instructor user created successfully!');
    console.log('\n📋 INSTRUCTOR DETAILS:');
    console.log(`👤 Name: ${INSTRUCTOR_CONFIG.firstName} ${INSTRUCTOR_CONFIG.middleName} ${INSTRUCTOR_CONFIG.lastName}`);
    console.log(`📧 Email: ${INSTRUCTOR_CONFIG.email}`);
    console.log(`🔑 Username: ${INSTRUCTOR_CONFIG.userName}`);
    console.log(`🔒 Password: ${INSTRUCTOR_CONFIG.password}`);
    console.log(`🏷️  RFID Tag: ${rfidTag}`);
    console.log(`👔 Employee ID: ${INSTRUCTOR_CONFIG.employeeId}`);
    console.log(`🏢 Department: ${result.department.departmentName} (${result.department.departmentCode})`);
    console.log(`📍 Office: ${INSTRUCTOR_CONFIG.officeLocation}`);
    console.log(`⏰ Office Hours: ${INSTRUCTOR_CONFIG.officeHours}`);
    console.log(`🎓 Specialization: ${INSTRUCTOR_CONFIG.specialization}`);
    console.log(`👔 Type: ${INSTRUCTOR_CONFIG.instructorType}`);
    
    return {
      success: true,
      message: 'Instructor user created successfully',
      data: {
        user: {
          userId: result.user.userId,
          userName: result.user.userName,
          email: result.user.email,
          role: result.user.role,
          status: result.user.status
        },
        instructor: {
          instructorId: result.instructor.instructorId,
          firstName: result.instructor.firstName,
          lastName: result.instructor.lastName,
          email: result.instructor.email,
          employeeId: result.instructor.employeeId,
          rfidTag: result.instructor.rfidTag,
          departmentId: result.instructor.departmentId
        },
        department: {
          departmentId: result.department.departmentId,
          departmentName: result.department.departmentName,
          departmentCode: result.department.departmentCode
        },
        credentials: {
          email: INSTRUCTOR_CONFIG.email,
          password: INSTRUCTOR_CONFIG.password,
          rfidTag: rfidTag
        }
      }
    };
    
  } catch (error) {
    console.error('❌ Error creating instructor user:', error);
    return {
      success: false,
      error: error.message
    };
  } finally {
    await prisma.$disconnect();
  }
}

// Main execution
async function main() {
  console.log('🚀 ICCT Smart Attendance System - Instructor User Creation');
  console.log('=' .repeat(60));
  
  const result = await createInstructorUser();
  
  if (result.success) {
    console.log('\n🎉 SUCCESS! Instructor user has been created.');
    console.log('\n💡 You can now use these credentials to log in:');
    console.log(`   Email: ${result.data.credentials.email}`);
    console.log(`   Password: ${result.data.credentials.password}`);
    console.log(`   RFID Tag: ${result.data.credentials.rfidTag}`);
  } else {
    console.log('\n❌ FAILED! Could not create instructor user.');
    console.log(`   Error: ${result.error}`);
    if (result.existingUser) {
      console.log('\n📋 Existing user details:');
      console.log(`   User ID: ${result.existingUser.userId}`);
      console.log(`   Email: ${result.existingUser.email}`);
      console.log(`   Role: ${result.existingUser.role}`);
      console.log(`   Status: ${result.existingUser.status}`);
    }
  }
  
  console.log('\n' + '=' .repeat(60));
}

// Run the script
if (require.main === module) {
  main().catch((error) => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });
}

module.exports = { createInstructorUser, generateRFIDTag, getAvailableDepartments };
