import { prisma } from '../src/lib/prisma';
import {
  DepartmentType,
  Status,
  SemesterType,
  SemesterStatus,
  CourseType,
  CourseStatus,
  SubjectType,
  SubjectStatus,
  Role,
  UserStatus,
  UserGender,
  GuardianType,
  InstructorType,
  RoomType,
  RoomStatus,
  ReaderStatus,
  TagType,
  RFIDStatus,
  StudentType,
  yearLevel,
  SectionType,
  SectionStatus,
  EnrollmentStatus,
  DayOfWeek,
  ScheduleType,
  ScheduleStatus
} from '@prisma/client';
import bcrypt from 'bcrypt';

async function main() {
  // 1. Create Departments
  const department = await prisma.department.create({
      data: {
        departmentName: 'Computer Science',
        departmentCode: 'CS',
      departmentDescription: 'Department of Computer Science',
        departmentType: DepartmentType.ACADEMIC,
        departmentStatus: Status.ACTIVE,
    },
  });

  // 2. Create Semester
  const semester = await prisma.semester.create({
      data: {
      startDate: new Date('2024-06-01'),
      endDate: new Date('2024-10-01'),
      year: 2024,
      semesterType: SemesterType.FIRST_SEMESTER,
      status: SemesterStatus.CURRENT,
      isActive: true,
    },
  });

  // 3. Create CourseOffering
  const course = await prisma.courseOffering.create({
      data: {
      courseCode: 'BSCS',
      courseName: 'BS Computer Science',
      courseType: CourseType.MANDATORY,
      courseStatus: CourseStatus.ACTIVE,
      departmentId: department.departmentId,
      academicYear: '2024-2025',
      semester: SemesterType.FIRST_SEMESTER,
      semesterId: semester.semesterId,
      totalUnits: 180,
    },
  });

  // 4. Create Subjects
  const subject = await prisma.subjects.create({
      data: {
      subjectName: 'Introduction to Programming',
      subjectCode: 'CS101',
      subjectType: SubjectType.LECTURE,
      status: SubjectStatus.ACTIVE,
      lectureUnits: 3,
      labUnits: 1,
      creditedUnits: 4,
      totalHours: 64,
      courseId: course.courseId,
      departmentId: department.departmentId,
      academicYear: '2024-2025',
      semester: SemesterType.FIRST_SEMESTER,
      maxStudents: 40,
    },
  });

  // 5. Create Users (admin, teacher, guardian, student)
  const adminPassword = await bcrypt.hash('admin123', 10);
  const teacherPassword = await bcrypt.hash('teacher123', 10);
  const guardianPassword = await bcrypt.hash('guardian123', 10);
  const studentPassword = await bcrypt.hash('student123', 10);

  const adminUser = await prisma.user.create({
      data: {
      userName: 'admin',
      email: 'admin@example.com',
      passwordHash: adminPassword,
        role: Role.ADMIN,
      status: UserStatus.ACTIVE,
      isEmailVerified: true,
      isPhoneVerified: true,
      },
  });
  const teacherUser = await prisma.user.create({
      data: {
      userName: 'teacher',
      email: 'teacher@example.com',
      passwordHash: teacherPassword,
        role: Role.TEACHER,
      status: UserStatus.ACTIVE,
      isEmailVerified: true,
      isPhoneVerified: true,
      },
  });
  const guardianUser = await prisma.user.create({
      data: {
      userName: 'guardian',
      email: 'guardian@example.com',
      passwordHash: guardianPassword,
        role: Role.GUARDIAN,
      status: UserStatus.ACTIVE,
      isEmailVerified: true,
      isPhoneVerified: true,
      },
  });
  const studentUser = await prisma.user.create({
      data: {
      userName: 'student',
      email: 'student@example.com',
      passwordHash: studentPassword,
        role: Role.STUDENT,
      status: UserStatus.ACTIVE,
      isEmailVerified: true,
      isPhoneVerified: true,
    },
  });

  // 6. Create Guardian (guardianId must match userId)
  const guardian = await prisma.guardian.create({
      data: {
      guardianId: guardianUser.userId,
      email: 'guardian@example.com',
      phoneNumber: '09171234567',
      firstName: 'Jane',
        lastName: 'Doe',
      address: '123 Main St',
        gender: UserGender.FEMALE,
      guardianType: GuardianType.PARENT,
        status: Status.ACTIVE,
        relationshipToStudent: 'Mother',
      },
  });

  // 7. Create Student (rfidTag will be set after tag creation)
  let student = await prisma.student.create({
      data: {
      studentIdNum: '20240001',
      rfidTag: '', // placeholder, will update after tag creation
      firstName: 'Alice',
      lastName: 'Johnson',
      email: 'student@example.com',
      phoneNumber: '09170001111',
      address: '456 Main St',
        gender: UserGender.FEMALE,
        studentType: StudentType.REGULAR,
        status: Status.ACTIVE,
        yearLevel: yearLevel.FIRST_YEAR,
      courseId: course.courseId,
      departmentId: department.departmentId,
      guardianId: guardian.guardianId,
      userId: studentUser.userId,
    },
  });

  // 8. Create Instructor (instructorId must match userId, rfidTag will be set after tag creation)
  let instructor = await prisma.instructor.create({
      data: {
      instructorId: teacherUser.userId,
      email: 'teacher@example.com',
      phoneNumber: '09179876543',
      firstName: 'John',
      middleName: 'A.',
      lastName: 'Smith',
        gender: UserGender.MALE,
      instructorType: InstructorType.FULL_TIME,
        status: Status.ACTIVE,
      departmentId: department.departmentId,
      rfidTag: '', // placeholder, will update after tag creation
    },
  });

  // 9. Create RFIDTags for student and instructor
  const studentTag = await prisma.rFIDTags.create({
    data: {
      tagNumber: 'STUDENT123TAG',
      tagType: TagType.STUDENT_CARD,
      status: RFIDStatus.ACTIVE,
      studentId: student.studentId,
    },
  });
  const instructorTag = await prisma.rFIDTags.create({
      data: {
      tagNumber: 'INSTR123TAG',
      tagType: TagType.INSTRUCTOR_CARD,
      status: RFIDStatus.ACTIVE,
      instructorId: instructor.instructorId,
    },
  });

  // 10. Update Student and Instructor with rfidTag
  student = await prisma.student.update({
    where: { studentId: student.studentId },
    data: { rfidTag: studentTag.tagNumber },
  });
  instructor = await prisma.instructor.update({
    where: { instructorId: instructor.instructorId },
    data: { rfidTag: instructorTag.tagNumber },
  });

  // 11. Create Room
  const room = await prisma.room.create({
      data: {
      roomNo: '101',
        roomType: RoomType.LECTURE,
        roomCapacity: 40,
        roomBuildingLoc: 'Main Building',
        roomFloorLoc: '1st Floor',
      readerId: 'READER101',
        status: RoomStatus.AVAILABLE,
      isActive: true,
    },
  });

  // 12. Create RFIDReader
  const rfidReader = await prisma.rFIDReader.create({
      data: {
      roomId: room.roomId,
      deviceId: 'READER101',
      deviceName: 'Main Entrance Reader',
      status: ReaderStatus.ACTIVE,
      ipAddress: '192.168.1.101',
      lastSeen: new Date(),
      components: {},
    },
  });

  // 13. Create Section
  const section = await prisma.section.create({
      data: {
      sectionName: 'CS1A',
        sectionType: SectionType.LECTURE,
      sectionCapacity: 40,
        sectionStatus: SectionStatus.ACTIVE,
        yearLevel: 1,
        academicYear: '2024-2025',
      semester: SemesterType.FIRST_SEMESTER,
      courseId: course.courseId,
      semesterId: semester.semesterId,
    },
  });

  // 14. Create StudentSection
  await prisma.studentSection.create({
      data: {
      studentId: student.studentId,
      sectionId: section.sectionId,
      enrollmentStatus: EnrollmentStatus.ACTIVE,
    },
  });

  // 15. Create SubjectSchedule
  const subjectSchedule = await prisma.subjectSchedule.create({
      data: {
      subjectId: subject.subjectId,
      sectionId: section.sectionId,
      instructorId: instructor.instructorId,
      roomId: room.roomId,
        day: DayOfWeek.MONDAY,
        startTime: '08:00',
      endTime: '10:00',
      slots: 40,
      scheduleType: ScheduleType.REGULAR,
      status: ScheduleStatus.ACTIVE,
      semesterId: semester.semesterId,
        academicYear: '2024-2025',
      isRecurring: true,
      maxStudents: 40,
    },
  });

  // 16. Create StudentSchedule
  await prisma.studentSchedule.create({
      data: {
      studentId: student.studentId,
      scheduleId: subjectSchedule.subjectSchedId,
        status: ScheduleStatus.ACTIVE,
    },
  });

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });