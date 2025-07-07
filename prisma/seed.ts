import { PrismaClient, Prisma } from '@prisma/client';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

async function main() {
  // DEVELOPMENT ONLY: Truncate all tables before seeding to ensure a clean state
  // Order matters: delete join/log tables first, then main entities
  await prisma.rFIDTagAssignmentLog.deleteMany({});
  await prisma.announcement.deleteMany({});
  await prisma.systemLogs.deleteMany({});
  await prisma.reportLog.deleteMany({});
  await prisma.rFIDReaderLogs.deleteMany({});
  await prisma.rFIDLogs.deleteMany({});
  await prisma.rFIDReader.deleteMany({});
  await prisma.rFIDTags.deleteMany({});
  await prisma.attendance.deleteMany({});
  await prisma.studentSchedule.deleteMany({});
  await prisma.subjectSchedule.deleteMany({});
  await prisma.studentSection.deleteMany({});
  await prisma.event.deleteMany({});
  await prisma.subjects.deleteMany({});
  await prisma.section.deleteMany({});
  await prisma.student.deleteMany({});
  await prisma.guardian.deleteMany({});
  await prisma.instructor.deleteMany({});
  await prisma.room.deleteMany({});
  await prisma.courseOffering.deleteMany({});
  await prisma.semester.deleteMany({});
  await prisma.department.deleteMany({});
  await prisma.user.deleteMany({});

  // 1. Seed Users
  const userRoles = ['ADMIN', 'TEACHER', 'STUDENT', 'GUARDIAN'] as const;
  const users = [];
  for (let i = 0; i < 100; i++) {
    users.push(await prisma.user.create({
      data: {
        userName: faker.internet.userName(),
        email: faker.internet.email(),
        passwordHash: faker.internet.password(),
        role: faker.helpers.arrayElement(userRoles),
        status: 'ACTIVE',
      }
    }));
  }

  // 2. Seed Departments
  const departments = [];
  for (let i = 0; i < 20; i++) {
    departments.push(await prisma.department.create({
      data: {
        departmentName: faker.company.name(),
        departmentCode: faker.string.alphanumeric(6).toUpperCase(),
        departmentDescription: faker.lorem.sentence(),
        departmentStatus: 'ACTIVE',
        headOfDepartment: users[i % users.length].userId,
      }
    }));
  }

  // 3. Seed Semesters
  const semesters = [];
  const semesterIds = [];
  for (let i = 0; i < 10; i++) {
    const semester = await prisma.semester.create({
      data: {
        startDate: faker.date.past(),
        endDate: faker.date.future(),
        year: 2020 + i,
        semesterType: faker.helpers.arrayElement(['FIRST_SEMESTER', 'SECOND_SEMESTER', 'THIRD_SEMESTER']),
        status: 'CURRENT',
      }
    });
    semesters.push(semester);
    semesterIds.push(semester.semesterId);
  }

  // 4. Seed CourseOfferings
  const courses = [];
  for (let i = 0; i < 100; i++) {
    courses.push(await prisma.courseOffering.create({
      data: {
        courseCode: faker.string.alphanumeric(8).toUpperCase(),
        courseName: faker.commerce.productName(),
        courseType: 'MANDATORY',
        courseStatus: 'ACTIVE',
        description: faker.lorem.sentence(),
        departmentId: departments[i % departments.length].departmentId,
        academicYear: '2023-2024',
        semester: faker.helpers.arrayElement(['FIRST_SEMESTER', 'SECOND_SEMESTER', 'THIRD_SEMESTER']),
        totalUnits: faker.number.int({ min: 1, max: 5 }),
        semesterId: semesters[i % semesters.length].semesterId,
      }
    }));
  }

  // Filter users by role for instructor and guardian creation
  const teacherUsers = users.filter(u => u.role === 'TEACHER');
  const guardianUsers = users.filter(u => u.role === 'GUARDIAN');

  // 5. Seed Instructors (set instructorId = userId of TEACHER, avoid duplicates)
  const instructors = [];
  const instructorIds = [];
  const instructorCount = Math.min(teacherUsers.length, 100);
  for (let i = 0; i < instructorCount; i++) {
    const user = teacherUsers[i];
    const instructor = await prisma.instructor.create({
      data: {
        instructorId: user.userId,
        email: faker.internet.email(),
        phoneNumber: faker.phone.number(),
        firstName: faker.person.firstName(),
        middleName: faker.person.middleName(),
        lastName: faker.person.lastName(),
        gender: 'MALE',
        instructorType: 'FULL_TIME',
        status: 'ACTIVE',
        departmentId: departments[i % departments.length].departmentId,
        officeLocation: faker.location.streetAddress(),
        officeHours: `${faker.number.int({ min: 8, max: 17 })}:00 - ${faker.number.int({ min: 8, max: 17 })}:00`,
        specialization: faker.commerce.department(),
        rfidTag: faker.string.alphanumeric(10).toUpperCase(),
      }
    });
    instructors.push(instructor);
    instructorIds.push(instructor.instructorId);
  }

  // 6. Seed Guardians (set guardianId = userId of GUARDIAN, avoid duplicates)
  const guardians = [];
  const guardianCount = Math.min(guardianUsers.length, 100);
  for (let i = 0; i < guardianCount; i++) {
    const user = guardianUsers[i];
    guardians.push(await prisma.guardian.create({
      data: {
        guardianId: user.userId,
        email: faker.internet.email(),
        phoneNumber: faker.phone.number(),
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        gender: 'FEMALE',
        guardianType: 'PARENT',
        status: 'ACTIVE',
        address: faker.location.streetAddress(),
        relationshipToStudent: 'Parent',
      }
    }));
  }

  // 7. Seed Students
  const studentIds = [];
  for (let i = 0; i < 200; i++) {
    const student = await prisma.student.create({
      data: {
        studentIdNum: faker.string.alphanumeric(8).toUpperCase(),
        rfidTag: faker.string.alphanumeric(10).toUpperCase(),
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        email: faker.internet.email(),
        phoneNumber: faker.phone.number(),
        address: faker.location.streetAddress(),
        gender: faker.helpers.arrayElement(['MALE', 'FEMALE']),
        studentType: faker.helpers.arrayElement(['REGULAR', 'IRREGULAR']),
        status: 'ACTIVE',
        yearLevel: faker.helpers.arrayElement(['FIRST_YEAR', 'SECOND_YEAR', 'THIRD_YEAR', 'FOURTH_YEAR']),
        departmentId: departments[i % departments.length].departmentId,
        guardianId: guardians[i % guardians.length].guardianId,
        userId: users[(i + 30) % users.length].userId,
        courseId: courses[i % courses.length].courseId,
      }
    });
    studentIds.push(student.studentId);
  }

  // 8. Seed Rooms
  const roomIds = [];
  for (let i = 0; i < 20; i++) {
    const room = await prisma.room.create({
      data: {
        roomNo: faker.string.alphanumeric(4).toUpperCase(),
        roomType: faker.helpers.arrayElement(['LECTURE', 'LABORATORY', 'CONFERENCE', 'OFFICE', 'OTHER']),
        roomCapacity: faker.number.int({ min: 20, max: 100 }),
        roomBuildingLoc: faker.location.streetAddress(),
        roomFloorLoc: faker.number.int({ min: 1, max: 5 }).toString(),
        readerId: faker.string.alphanumeric(8).toUpperCase(),
        status: 'AVAILABLE',
        isActive: true,
      }
    });
    roomIds.push(room.roomId);
  }

  // 9. Seed Sections
  const sectionIds = [];
  for (let i = 0; i < 50; i++) {
    const section = await prisma.section.create({
      data: {
        sectionName: `Section ${faker.string.alphanumeric(4).toUpperCase()}`,
        sectionType: faker.helpers.arrayElement(['LECTURE', 'LAB']),
        sectionCapacity: faker.number.int({ min: 20, max: 60 }),
        sectionStatus: faker.helpers.arrayElement(['ACTIVE', 'INACTIVE']),
        yearLevel: faker.number.int({ min: 1, max: 4 }),
        academicYear: '2023-2024',
        semester: faker.helpers.arrayElement(['FIRST_SEMESTER', 'SECOND_SEMESTER', 'THIRD_SEMESTER']),
        courseId: courses[i % courses.length].courseId,
        semesterId: semesters[i % semesters.length].semesterId,
      }
    });
    sectionIds.push(section.sectionId);
  }

  // 10. Seed Subjects
  const subjectIds = [];
  for (let i = 0; i < 100; i++) {
    const subject = await prisma.subjects.create({
      data: {
        subjectName: faker.commerce.productName(),
        subjectCode: faker.string.alphanumeric(8).toUpperCase(),
        subjectType: faker.helpers.arrayElement(['LECTURE', 'LABORATORY', 'HYBRID', 'THESIS', 'RESEARCH', 'INTERNSHIP']),
        status: faker.helpers.arrayElement(['ACTIVE', 'INACTIVE', 'ARCHIVED', 'PENDING_REVIEW']),
        description: faker.lorem.sentence(),
        lectureUnits: faker.number.int({ min: 1, max: 3 }),
        labUnits: faker.number.int({ min: 0, max: 2 }),
        creditedUnits: faker.number.int({ min: 1, max: 5 }),
        totalHours: faker.number.int({ min: 10, max: 100 }),
        prerequisites: '',
        courseId: courses[i % courses.length].courseId,
        departmentId: departments[i % departments.length].departmentId,
        academicYear: '2023-2024',
        semester: faker.helpers.arrayElement(['FIRST_SEMESTER', 'SECOND_SEMESTER', 'THIRD_SEMESTER']),
      }
    });
    subjectIds.push(subject.subjectId);
  }

  // 11. Seed StudentSection (enroll students into sections, unique pairs only)
  const studentSectionPairs = new Set();
  const studentSectionCount = 200;
  let studentSectionCreated = 0;
  while (studentSectionCreated < studentSectionCount) {
    const studentId = studentIds[Math.floor(Math.random() * studentIds.length)];
    const sectionId = sectionIds[Math.floor(Math.random() * sectionIds.length)];
    const key = `${studentId}-${sectionId}`;
    if (!studentSectionPairs.has(key)) {
      studentSectionPairs.add(key);
      await prisma.studentSection.create({
        data: {
          studentId,
          sectionId,
          enrollmentStatus: 'ACTIVE',
          enrollmentDate: faker.date.past(),
          isRegular: faker.datatype.boolean(),
          notes: faker.lorem.sentence(),
        }
      });
      studentSectionCreated++;
    }
    // If all possible pairs are used, break
    if (studentSectionPairs.size >= studentIds.length * sectionIds.length) break;
  }

  // 12. Seed SubjectSchedule (link subjects, sections, instructors, rooms, semesters)
  const subjectSchedules = [];
  for (let i = 0; i < 100; i++) {
    subjectSchedules.push(await prisma.subjectSchedule.create({
      data: {
        subjectId: subjectIds[i % subjectIds.length],
        sectionId: sectionIds[i % sectionIds.length],
        instructorId: instructorIds[i % instructorIds.length],
        roomId: roomIds[i % roomIds.length],
        day: faker.helpers.arrayElement(['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY']),
        startTime: `${faker.number.int({ min: 7, max: 16 })}:00`,
        endTime: `${faker.number.int({ min: 8, max: 17 })}:00`,
        slots: faker.number.int({ min: 20, max: 60 }),
        scheduleType: 'REGULAR',
        status: 'ACTIVE',
        semesterId: semesterIds[i % semesterIds.length],
        academicYear: '2023-2024',
        isRecurring: faker.datatype.boolean(),
        startDate: faker.date.past(),
        endDate: faker.date.future(),
        maxStudents: faker.number.int({ min: 20, max: 60 }),
        notes: faker.lorem.sentence(),
      }
    }));
  }

  // 13. Seed StudentSchedule (assign students to subject schedules)
  for (let i = 0; i < 200; i++) {
    await prisma.studentSchedule.create({
      data: {
        studentId: studentIds[i % studentIds.length],
        scheduleId: subjectSchedules[i % subjectSchedules.length].subjectSchedId,
        status: 'ACTIVE',
        enrolledAt: faker.date.past(),
        notes: faker.lorem.sentence(),
      }
    });
  }

  // 14. Seed Attendance (use string enums)
  for (let i = 0; i < 200; i++) {
    await prisma.attendance.create({
      data: {
        subjectSchedId: subjectSchedules[i % subjectSchedules.length].subjectSchedId,
        studentId: studentIds[i % studentIds.length],
        instructorId: instructorIds[i % instructorIds.length],
        userId: users[i % users.length].userId,
        userRole: users[i % users.length].role,
        status: 'PRESENT',
        attendanceType: 'RFID_SCAN',
        verification: 'PENDING',
        timestamp: faker.date.recent(),
        notes: faker.lorem.sentence(),
      }
    });
  }

  // 15. Seed Event (use string enums)
  for (let i = 0; i < 30; i++) {
    await prisma.event.create({
      data: {
        createdBy: users[i % users.length].userId,
        title: faker.lorem.words(4),
        description: faker.lorem.sentence(),
        eventType: 'ACADEMIC',
        eventDate: faker.date.future(),
        endDate: faker.date.future(),
        location: faker.location.streetAddress(),
        capacity: faker.number.int({ min: 20, max: 200 }),
        isPublic: faker.datatype.boolean(),
        requiresRegistration: faker.datatype.boolean(),
        status: 'DRAFT',
        priority: 'NORMAL',
        imageUrl: faker.image.url(),
        contactEmail: faker.internet.email(),
        contactPhone: faker.phone.number(),
      }
    });
  }

  // 16. Seed RFIDTags (assign one tag per student and one per instructor)
  const rfidTagIds = [];
  // One tag per student
  for (let i = 0; i < studentIds.length; i++) {
    const tag = await prisma.rFIDTags.create({
      data: {
        tagNumber: faker.string.alphanumeric(10).toUpperCase(),
        tagType: 'STUDENT_CARD',
        assignedAt: faker.date.past(),
        status: 'ACTIVE',
        studentId: studentIds[i],
        assignedBy: users[(i + 1) % users.length].userId,
        assignmentReason: faker.lorem.sentence(),
      }
    });
    rfidTagIds.push(tag.tagId);
  }
  // One tag per instructor
  for (let i = 0; i < instructorIds.length; i++) {
    const tag = await prisma.rFIDTags.create({
      data: {
        tagNumber: faker.string.alphanumeric(10).toUpperCase(),
        tagType: 'INSTRUCTOR_CARD',
        assignedAt: faker.date.past(),
        status: 'ACTIVE',
        instructorId: instructorIds[i],
        assignedBy: users[(i + 1) % users.length].userId,
        assignmentReason: faker.lorem.sentence(),
      }
    });
    rfidTagIds.push(tag.tagId);
  }

  // 17. Seed RFIDReader (devices for rooms)
  const rfidReaderIds = [];
  for (let i = 0; i < 20; i++) {
    const reader = await prisma.rFIDReader.create({
      data: {
        roomId: roomIds[i % roomIds.length],
        deviceId: faker.string.alphanumeric(8).toUpperCase(),
        deviceName: faker.commerce.productName(),
        components: {},
        assemblyDate: faker.date.past(),
        lastCalibration: faker.date.past(),
        nextCalibration: faker.date.future(),
        ipAddress: faker.internet.ip(),
        status: 'ACTIVE',
        lastSeen: faker.date.recent(),
        notes: faker.lorem.sentence(),
        testResults: {},
      }
    });
    rfidReaderIds.push(reader.readerId);
  }

  // 18. Seed RFIDLogs (use string enums)
  for (let i = 0; i < 200; i++) {
    await prisma.rFIDLogs.create({
      data: {
        rfidTag: faker.string.alphanumeric(10).toUpperCase(),
        readerId: rfidReaderIds[i % rfidReaderIds.length],
        scanType: 'CHECK_IN',
        scanStatus: 'SUCCESS',
        location: faker.location.streetAddress(),
        timestamp: faker.date.recent(),
        userId: users[i % users.length].userId,
        userRole: users[i % users.length].role,
        deviceInfo: {},
        ipAddress: faker.internet.ip(),
      }
    });
  }

  // 19. Seed RFIDReaderLogs (use string enums)
  for (let i = 0; i < 50; i++) {
    await prisma.rFIDReaderLogs.create({
      data: {
        readerId: rfidReaderIds[i % rfidReaderIds.length],
        eventType: 'SCAN_SUCCESS',
        severity: 'INFO',
        message: faker.lorem.sentence(),
        details: {},
        ipAddress: faker.internet.ip(),
        timestamp: faker.date.recent(),
        resolvedAt: faker.datatype.boolean() ? faker.date.recent() : null,
        resolution: faker.lorem.sentence(),
      }
    });
  }

  // 20. Seed ReportLog (use string enums)
  for (let i = 0; i < 30; i++) {
    await prisma.reportLog.create({
      data: {
        generatedBy: users[i % users.length].userId,
        reportType: 'ATTENDANCE_SUMMARY',
        reportName: faker.lorem.words(3),
        description: faker.lorem.sentence(),
        startDate: faker.date.past(),
        endDate: faker.date.recent(),
        status: 'PENDING',
        filepath: faker.system.filePath(),
        fileSize: faker.number.int({ min: 1000, max: 100000 }),
        fileFormat: 'PDF',
        parameters: {},
        error: faker.datatype.boolean() ? faker.lorem.sentence() : null,
      }
    });
  }

  // 21. Seed SystemLogs (system activity logs)
  for (let i = 0; i < 100; i++) {
    await prisma.systemLogs.create({
      data: {
        userId: users[i % users.length].userId,
        actionType: faker.helpers.arrayElement(['LOGIN', 'LOGOUT', 'CREATE', 'UPDATE', 'DELETE']),
        module: faker.helpers.arrayElement(['USER', 'ATTENDANCE', 'COURSE', 'SYSTEM']),
        entityId: faker.number.int({ min: 1, max: 200 }),
        details: faker.lorem.sentence(),
        ipAddress: faker.internet.ip(),
        userAgent: faker.internet.userAgent(),
        timestamp: faker.date.recent(),
      }
    });
  }

  // 22. Seed Announcement (announcements for users/instructors/sections/subjects)
  for (let i = 0; i < 50; i++) {
    await prisma.announcement.create({
      data: {
        createdby: users[i % users.length].userId,
        userType: users[i % users.length].role,
        title: faker.lorem.words(5),
        content: faker.lorem.paragraph(),
        isGeneral: faker.datatype.boolean(),
        subjectId: subjectIds[i % subjectIds.length],
        sectionId: sectionIds[i % sectionIds.length],
        instructorId: instructorIds[i % instructorIds.length],
        status: 'ACTIVE',
        priority: faker.helpers.arrayElement(['LOW', 'NORMAL', 'HIGH', 'URGENT']),
      }
    });
  }

  // 23. Seed RFIDTagAssignmentLog (logs for RFID tag assignments)
  for (let i = 0; i < 100; i++) {
    await prisma.rFIDTagAssignmentLog.create({
      data: {
        tagId: rfidTagIds[i % rfidTagIds.length],
        action: faker.helpers.arrayElement(['ASSIGN', 'UNASSIGN']),
        assignedToType: faker.helpers.arrayElement(['STUDENT', 'INSTRUCTOR']),
        assignedToId: (i < 50) ? studentIds[i % studentIds.length] : instructorIds[i % instructorIds.length],
        assignedToName: faker.person.fullName(),
        performedBy: users[(i + 1) % users.length].userId,
        performedByName: faker.person.fullName(),
        timestamp: faker.date.recent(),
        notes: faker.lorem.sentence(),
      }
    });
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });