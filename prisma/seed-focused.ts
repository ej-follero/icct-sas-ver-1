import { PrismaClient, Role, UserStatus, UserGender, StudentType, InstructorType, GuardianType, Status, yearLevel, SemesterType, SemesterStatus, DepartmentType, CourseType, CourseStatus, SectionStatus, EnrollmentStatus, TagType, RFIDStatus, ReaderStatus, RoomType, RoomStatus, RoomBuilding, RoomFloor } from '@prisma/client';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting focused database seeding...');

  // Clear existing users and related data (but keep departments and courses)
  console.log('🧹 Clearing existing user data...');
  await prisma.attendanceNotification.deleteMany({});
  await prisma.attendance.deleteMany({});
  await prisma.studentSchedule.deleteMany({});
  await prisma.subjectSchedule.deleteMany({});
  await prisma.studentSection.deleteMany({});
  await prisma.section.deleteMany({});
  await prisma.student.deleteMany({});
  await prisma.guardian.deleteMany({});
  await prisma.instructor.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.rFIDTags.deleteMany({});
  await prisma.rFIDReader.deleteMany({});
  await prisma.room.deleteMany({});
  await prisma.semester.deleteMany({});

  // Create essential departments and courses first
  console.log('🏢 Creating essential departments...');
  const departments = [
    { name: 'College of Computer Studies', code: 'CCS', type: 'ACADEMIC' },
    { name: 'College of Business & Accountancy', code: 'CBA', type: 'ACADEMIC' },
  ];

  const createdDepartments = [];
  for (const dept of departments) {
    createdDepartments.push(await prisma.department.create({
      data: {
        departmentName: dept.name,
        departmentCode: dept.code,
        departmentType: dept.type as DepartmentType,
        departmentDescription: `${dept.name} Department`,
        departmentStatus: Status.ACTIVE,
        headOfDepartment: null, // Will be set after creating super admin
        location: `${dept.name} Building`,
        contactEmail: `${dept.code.toLowerCase()}@icct.edu.ph`,
        contactPhone: '09171234567',
      }
    }));
  }

  console.log('📚 Creating essential courses...');
  const courses = [
    { code: 'BSCS', name: 'Bachelor of Science in Computer Science', dept: 'CCS', units: 150 },
    { code: 'BSIT', name: 'Bachelor of Science in Information Technology', dept: 'CCS', units: 150 },
    { code: 'BSBA', name: 'Bachelor of Science in Business Administration', dept: 'CBA', units: 150 },
  ];

  const createdCourses = [];
  for (const course of courses) {
    const dept = createdDepartments.find(d => d.departmentCode === course.dept);
    if (dept) {
      createdCourses.push(await prisma.courseOffering.create({
        data: {
          courseCode: course.code,
          courseName: course.name,
          courseType: CourseType.MANDATORY,
          courseStatus: CourseStatus.ACTIVE,
          description: `${course.name} program`,
          departmentId: dept.departmentId,
          totalUnits: course.units,
        }
      }));
    }
  }

  console.log(`📚 Created ${createdDepartments.length} departments`);
  console.log(`📚 Created ${createdCourses.length} courses`);

  // 1. Create Super Admin
  console.log('👑 Creating Super Admin...');
  const superAdmin = await prisma.user.create({
    data: {
      userName: 'superadmin',
      email: 'superadmin@icct.edu.ph',
      passwordHash: '$2b$10$hashedpassword',
      role: Role.SUPER_ADMIN,
      status: UserStatus.ACTIVE,
      isEmailVerified: true,
    }
  });
  console.log(`✅ Created Super Admin: ${superAdmin.email}`);

  // Update department heads
  await prisma.department.updateMany({
    where: { departmentId: { in: createdDepartments.map(d => d.departmentId) } },
    data: { headOfDepartment: superAdmin.userId }
  });

  // 2. Create Admin
  console.log('👨‍💼 Creating Admin...');
  const admin = await prisma.user.create({
    data: {
      userName: 'admin',
      email: 'admin@icct.edu.ph',
      passwordHash: '$2b$10$hashedpassword',
      role: Role.ADMIN,
      status: UserStatus.ACTIVE,
      isEmailVerified: true,
    }
  });
  console.log(`✅ Created Admin: ${admin.email}`);

  // 3. Create Instructor
  console.log('👨‍🏫 Creating Instructor...');
  const instructorUser = await prisma.user.create({
    data: {
      userName: 'instructor',
      email: 'instructor@icct.edu.ph',
      passwordHash: '$2b$10$hashedpassword',
      role: Role.INSTRUCTOR,
      status: UserStatus.ACTIVE,
      isEmailVerified: true,
    }
  });

  // Get a random department for the instructor
  const instructorDept = createdDepartments[0]; // Use first department

  const instructor = await prisma.instructor.create({
    data: {
      instructorId: instructorUser.userId,
      employeeId: `EMP-${instructorUser.userId}`,
      email: instructorUser.email,
      phoneNumber: '09171234567',
      firstName: 'John',
      middleName: 'Michael',
      lastName: 'Doe',
      gender: UserGender.MALE,
      instructorType: InstructorType.FULL_TIME,
      status: Status.ACTIVE,
      departmentId: instructorDept.departmentId,
      officeLocation: `${instructorDept.departmentName} Building, Room 101`,
      officeHours: '8:00 AM - 5:00 PM',
      specialization: 'Computer Science',
      rfidTag: `INSTR001`,
    }
  });
  console.log(`✅ Created Instructor: ${instructor.email} in ${instructorDept.departmentName}`);

  // 4. Create Guardian
  console.log('👨‍👩‍👧‍👦 Creating Guardian...');
  const guardian = await prisma.guardian.create({
    data: {
      email: 'guardian@email.com',
      phoneNumber: '09171234568',
      firstName: 'Maria',
      middleName: 'Santos',
      lastName: 'Garcia',
      gender: UserGender.FEMALE,
      guardianType: GuardianType.PARENT,
      status: Status.ACTIVE,
      address: '123 Rizal Avenue, Barangay San Juan, Cainta, Rizal',
      occupation: 'Teacher',
      workplace: 'Public School',
      emergencyContact: '09171234568',
      relationshipToStudent: 'Mother',
      totalStudents: 1,
    }
  });
  console.log(`✅ Created Guardian: ${guardian.email}`);

  // 5. Create Student
  console.log('👨‍🎓 Creating Student...');
  const studentUser = await prisma.user.create({
    data: {
      userName: 'student001',
      email: 'student001@student.icct.edu.ph',
      passwordHash: '$2b$10$hashedpassword',
      role: Role.STUDENT,
      status: UserStatus.ACTIVE,
      isEmailVerified: true,
    }
  });

  // Get a random course for the student
  const studentCourse = createdCourses[0]; // Use first course
  const studentDept = createdDepartments.find(d => d.departmentId === studentCourse.departmentId);

  const student = await prisma.student.create({
    data: {
      studentIdNum: '2025-00001',
      rfidTag: 'STUD00001',
      firstName: 'Juan',
      middleName: 'Carlos',
      lastName: 'Santos',
      email: studentUser.email,
      phoneNumber: '09171234569',
      address: '456 Sumulong Highway, Barangay San Roque, Cainta, Rizal',
      gender: UserGender.MALE,
      studentType: StudentType.REGULAR,
      status: Status.ACTIVE,
      yearLevel: yearLevel.FIRST_YEAR,
      birthDate: new Date('2005-06-15'),
      nationality: 'Filipino',
      userId: studentUser.userId,
      guardianId: guardian.guardianId,
      courseId: studentCourse.courseId,
      departmentId: studentDept?.departmentId,
    }
  });
  console.log(`✅ Created Student: ${student.email} in ${studentCourse.courseName}`);

  // 6. Create a current semester
  console.log('📅 Creating current semester...');
  const currentSemester = await prisma.semester.create({
    data: {
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-03-31'),
      year: 2025,
      semesterType: SemesterType.FIRST_SEMESTER,
      status: SemesterStatus.CURRENT,
      isActive: true,
      registrationStart: new Date('2024-12-01'),
      registrationEnd: new Date('2024-12-31'),
      enrollmentStart: new Date('2024-12-15'),
      enrollmentEnd: new Date('2024-12-31'),
    }
  });
  console.log(`✅ Created current semester: ${currentSemester.year} ${currentSemester.semesterType}`);

  // 7. Create a section for the student's course
  console.log('📋 Creating section...');
  const section = await prisma.section.create({
    data: {
      sectionName: `${studentCourse.courseCode}-S01`,
      sectionCapacity: 30,
      sectionStatus: SectionStatus.ACTIVE,
      yearLevel: 1,
      currentEnrollment: 1,
      courseId: studentCourse.courseId,
      semesterId: currentSemester.semesterId,
      academicYear: '2024-2025',
      semester: SemesterType.FIRST_SEMESTER,
    }
  });
  console.log(`✅ Created section: ${section.sectionName}`);

  // 8. Enroll student in section
  console.log('📝 Enrolling student in section...');
  await prisma.studentSection.create({
    data: {
      studentId: student.studentId,
      sectionId: section.sectionId,
      enrollmentStatus: EnrollmentStatus.ACTIVE,
      enrollmentDate: new Date(),
      isRegular: true,
    }
  });
  console.log(`✅ Enrolled student in section`);

  // 9. Create a room
  console.log('🏫 Creating room...');
  const room = await prisma.room.create({
    data: {
      roomNo: 'L001',
      roomType: RoomType.LECTURE,
      roomCapacity: 40,
      roomBuildingLoc: RoomBuilding.BuildingA,
      roomFloorLoc: RoomFloor.F1,
      readerId: 'READER-001',
      status: RoomStatus.AVAILABLE,
      isActive: true,
    }
  });
  console.log(`✅ Created room: ${room.roomNo}`);

  // 10. Create RFID Tag for student
  console.log('🏷️ Creating RFID tag for student...');
  await prisma.rFIDTags.create({
    data: {
      tagNumber: student.rfidTag,
      tagType: TagType.STUDENT_CARD,
      assignedAt: new Date(),
      status: RFIDStatus.ACTIVE,
      studentId: student.studentId,
      assignedBy: superAdmin.userId,
      assignmentReason: 'Initial assignment',
    }
  });
  console.log(`✅ Created RFID tag: ${student.rfidTag}`);

  // 11. Create RFID Reader
  console.log('📡 Creating RFID reader...');
  await prisma.rFIDReader.create({
    data: {
      roomId: room.roomId,
      deviceId: room.readerId,
      deviceName: `RFID Reader ${room.roomNo}`,
      components: { antenna: 'Omni-directional', power: 'AC' },
      assemblyDate: new Date(),
      lastCalibration: new Date(),
      nextCalibration: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      ipAddress: '192.168.1.100',
      status: ReaderStatus.ACTIVE,
      lastSeen: new Date(),
      testResults: { signal: 'Strong', battery: 'Good' },
    }
  });
  console.log(`✅ Created RFID reader: ${room.readerId}`);

  console.log('✅ Focused database seeding completed successfully!');
  console.log('👑 Super Admin: superadmin@icct.edu.ph');
  console.log('👨‍💼 Admin: admin@icct.edu.ph');
  console.log('👨‍🏫 Instructor: instructor@icct.edu.ph');
  console.log('👨‍🎓 Student: student001@student.icct.edu.ph');
  console.log('📚 All users are ready to use with existing departments and courses!');
}

main()
  .catch(e => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
