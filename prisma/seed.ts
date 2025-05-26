import { PrismaClient, Role, Status, UserGender, InstructorType, StudentType, yearLevel, SemesterType, SectionType, SectionStatus, CourseType, DayOfWeek, RFIDStatus, TagType, ReaderStatus, Priority, RoomType, RoomStatus, SemesterStatus, CourseStatus, DepartmentType, SubjectType, SubjectStatus, ScheduleType, ScheduleStatus, AttendanceType, AttendanceVerification, AttendanceStatus, ReportType, ReportStatus, RFIDEventType, LogSeverity, ScanType, ScanStatus, EventType, EventStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Clear existing data
  await prisma.$transaction([
    prisma.systemLogs.deleteMany(),
    prisma.reportLog.deleteMany(),
    prisma.rFIDReaderLogs.deleteMany(),
    prisma.rFIDLogs.deleteMany(),
    prisma.rFIDTags.deleteMany(),
    prisma.rFIDReader.deleteMany(),
    prisma.attendance.deleteMany(),
    prisma.subjectSchedule.deleteMany(),
    prisma.studentSection.deleteMany(),
    prisma.subjects.deleteMany(),
    prisma.announcement.deleteMany(),
    prisma.event.deleteMany(),
    prisma.section.deleteMany(),
    prisma.courseOffering.deleteMany(),
    prisma.semester.deleteMany(),
    prisma.room.deleteMany(),
    prisma.instructor.deleteMany(),
    prisma.guardian.deleteMany(),
    prisma.student.deleteMany(),
    prisma.department.deleteMany(),
    prisma.user.deleteMany(),
  ]);

  // Create departments
  const departments = await Promise.all([
    prisma.department.create({
      data: {
        departmentName: 'Computer Science',
        departmentCode: 'CS',
        departmentDescription: 'Computer Science Department',
        departmentStatus: Status.ACTIVE,
        departmentType: DepartmentType.ACADEMIC,
      },
    }),
    prisma.department.create({
      data: {
        departmentName: 'Information Technology',
        departmentCode: 'IT',
        departmentDescription: 'Information Technology Department',
        departmentStatus: Status.ACTIVE,
        departmentType: DepartmentType.ACADEMIC,
      },
    }),
    prisma.department.create({
      data: {
        departmentName: 'Computer Engineering',
        departmentCode: 'CE',
        departmentDescription: 'Computer Engineering Department',
        departmentStatus: Status.ACTIVE,
        departmentType: DepartmentType.ACADEMIC,
      },
    }),
    prisma.department.create({
      data: {
        departmentName: 'Information Systems',
        departmentCode: 'IS',
        departmentDescription: 'Information Systems Department',
        departmentStatus: Status.ACTIVE,
        departmentType: DepartmentType.ACADEMIC,
      },
    }),
    prisma.department.create({
      data: {
        departmentName: 'Software Engineering',
        departmentCode: 'SE',
        departmentDescription: 'Software Engineering Department',
        departmentStatus: Status.ACTIVE,
        departmentType: DepartmentType.ACADEMIC,
      },
    }),
  ]);

  // Create users (admin, instructors, guardians, students)
  const users = await Promise.all([
    // Admin users
    prisma.user.create({
      data: {
        userName: 'admin1',
        email: 'admin1@icct.edu.ph',
        passwordHash: await bcrypt.hash('admin123', 10),
        role: Role.ADMIN,
        status: Status.ACTIVE,
      },
    }),
    prisma.user.create({
      data: {
        userName: 'admin2',
        email: 'admin2@icct.edu.ph',
        passwordHash: await bcrypt.hash('admin123', 10),
        role: Role.ADMIN,
        status: Status.ACTIVE,
      },
    }),
    // Instructor users
    prisma.user.create({
      data: {
        userName: 'john.doe',
        email: 'john.doe@icct.edu.ph',
        passwordHash: await bcrypt.hash('password123', 10),
        role: Role.TEACHER,
        status: Status.ACTIVE,
      },
    }),
    prisma.user.create({
      data: {
        userName: 'jane.smith',
        email: 'jane.smith@icct.edu.ph',
        passwordHash: await bcrypt.hash('password123', 10),
        role: Role.TEACHER,
        status: Status.ACTIVE,
      },
    }),
    prisma.user.create({
      data: {
        userName: 'mike.johnson',
        email: 'mike.johnson@icct.edu.ph',
        passwordHash: await bcrypt.hash('password123', 10),
        role: Role.TEACHER,
        status: Status.ACTIVE,
      },
    }),
    // Guardian users
    prisma.user.create({
      data: {
        userName: 'james.wilson',
        email: 'james.wilson@email.com',
        passwordHash: await bcrypt.hash('password123', 10),
        role: Role.GUARDIAN,
        status: Status.ACTIVE,
      },
    }),
    prisma.user.create({
      data: {
        userName: 'sarah.parker',
        email: 'sarah.parker@email.com',
        passwordHash: await bcrypt.hash('password123', 10),
        role: Role.GUARDIAN,
        status: Status.ACTIVE,
      },
    }),
    // Student users
    prisma.user.create({
      data: {
        userName: 'michael.wilson',
        email: 'michael.wilson@icct.edu.ph',
        passwordHash: await bcrypt.hash('password123', 10),
        role: Role.STUDENT,
        status: Status.ACTIVE,
      },
    }),
    prisma.user.create({
      data: {
        userName: 'emma.parker',
        email: 'emma.parker@icct.edu.ph',
        passwordHash: await bcrypt.hash('password123', 10),
        role: Role.STUDENT,
        status: Status.ACTIVE,
      },
    }),
    prisma.user.create({
      data: {
        userName: 'david.brown',
        email: 'david.brown@icct.edu.ph',
        passwordHash: await bcrypt.hash('password123', 10),
        role: Role.STUDENT,
        status: Status.ACTIVE,
      },
    }),
  ]);

  // Create instructors
  const instructors = await Promise.all([
    prisma.instructor.create({
      data: {
        firstName: 'John',
        middleName: 'Robert',
        lastName: 'Doe',
        suffix: 'Jr.',
        email: 'john.doe@icct.edu.ph',
        phoneNumber: '+639123456789',
        gender: UserGender.MALE,
        instructorType: InstructorType.FULL_TIME,
        status: Status.ACTIVE,
        departmentId: departments[0].departmentId,
        rfidTag: 'RFID001',
        instructorId: users[2].userId,
        officeLocation: 'Room 101',
        officeHours: 'MWF 9:00-11:00',
        specialization: 'Programming',
      },
    }),
    prisma.instructor.create({
      data: {
        firstName: 'Jane',
        middleName: 'Marie',
        lastName: 'Smith',
        email: 'jane.smith@icct.edu.ph',
        phoneNumber: '+639876543210',
        gender: UserGender.FEMALE,
        instructorType: InstructorType.FULL_TIME,
        status: Status.ACTIVE,
        departmentId: departments[1].departmentId,
        rfidTag: 'RFID002',
        instructorId: users[3].userId,
        officeLocation: 'Room 102',
        officeHours: 'TTh 1:00-3:00',
        specialization: 'Database Systems',
      },
    }),
    prisma.instructor.create({
      data: {
        firstName: 'Mike',
        middleName: 'William',
        lastName: 'Johnson',
        email: 'mike.johnson@icct.edu.ph',
        phoneNumber: '+639555666777',
        gender: UserGender.MALE,
        instructorType: InstructorType.PART_TIME,
        status: Status.ACTIVE,
        departmentId: departments[2].departmentId,
        rfidTag: 'RFID003',
        instructorId: users[4].userId,
        officeLocation: 'Room 103',
        officeHours: 'MWF 2:00-4:00',
        specialization: 'Networks',
      },
    }),
  ]);

  // Create guardians
  const guardians = await Promise.all([
    prisma.guardian.create({
      data: {
        firstName: 'James',
        middleName: 'Edward',
        lastName: 'Wilson',
        email: 'james.wilson@email.com',
        phoneNumber: '+639111222333',
        gender: UserGender.MALE,
        guardianType: 'PARENT',
        status: Status.ACTIVE,
        address: '123 Main St, Manila',
        guardianId: users[5].userId,
        relationshipToStudent: 'Father',
        occupation: 'Engineer',
        workplace: 'ABC Company',
        emergencyContact: '+639111222334',
      },
    }),
    prisma.guardian.create({
      data: {
        firstName: 'Sarah',
        middleName: 'Elizabeth',
        lastName: 'Parker',
        email: 'sarah.parker@email.com',
        phoneNumber: '+639444555666',
        gender: UserGender.FEMALE,
        guardianType: 'PARENT',
        status: Status.ACTIVE,
        address: '456 Oak St, Manila',
        guardianId: users[6].userId,
        relationshipToStudent: 'Mother',
        occupation: 'Doctor',
        workplace: 'XYZ Hospital',
        emergencyContact: '+639444555667',
      },
    }),
  ]);

  // Create students
  const students = await Promise.all([
    prisma.student.create({
      data: {
        studentIdNum: '2023-0001',
        firstName: 'Michael',
        middleName: 'James',
        lastName: 'Wilson',
        email: 'michael.wilson@icct.edu.ph',
        phoneNumber: '+639777888999',
        gender: UserGender.MALE,
        studentType: StudentType.REGULAR,
        status: Status.ACTIVE,
        yearLevel: yearLevel.FIRST_YEAR,
        address: '123 Main St, Manila',
        rfidTag: 'RFID004',
        guardianId: guardians[0].guardianId,
        userId: users[7].userId,
        departmentId: departments[0].departmentId,
      },
    }),
    prisma.student.create({
      data: {
        studentIdNum: '2023-0002',
        firstName: 'Emma',
        middleName: 'Grace',
        lastName: 'Parker',
        email: 'emma.parker@icct.edu.ph',
        phoneNumber: '+639333444555',
        gender: UserGender.FEMALE,
        studentType: StudentType.REGULAR,
        status: Status.ACTIVE,
        yearLevel: yearLevel.FIRST_YEAR,
        address: '456 Oak St, Manila',
        rfidTag: 'RFID005',
        guardianId: guardians[1].guardianId,
        userId: users[8].userId,
        departmentId: departments[1].departmentId,
      },
    }),
    prisma.student.create({
      data: {
        studentIdNum: '2023-0003',
        firstName: 'David',
        middleName: 'Thomas',
        lastName: 'Brown',
        email: 'david.brown@icct.edu.ph',
        phoneNumber: '+639666777888',
        gender: UserGender.MALE,
        studentType: StudentType.REGULAR,
        status: Status.ACTIVE,
        yearLevel: yearLevel.FIRST_YEAR,
        address: '789 Pine St, Manila',
        rfidTag: 'RFID006',
        guardianId: guardians[0].guardianId,
        userId: users[9].userId,
        departmentId: departments[2].departmentId,
      },
    }),
  ]);

  // Create rooms
  const rooms = await Promise.all([
    prisma.room.create({
      data: {
        roomNo: 'CS101',
        roomType: RoomType.LABORATORY,
        roomCapacity: 30,
        roomBuildingLoc: 'Main Building',
        roomFloorLoc: '1st Floor',
        readerId: 'READER001',
        status: RoomStatus.AVAILABLE,
      },
    }),
    prisma.room.create({
      data: {
        roomNo: 'IT101',
        roomType: RoomType.LECTURE,
        roomCapacity: 40,
        roomBuildingLoc: 'Main Building',
        roomFloorLoc: '2nd Floor',
        readerId: 'READER002',
        status: RoomStatus.AVAILABLE,
      },
    }),
    prisma.room.create({
      data: {
        roomNo: 'CE101',
        roomType: RoomType.LABORATORY,
        roomCapacity: 25,
        roomBuildingLoc: 'Engineering Building',
        roomFloorLoc: '1st Floor',
        readerId: 'READER003',
        status: RoomStatus.AVAILABLE,
      },
    }),
    prisma.room.create({
      data: {
        roomNo: 'IS101',
        roomType: RoomType.LECTURE,
        roomCapacity: 35,
        roomBuildingLoc: 'Main Building',
        roomFloorLoc: '3rd Floor',
        readerId: 'READER004',
        status: RoomStatus.AVAILABLE,
      },
    }),
    prisma.room.create({
      data: {
        roomNo: 'SE101',
        roomType: RoomType.LABORATORY,
        roomCapacity: 20,
        roomBuildingLoc: 'Engineering Building',
        roomFloorLoc: '2nd Floor',
        readerId: 'READER005',
        status: RoomStatus.AVAILABLE,
      },
    }),
  ]);

  // Create semesters
  const semesters = await Promise.all([
    prisma.semester.create({
      data: {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-05-31'),
        year: 2024,
        semesterType: SemesterType.SECOND_SEMESTER,
        status: SemesterStatus.CURRENT,
      },
    }),
    prisma.semester.create({
      data: {
        startDate: new Date('2024-06-01'),
        endDate: new Date('2024-10-31'),
        year: 2024,
        semesterType: SemesterType.THIRD_SEMESTER,
        status: SemesterStatus.UPCOMING,
      },
    }),
    prisma.semester.create({
      data: {
        startDate: new Date('2023-08-01'),
        endDate: new Date('2023-12-31'),
        year: 2023,
        semesterType: SemesterType.FIRST_SEMESTER,
        status: SemesterStatus.COMPLETED,
      },
    }),
  ]);

  // Create courses
  const courses = await Promise.all([
    prisma.courseOffering.create({
      data: {
        courseCode: 'CS101',
        courseName: 'Introduction to Programming',
        courseType: CourseType.MANDATORY,
        academicYear: '2024-2025',
        semester: SemesterType.SECOND_SEMESTER,
        totalUnits: 3,
        departmentId: departments[0].departmentId,
        semesterId: semesters[0].semesterId,
      },
    }),
    prisma.courseOffering.create({
      data: {
        courseCode: 'IT101',
        courseName: 'Web Development',
        courseType: CourseType.ELECTIVE,
        academicYear: '2024-2025',
        semester: SemesterType.SECOND_SEMESTER,
        totalUnits: 3,
        departmentId: departments[1].departmentId,
        semesterId: semesters[0].semesterId,
      },
    }),
    prisma.courseOffering.create({
      data: {
        courseCode: 'CE101',
        courseName: 'Digital Logic Design',
        courseType: CourseType.MANDATORY,
        academicYear: '2024-2025',
        semester: SemesterType.SECOND_SEMESTER,
        totalUnits: 3,
        departmentId: departments[2].departmentId,
        semesterId: semesters[0].semesterId,
      },
    }),
    prisma.courseOffering.create({
      data: {
        courseCode: 'IS101',
        courseName: 'Database Management',
        courseType: CourseType.MANDATORY,
        academicYear: '2024-2025',
        semester: SemesterType.SECOND_SEMESTER,
        totalUnits: 3,
        departmentId: departments[3].departmentId,
        semesterId: semesters[0].semesterId,
      },
    }),
    prisma.courseOffering.create({
      data: {
        courseCode: 'SE101',
        courseName: 'Software Engineering',
        courseType: CourseType.MANDATORY,
        academicYear: '2024-2025',
        semester: SemesterType.SECOND_SEMESTER,
        totalUnits: 3,
        departmentId: departments[4].departmentId,
        semesterId: semesters[0].semesterId,
      },
    }),
  ]);

  // Create sections
  const sections = await Promise.all([
    prisma.section.create({
      data: {
        sectionName: 'CS101-A',
        sectionType: SectionType.LECTURE,
        sectionCapacity: 30,
        sectionStatus: SectionStatus.ACTIVE,
        yearLevel: 1,
        courseId: courses[0].courseId,
        academicYear: '2024-2025',
        semester: SemesterType.SECOND_SEMESTER,
        semesterId: semesters[0].semesterId,
      },
    }),
    prisma.section.create({
      data: {
        sectionName: 'IT101-A',
        sectionType: SectionType.LAB,
        sectionCapacity: 30,
        sectionStatus: SectionStatus.ACTIVE,
        yearLevel: 1,
        courseId: courses[1].courseId,
        academicYear: '2024-2025',
        semester: SemesterType.SECOND_SEMESTER,
        semesterId: semesters[0].semesterId,
      },
    }),
    prisma.section.create({
      data: {
        sectionName: 'CE101-A',
        sectionType: SectionType.LECTURE,
        sectionCapacity: 25,
        sectionStatus: SectionStatus.ACTIVE,
        yearLevel: 1,
        courseId: courses[2].courseId,
        academicYear: '2024-2025',
        semester: SemesterType.SECOND_SEMESTER,
        semesterId: semesters[0].semesterId,
      },
    }),
    prisma.section.create({
      data: {
        sectionName: 'IS101-A',
        sectionType: SectionType.LAB,
        sectionCapacity: 35,
        sectionStatus: SectionStatus.ACTIVE,
        yearLevel: 1,
        courseId: courses[3].courseId,
        academicYear: '2024-2025',
        semester: SemesterType.SECOND_SEMESTER,
        semesterId: semesters[0].semesterId,
      },
    }),
    prisma.section.create({
      data: {
        sectionName: 'SE101-A',
        sectionType: SectionType.LECTURE,
        sectionCapacity: 20,
        sectionStatus: SectionStatus.ACTIVE,
        yearLevel: 1,
        courseId: courses[4].courseId,
        academicYear: '2024-2025',
        semester: SemesterType.SECOND_SEMESTER,
        semesterId: semesters[0].semesterId,
      },
    }),
  ]);

  // Create student sections
  await Promise.all([
    prisma.studentSection.create({
      data: {
        studentId: students[0].studentId,
        sectionId: sections[0].sectionId,
      },
    }),
    prisma.studentSection.create({
      data: {
        studentId: students[1].studentId,
        sectionId: sections[1].sectionId,
      },
    }),
    prisma.studentSection.create({
      data: {
        studentId: students[2].studentId,
        sectionId: sections[2].sectionId,
      },
    }),
  ]);

  // Create subjects
  const subjects = await Promise.all([
    prisma.subjects.create({
      data: {
        subjectCode: 'CS101-LEC',
        subjectName: 'Introduction to Programming Lecture',
        lectureUnits: 2,
        labUnits: 1,
        creditedUnits: 3,
        totalHours: 54,
        academicYear: '2024-2025',
        semester: SemesterType.SECOND_SEMESTER,
        courseId: courses[0].courseId,
        departmentId: departments[0].departmentId,
        Instructor: { connect: [{ instructorId: instructors[0].instructorId }] },
      },
    }),
    prisma.subjects.create({
      data: {
        subjectCode: 'IT101-LAB',
        subjectName: 'Web Development Laboratory',
        lectureUnits: 1,
        labUnits: 2,
        creditedUnits: 3,
        totalHours: 54,
        academicYear: '2024-2025',
        semester: SemesterType.SECOND_SEMESTER,
        courseId: courses[1].courseId,
        departmentId: departments[1].departmentId,
        Instructor: { connect: [{ instructorId: instructors[1].instructorId }] },
      },
    }),
    prisma.subjects.create({
      data: {
        subjectCode: 'CE101-LEC',
        subjectName: 'Digital Logic Design Lecture',
        lectureUnits: 2,
        labUnits: 1,
        creditedUnits: 3,
        totalHours: 54,
        academicYear: '2024-2025',
        semester: SemesterType.SECOND_SEMESTER,
        courseId: courses[2].courseId,
        departmentId: departments[2].departmentId,
        Instructor: { connect: [{ instructorId: instructors[2].instructorId }] },
      },
    }),
    prisma.subjects.create({
      data: {
        subjectCode: 'IS101-LAB',
        subjectName: 'Database Management Laboratory',
        lectureUnits: 1,
        labUnits: 2,
        creditedUnits: 3,
        totalHours: 54,
        academicYear: '2024-2025',
        semester: SemesterType.SECOND_SEMESTER,
        courseId: courses[3].courseId,
        departmentId: departments[3].departmentId,
        Instructor: { connect: [{ instructorId: instructors[0].instructorId }] },
      },
    }),
    prisma.subjects.create({
      data: {
        subjectCode: 'SE101-LEC',
        subjectName: 'Software Engineering Lecture',
        lectureUnits: 2,
        labUnits: 1,
        creditedUnits: 3,
        totalHours: 54,
        academicYear: '2024-2025',
        semester: SemesterType.SECOND_SEMESTER,
        courseId: courses[4].courseId,
        departmentId: departments[4].departmentId,
        Instructor: { connect: [{ instructorId: instructors[1].instructorId }] },
      },
    }),
  ]);

  // Create subject schedules
  const subjectSchedules = await Promise.all([
    prisma.subjectSchedule.create({
      data: {
        subjectId: subjects[0].subjectId,
        sectionId: sections[0].sectionId,
        roomId: rooms[0].roomId,
        instructorId: instructors[0].instructorId,
        day: DayOfWeek.MONDAY,
        startTime: '08:00',
        endTime: '09:30',
        semesterId: semesters[0].semesterId,
        academicYear: '2024-2025',
      },
    }),
    prisma.subjectSchedule.create({
      data: {
        subjectId: subjects[1].subjectId,
        sectionId: sections[1].sectionId,
        roomId: rooms[1].roomId,
        instructorId: instructors[1].instructorId,
        day: DayOfWeek.TUESDAY,
        startTime: '10:00',
        endTime: '11:30',
        semesterId: semesters[0].semesterId,
        academicYear: '2024-2025',
      },
    }),
    prisma.subjectSchedule.create({
      data: {
        subjectId: subjects[2].subjectId,
        sectionId: sections[2].sectionId,
        roomId: rooms[2].roomId,
        instructorId: instructors[2].instructorId,
        day: DayOfWeek.WEDNESDAY,
        startTime: '13:00',
        endTime: '14:30',
        semesterId: semesters[0].semesterId,
        academicYear: '2024-2025',
      },
    }),
    prisma.subjectSchedule.create({
      data: {
        subjectId: subjects[3].subjectId,
        sectionId: sections[3].sectionId,
        roomId: rooms[3].roomId,
        instructorId: instructors[0].instructorId,
        day: DayOfWeek.THURSDAY,
        startTime: '15:00',
        endTime: '16:30',
        semesterId: semesters[0].semesterId,
        academicYear: '2024-2025',
      },
    }),
    prisma.subjectSchedule.create({
      data: {
        subjectId: subjects[4].subjectId,
        sectionId: sections[4].sectionId,
        roomId: rooms[4].roomId,
        instructorId: instructors[1].instructorId,
        day: DayOfWeek.FRIDAY,
        startTime: '09:00',
        endTime: '10:30',
        semesterId: semesters[0].semesterId,
        academicYear: '2024-2025',
      },
    }),
  ]);

  // Create RFID tags
  await Promise.all([
    prisma.rFIDTags.create({
      data: {
        tagNumber: 'TAG001',
        status: RFIDStatus.ACTIVE,
        tagType: TagType.INSTRUCTOR_CARD,
        instructorId: instructors[0].instructorId,
      },
    }),
    prisma.rFIDTags.create({
      data: {
        tagNumber: 'TAG002',
        status: RFIDStatus.ACTIVE,
        tagType: TagType.INSTRUCTOR_CARD,
        instructorId: instructors[1].instructorId,
      },
    }),
    prisma.rFIDTags.create({
      data: {
        tagNumber: 'TAG003',
        status: RFIDStatus.ACTIVE,
        tagType: TagType.INSTRUCTOR_CARD,
        instructorId: instructors[2].instructorId,
      },
    }),
    prisma.rFIDTags.create({
      data: {
        tagNumber: 'TAG004',
        status: RFIDStatus.ACTIVE,
        tagType: TagType.STUDENT_CARD,
        studentId: students[0].studentId,
      },
    }),
    prisma.rFIDTags.create({
      data: {
        tagNumber: 'TAG005',
        status: RFIDStatus.ACTIVE,
        tagType: TagType.STUDENT_CARD,
        studentId: students[1].studentId,
      },
    }),
  ]);

  // Create RFID readers
  await Promise.all([
    prisma.rFIDReader.create({
      data: {
        deviceId: 'READER001',
        roomId: rooms[0].roomId,
        status: ReaderStatus.ACTIVE,
        deviceName: 'RFID Reader 001',
        components: {
          rfidModule: 'Default',
          microcontroller: 'Default',
          powerSupply: 'Default',
          antenna: 'Default'
        },
      },
    }),
    prisma.rFIDReader.create({
      data: {
        deviceId: 'READER002',
        roomId: rooms[1].roomId,
        status: ReaderStatus.ACTIVE,
        deviceName: 'RFID Reader 002',
        components: {
          rfidModule: 'Default',
          microcontroller: 'Default',
          powerSupply: 'Default',
          antenna: 'Default'
        },
      },
    }),
    prisma.rFIDReader.create({
      data: {
        deviceId: 'READER003',
        roomId: rooms[2].roomId,
        status: ReaderStatus.ACTIVE,
        deviceName: 'RFID Reader 003',
        components: {
          rfidModule: 'Default',
          microcontroller: 'Default',
          powerSupply: 'Default',
          antenna: 'Default'
        },
      },
    }),
    prisma.rFIDReader.create({
      data: {
        deviceId: 'READER004',
        roomId: rooms[3].roomId,
        status: ReaderStatus.ACTIVE,
        deviceName: 'RFID Reader 004',
        components: {
          rfidModule: 'Default',
          microcontroller: 'Default',
          powerSupply: 'Default',
          antenna: 'Default'
        },
      },
    }),
    prisma.rFIDReader.create({
      data: {
        deviceId: 'READER005',
        roomId: rooms[4].roomId,
        status: ReaderStatus.ACTIVE,
        deviceName: 'RFID Reader 005',
        components: {
          rfidModule: 'Default',
          microcontroller: 'Default',
          powerSupply: 'Default',
          antenna: 'Default'
        },
      },
    }),
  ]);

  // Create announcements
  await Promise.all([
    prisma.announcement.create({
      data: {
        createdby: users[0].userId,
        userType: Role.ADMIN,
        title: 'Welcome to Second Semester',
        content: 'Welcome back students! Classes will start on January 15, 2024.',
        isGeneral: true,
        status: Status.ACTIVE,
        priority: Priority.NORMAL,
      },
    }),
    prisma.announcement.create({
      data: {
        createdby: users[2].userId,
        userType: Role.TEACHER,
        title: 'Programming Assignment Due',
        content: 'The first programming assignment is due next week.',
        isGeneral: false,
        subjectId: subjects[0].subjectId,
        sectionId: sections[0].sectionId,
        instructorId: instructors[0].instructorId,
        status: Status.ACTIVE,
        priority: Priority.HIGH,
      },
    }),
    prisma.announcement.create({
      data: {
        createdby: users[3].userId,
        userType: Role.TEACHER,
        title: 'Web Development Project',
        content: 'Group project presentations will be next month.',
        isGeneral: false,
        subjectId: subjects[1].subjectId,
        sectionId: sections[1].sectionId,
        instructorId: instructors[1].instructorId,
        status: Status.ACTIVE,
        priority: Priority.NORMAL,
      },
    }),
    prisma.announcement.create({
      data: {
        createdby: users[4].userId,
        userType: Role.TEACHER,
        title: 'Digital Logic Lab Schedule',
        content: 'Lab sessions will be held every Wednesday.',
        isGeneral: false,
        subjectId: subjects[2].subjectId,
        sectionId: sections[2].sectionId,
        instructorId: instructors[2].instructorId,
        status: Status.ACTIVE,
        priority: Priority.NORMAL,
      },
    }),
    prisma.announcement.create({
      data: {
        createdby: users[1].userId,
        userType: Role.ADMIN,
        title: 'Holiday Announcement',
        content: 'The campus will be closed on February 25, 2024.',
        isGeneral: true,
        status: Status.ACTIVE,
        priority: Priority.HIGH,
      },
    }),
  ]);

  // Create events
  await Promise.all([
    prisma.event.create({
      data: {
        title: 'Orientation Day',
        description: 'Welcome orientation for new students',
        eventDate: new Date('2024-01-15'),
        endDate: new Date('2024-01-15T12:00:00Z'),
        location: 'Main Auditorium',
        eventType: EventType.ACADEMIC,
        status: EventStatus.SCHEDULED,
        createdBy: users[0].userId,
      },
    }),
    prisma.event.create({
      data: {
        title: 'Programming Competition',
        description: 'Annual programming competition for students',
        eventDate: new Date('2024-02-20'),
        endDate: new Date('2024-02-20T17:00:00Z'),
        location: 'Computer Lab 1',
        eventType: EventType.OTHER,
        status: EventStatus.SCHEDULED,
        createdBy: users[2].userId,
      },
    }),
    prisma.event.create({
      data: {
        title: 'Career Fair',
        description: 'Job fair for graduating students',
        eventDate: new Date('2024-03-15'),
        endDate: new Date('2024-03-15T16:00:00Z'),
        location: 'Main Hall',
        eventType: EventType.OTHER,
        status: EventStatus.SCHEDULED,
        createdBy: users[1].userId,
      },
    }),
    prisma.event.create({
      data: {
        title: 'Research Symposium',
        description: 'Presentation of student research projects',
        eventDate: new Date('2024-04-10'),
        endDate: new Date('2024-04-10T17:00:00Z'),
        location: 'Conference Room',
        eventType: EventType.ACADEMIC,
        status: EventStatus.SCHEDULED,
        createdBy: users[3].userId,
      },
    }),
    prisma.event.create({
      data: {
        title: 'Graduation Ceremony',
        description: 'Commencement exercises for graduating students',
        eventDate: new Date('2024-05-25'),
        endDate: new Date('2024-05-25T18:00:00Z'),
        location: 'Main Auditorium',
        eventType: EventType.GRADUATION,
        status: EventStatus.SCHEDULED,
        createdBy: users[0].userId,
      },
    }),
  ]);

  // Create attendance records
  const attendanceRecords = await Promise.all([
    prisma.attendance.create({
      data: {
        timestamp: new Date(),
        status: AttendanceStatus.PRESENT,
        verification: AttendanceVerification.VERIFIED,
        userRole: Role.STUDENT,
        attendanceType: AttendanceType.RFID_SCAN,
        user: {
          connect: {
            userId: users[7].userId // Connect to first student
          }
        },
        SubjectSchedule: {
          connect: {
            subjectSchedId: subjectSchedules[0].subjectSchedId
          }
        }
      }
    }),
    prisma.attendance.create({
      data: {
        timestamp: new Date(),
        status: AttendanceStatus.LATE,
        verification: AttendanceVerification.VERIFIED,
        userRole: Role.STUDENT,
        attendanceType: AttendanceType.RFID_SCAN,
        user: {
          connect: {
            userId: users[8].userId // Connect to second student
          }
        },
        SubjectSchedule: {
          connect: {
            subjectSchedId: subjectSchedules[1].subjectSchedId
          }
        }
      }
    }),
    prisma.attendance.create({
      data: {
        timestamp: new Date(),
        status: AttendanceStatus.ABSENT,
        verification: AttendanceVerification.PENDING,
        userRole: Role.STUDENT,
        attendanceType: AttendanceType.MANUAL_ENTRY,
        user: {
          connect: {
            userId: users[9].userId // Connect to third student
          }
        },
        SubjectSchedule: {
          connect: {
            subjectSchedId: subjectSchedules[2].subjectSchedId
          }
        }
      }
    })
  ]);

  console.log('Created attendance records:', attendanceRecords.length);

  // Create RFID logs
  await Promise.all([
    prisma.rFIDLogs.create({
      data: {
        rfidTag: 'TAG001',
        readerId: 1,
        scanType: ScanType.CHECK_IN,
        scanStatus: ScanStatus.SUCCESS,
        location: 'Main Entrance',
        userId: students[0].userId,
        userRole: Role.STUDENT,
        deviceInfo: { device: 'RFID Reader 1', version: '1.0' },
        ipAddress: '192.168.1.100',
      },
    }),
    prisma.rFIDLogs.create({
      data: {
        rfidTag: 'TAG002',
        readerId: 2,
        scanType: ScanType.CHECK_IN,
        scanStatus: ScanStatus.SUCCESS,
        location: 'Computer Lab',
        userId: students[1].userId,
        userRole: Role.STUDENT,
        deviceInfo: { device: 'RFID Reader 2', version: '1.0' },
        ipAddress: '192.168.1.101',
      },
    }),
    prisma.rFIDLogs.create({
      data: {
        rfidTag: 'TAG003',
        readerId: 1,
        scanType: ScanType.CHECK_OUT,
        scanStatus: ScanStatus.SUCCESS,
        location: 'Main Entrance',
        userId: students[2].userId,
        userRole: Role.STUDENT,
        deviceInfo: { device: 'RFID Reader 1', version: '1.0' },
        ipAddress: '192.168.1.100',
      },
    }),
    prisma.rFIDLogs.create({
      data: {
        rfidTag: 'TAG004',
        readerId: 3,
        scanType: ScanType.VERIFICATION,
        scanStatus: ScanStatus.SUCCESS,
        location: 'Library',
        userId: instructors[0].instructorId,
        userRole: Role.TEACHER,
        deviceInfo: { device: 'RFID Reader 3', version: '1.0' },
        ipAddress: '192.168.1.102',
      },
    }),
    prisma.rFIDLogs.create({
      data: {
        rfidTag: 'TAG005',
        readerId: 2,
        scanType: ScanType.TEST_SCAN,
        scanStatus: ScanStatus.SUCCESS,
        location: 'Computer Lab',
        userId: students[0].userId,
        userRole: Role.STUDENT,
        deviceInfo: { device: 'RFID Reader 2', version: '1.0' },
        ipAddress: '192.168.1.101',
      },
    }),
  ]);

  // Create RFID reader logs
  await Promise.all([
    prisma.rFIDReaderLogs.create({
      data: {
        readerId: 1,
        eventType: RFIDEventType.SCAN_SUCCESS,
        severity: LogSeverity.INFO,
        message: 'Reader online and operational',
        details: { status: 'active', battery: '100%' },
        ipAddress: '192.168.1.100',
      },
    }),
    prisma.rFIDReaderLogs.create({
      data: {
        readerId: 2,
        eventType: RFIDEventType.CONNECTION_LOST,
        severity: LogSeverity.WARNING,
        message: 'Reader connection lost',
        details: { lastSeen: '2024-01-15T10:00:00Z' },
        ipAddress: '192.168.1.101',
      },
    }),
    prisma.rFIDReaderLogs.create({
      data: {
        readerId: 3,
        eventType: RFIDEventType.BATTERY_LOW,
        severity: LogSeverity.WARNING,
        message: 'Reader battery low',
        details: { battery: '15%' },
        ipAddress: '192.168.1.102',
      },
    }),
    prisma.rFIDReaderLogs.create({
      data: {
        readerId: 1,
        eventType: RFIDEventType.CONFIGURATION_CHANGE,
        severity: LogSeverity.INFO,
        message: 'Reader configuration updated',
        details: { version: '1.1', changes: ['Added new scan types'] },
        ipAddress: '192.168.1.100',
      },
    }),
    prisma.rFIDReaderLogs.create({
      data: {
        readerId: 2,
        eventType: RFIDEventType.MAINTENANCE_REQUIRED,
        severity: LogSeverity.WARNING,
        message: 'Reader requires maintenance',
        details: { lastMaintenance: '2023-12-01', issues: ['Calibration needed'] },
        ipAddress: '192.168.1.101',
      },
    }),
  ]);

  // Create report logs
  await Promise.all([
    prisma.reportLog.create({
      data: {
        reportType: ReportType.ATTENDANCE_SUMMARY,
        reportName: 'January 2024 Attendance Summary',
        description: 'Monthly attendance summary report',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        status: ReportStatus.COMPLETED,
        generatedBy: users[0].userId,
        parameters: {
          totalStudents: 3,
          presentCount: 2,
          absentCount: 1,
        },
      },
    }),
    prisma.reportLog.create({
      data: {
        reportType: ReportType.STUDENT_ATTENDANCE,
        reportName: 'Student Attendance Report',
        description: 'Individual student attendance report',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        status: ReportStatus.COMPLETED,
        generatedBy: users[1].userId,
        parameters: {
          studentId: students[0].studentId,
          attendanceRecords: 5,
        },
      },
    }),
    prisma.reportLog.create({
      data: {
        reportType: ReportType.INSTRUCTOR_ATTENDANCE,
        reportName: 'Instructor Attendance Report',
        description: 'Instructor attendance report',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        status: ReportStatus.COMPLETED,
        generatedBy: users[2].userId,
        parameters: {
          instructorId: instructors[0].instructorId,
          attendanceRecords: 3,
        },
      },
    }),
    prisma.reportLog.create({
      data: {
        reportType: ReportType.COURSE_ATTENDANCE,
        reportName: 'Course Attendance Report',
        description: 'Course attendance report',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        status: ReportStatus.COMPLETED,
        generatedBy: users[3].userId,
        parameters: {
          courseId: 1,
          attendanceRecords: 10,
        },
      },
    }),
    prisma.reportLog.create({
      data: {
        reportType: ReportType.DEPARTMENT_ATTENDANCE,
        reportName: 'Department Attendance Report',
        description: 'Department attendance report',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        status: ReportStatus.COMPLETED,
        generatedBy: users[4].userId,
        parameters: {
          departmentId: departments[0].departmentId,
          attendanceRecords: 15,
        },
      },
    }),
  ]);

  // Create system logs
  await Promise.all([
    prisma.systemLogs.create({
      data: {
        userId: users[0].userId,
        actionType: 'LOGIN',
        module: 'AUTH',
        entityId: null,
        details: 'User logged in successfully',
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0',
      },
    }),
    prisma.systemLogs.create({
      data: {
        userId: users[1].userId,
        actionType: 'CREATE',
        module: 'ATTENDANCE',
        entityId: 1,
        details: 'Created new attendance record',
        ipAddress: '192.168.1.101',
        userAgent: 'Mozilla/5.0',
      },
    }),
    prisma.systemLogs.create({
      data: {
        userId: users[2].userId,
        actionType: 'UPDATE',
        module: 'STUDENT',
        entityId: students[0].studentId,
        details: 'Updated student information',
        ipAddress: '192.168.1.102',
        userAgent: 'Mozilla/5.0',
      },
    }),
  ]);

  console.log('Database has been seeded. 🌱');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });