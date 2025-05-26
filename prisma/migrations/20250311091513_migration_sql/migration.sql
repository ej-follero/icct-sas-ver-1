-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'TEACHER', 'STUDENT', 'GUARDIAN');

-- CreateEnum
CREATE TYPE "StudentType" AS ENUM ('IRREGULAR', 'REGULAR');

-- CreateEnum
CREATE TYPE "InstructorType" AS ENUM ('FULL_TIME', 'PART_TIME');

-- CreateEnum
CREATE TYPE "GuardianType" AS ENUM ('PARENT', 'GUARDIAN');

-- CreateEnum
CREATE TYPE "UserGender" AS ENUM ('MALE', 'FEMALE');

-- CreateEnum
CREATE TYPE "SemesterType" AS ENUM ('FIRST_SEMESTER', 'SECOND_SEMESTER', 'THIRD_SEMESTER');

-- CreateEnum
CREATE TYPE "SectionType" AS ENUM ('LECTURE', 'LAB');

-- CreateEnum
CREATE TYPE "SectionStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "CourseType" AS ENUM ('MANDATORY', 'ELECTIVE');

-- CreateEnum
CREATE TYPE "DayOfWeek" AS ENUM ('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT', 'ABSENT', 'LATE', 'EXCUSED');

-- CreateEnum
CREATE TYPE "InstructorAttendanceStatus" AS ENUM ('PRESENT', 'ABSENT', 'LATE', 'ON_LEAVE');

-- CreateEnum
CREATE TYPE "ReportType" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY', 'SEMESTRAL', 'ANNUAL', 'CUSTOM');

-- CreateEnum
CREATE TYPE "Status" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "RFIDStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "idtype" AS ENUM ('STUDENT', 'INSTRUCTOR');

-- CreateTable
CREATE TABLE "User" (
    "userId" SERIAL NOT NULL,
    "userName" TEXT NOT NULL,
    "email" VARCHAR(100) NOT NULL,
    "passwordHash" VARCHAR(255) NOT NULL,
    "role" "Role" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "status" "Status" NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT "User_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "Student" (
    "studentId" SERIAL NOT NULL,
    "studentIdNum" TEXT NOT NULL,
    "rfidNo" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "middleName" TEXT,
    "lastName" TEXT NOT NULL,
    "suffix" TEXT,
    "email" TEXT,
    "phoneNumber" TEXT,
    "address" TEXT NOT NULL,
    "img" TEXT,
    "gender" "UserGender" NOT NULL,
    "studentType" "StudentType" NOT NULL,
    "status" "Status" NOT NULL DEFAULT 'ACTIVE',
    "sectionId" INTEGER NOT NULL,
    "yearLevel" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "guardianId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "Student_pkey" PRIMARY KEY ("studentId")
);

-- CreateTable
CREATE TABLE "Guardian" (
    "guardianId" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "middleName" TEXT,
    "lastName" TEXT NOT NULL,
    "suffix" TEXT,
    "address" TEXT NOT NULL,
    "img" TEXT,
    "gender" "UserGender" NOT NULL,
    "guardianType" "GuardianType" NOT NULL,
    "status" "Status" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Guardian_pkey" PRIMARY KEY ("guardianId")
);

-- CreateTable
CREATE TABLE "Instructor" (
    "instructorId" SERIAL NOT NULL,
    "email" TEXT,
    "phoneNumber" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "middleName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "suffix" TEXT,
    "img" TEXT,
    "gender" "UserGender" NOT NULL,
    "instructorType" "InstructorType" NOT NULL,
    "status" "Status" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Instructor_pkey" PRIMARY KEY ("instructorId")
);

-- CreateTable
CREATE TABLE "Room" (
    "roomId" SERIAL NOT NULL,
    "roomNo" TEXT NOT NULL,
    "roomType" TEXT NOT NULL,
    "roomCapacity" INTEGER NOT NULL,
    "roomBuildingLoc" TEXT NOT NULL,
    "roomFloorLoc" TEXT NOT NULL,

    CONSTRAINT "Room_pkey" PRIMARY KEY ("roomId")
);

-- CreateTable
CREATE TABLE "Semester" (
    "semesterId" SERIAL NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "year" INTEGER NOT NULL,
    "semesterType" "SemesterType" NOT NULL,

    CONSTRAINT "Semester_pkey" PRIMARY KEY ("semesterId")
);

-- CreateTable
CREATE TABLE "Section" (
    "sectionId" SERIAL NOT NULL,
    "sectionName" TEXT NOT NULL,
    "sectionType" "SectionType" NOT NULL,
    "sectionCapacity" INTEGER NOT NULL,
    "sectionStatus" "SectionStatus" NOT NULL,
    "courseId" INTEGER NOT NULL,
    "yearLevel" INTEGER NOT NULL,

    CONSTRAINT "Section_pkey" PRIMARY KEY ("sectionId")
);

-- CreateTable
CREATE TABLE "CourseOffering" (
    "courseId" SERIAL NOT NULL,
    "courseName" TEXT NOT NULL,
    "courseCode" TEXT NOT NULL,
    "courseDescription" TEXT NOT NULL,
    "courseType" "CourseType" NOT NULL,

    CONSTRAINT "CourseOffering_pkey" PRIMARY KEY ("courseId")
);

-- CreateTable
CREATE TABLE "Department" (
    "departmentId" SERIAL NOT NULL,
    "departmentName" TEXT NOT NULL,
    "departmentCode" TEXT NOT NULL,
    "departmentDescription" TEXT NOT NULL,

    CONSTRAINT "Department_pkey" PRIMARY KEY ("departmentId")
);

-- CreateTable
CREATE TABLE "Subjects" (
    "subjectId" SERIAL NOT NULL,
    "subjectName" TEXT NOT NULL,
    "subjectCode" TEXT NOT NULL,
    "lectureUnits" INTEGER NOT NULL DEFAULT 0,
    "labUnits" INTEGER NOT NULL DEFAULT 0,
    "creditedUnits" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Subjects_pkey" PRIMARY KEY ("subjectId")
);

-- CreateTable
CREATE TABLE "SubjectSchedule" (
    "subjectSchedId" SERIAL NOT NULL,
    "subjectId" INTEGER NOT NULL,
    "sectionId" INTEGER NOT NULL,
    "instructorId" INTEGER NOT NULL,
    "roomId" INTEGER NOT NULL,
    "day" "DayOfWeek" NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "slots" INTEGER NOT NULL DEFAULT 0,
    "studentID" INTEGER NOT NULL,

    CONSTRAINT "SubjectSchedule_pkey" PRIMARY KEY ("subjectSchedId")
);

-- CreateTable
CREATE TABLE "Attendance" (
    "attendanceId" SERIAL NOT NULL,
    "eventId" INTEGER,
    "scheduleId" INTEGER,
    "userId" INTEGER NOT NULL,
    "userRole" "Role" NOT NULL,
    "status" "AttendanceStatus" NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Attendance_pkey" PRIMARY KEY ("attendanceId")
);

-- CreateTable
CREATE TABLE "Announcement" (
    "announcementId" SERIAL NOT NULL,
    "createdby" INTEGER NOT NULL,
    "userType" "Role" NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isGeneral" BOOLEAN NOT NULL,
    "subjectId" INTEGER,
    "sectionId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Announcement_pkey" PRIMARY KEY ("announcementId")
);

-- CreateTable
CREATE TABLE "Event" (
    "eventId" SERIAL NOT NULL,
    "createdBy" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "eventDate" TIMESTAMP(3) NOT NULL,
    "location" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("eventId")
);

-- CreateTable
CREATE TABLE "RFIDTags" (
    "tagId" SERIAL NOT NULL,
    "tagNumber" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "RFIDStatus" NOT NULL DEFAULT 'ACTIVE',
    "studentId" INTEGER,
    "instructorId" INTEGER,

    CONSTRAINT "RFIDTags_pkey" PRIMARY KEY ("tagId")
);

-- CreateTable
CREATE TABLE "RFIDReader" (
    "readerId" SERIAL NOT NULL,
    "roomId" INTEGER NOT NULL,
    "deviceId" TEXT NOT NULL,
    "ipAddress" TEXT,
    "status" "Status" NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT "RFIDReader_pkey" PRIMARY KEY ("readerId")
);

-- CreateTable
CREATE TABLE "RFIDLogs" (
    "logsId" SERIAL NOT NULL,
    "rfidTag" TEXT NOT NULL,
    "readerId" INTEGER NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "RFIDLogs_pkey" PRIMARY KEY ("logsId")
);

-- CreateTable
CREATE TABLE "RFIDReaderLogs" (
    "id" SERIAL NOT NULL,
    "readerId" INTEGER NOT NULL,
    "eventType" TEXT NOT NULL,
    "message" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RFIDReaderLogs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReportLog" (
    "reportId" SERIAL NOT NULL,
    "generatedBy" INTEGER NOT NULL,
    "reportType" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "filepath" TEXT,

    CONSTRAINT "ReportLog_pkey" PRIMARY KEY ("reportId")
);

-- CreateTable
CREATE TABLE "SystemLogs" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "actionType" TEXT NOT NULL,
    "details" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SystemLogs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_InstructorToSubjects" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_InstructorToSubjects_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_AttendanceToInstructor" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_AttendanceToInstructor_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_AttendanceToStudent" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_AttendanceToStudent_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_AttendanceToSubjectSchedule" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_AttendanceToSubjectSchedule_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_RFIDLogsToStudent" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_RFIDLogsToStudent_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Student_studentIdNum_key" ON "Student"("studentIdNum");

-- CreateIndex
CREATE UNIQUE INDEX "Student_rfidNo_key" ON "Student"("rfidNo");

-- CreateIndex
CREATE UNIQUE INDEX "Student_email_key" ON "Student"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Student_phoneNumber_key" ON "Student"("phoneNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Guardian_email_key" ON "Guardian"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Guardian_phoneNumber_key" ON "Guardian"("phoneNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Instructor_email_key" ON "Instructor"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Instructor_phoneNumber_key" ON "Instructor"("phoneNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Section_sectionName_key" ON "Section"("sectionName");

-- CreateIndex
CREATE INDEX "Announcement_createdby_userType_idx" ON "Announcement"("createdby", "userType");

-- CreateIndex
CREATE INDEX "Event_eventDate_idx" ON "Event"("eventDate");

-- CreateIndex
CREATE UNIQUE INDEX "RFIDTags_studentId_key" ON "RFIDTags"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "RFIDTags_instructorId_key" ON "RFIDTags"("instructorId");

-- CreateIndex
CREATE UNIQUE INDEX "RFIDReader_deviceId_key" ON "RFIDReader"("deviceId");

-- CreateIndex
CREATE INDEX "_InstructorToSubjects_B_index" ON "_InstructorToSubjects"("B");

-- CreateIndex
CREATE INDEX "_AttendanceToInstructor_B_index" ON "_AttendanceToInstructor"("B");

-- CreateIndex
CREATE INDEX "_AttendanceToStudent_B_index" ON "_AttendanceToStudent"("B");

-- CreateIndex
CREATE INDEX "_AttendanceToSubjectSchedule_B_index" ON "_AttendanceToSubjectSchedule"("B");

-- CreateIndex
CREATE INDEX "_RFIDLogsToStudent_B_index" ON "_RFIDLogsToStudent"("B");

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("sectionId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_guardianId_fkey" FOREIGN KEY ("guardianId") REFERENCES "Guardian"("guardianId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Guardian" ADD CONSTRAINT "Guardian_guardianId_fkey" FOREIGN KEY ("guardianId") REFERENCES "User"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Instructor" ADD CONSTRAINT "Instructor_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "User"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Section" ADD CONSTRAINT "Section_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "CourseOffering"("courseId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubjectSchedule" ADD CONSTRAINT "SubjectSchedule_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subjects"("subjectId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubjectSchedule" ADD CONSTRAINT "SubjectSchedule_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("sectionId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubjectSchedule" ADD CONSTRAINT "SubjectSchedule_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "Instructor"("instructorId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubjectSchedule" ADD CONSTRAINT "SubjectSchedule_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("roomId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubjectSchedule" ADD CONSTRAINT "SubjectSchedule_studentID_fkey" FOREIGN KEY ("studentID") REFERENCES "Student"("studentId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("eventId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Announcement" ADD CONSTRAINT "Announcement_createdby_fkey" FOREIGN KEY ("createdby") REFERENCES "Instructor"("instructorId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Announcement" ADD CONSTRAINT "Announcement_createdby_admin_fkey" FOREIGN KEY ("createdby") REFERENCES "User"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Announcement" ADD CONSTRAINT "Announcement_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subjects"("subjectId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Announcement" ADD CONSTRAINT "Announcement_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("sectionId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_createdByAdmin_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RFIDTags" ADD CONSTRAINT "RFIDTags_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("studentId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RFIDTags" ADD CONSTRAINT "RFIDTags_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "Instructor"("instructorId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RFIDReader" ADD CONSTRAINT "RFIDReader_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("roomId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RFIDLogs" ADD CONSTRAINT "RFIDLogs_readerId_fkey" FOREIGN KEY ("readerId") REFERENCES "RFIDReader"("readerId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RFIDLogs" ADD CONSTRAINT "RFIDLogs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RFIDReaderLogs" ADD CONSTRAINT "RFIDReaderLogs_readerId_fkey" FOREIGN KEY ("readerId") REFERENCES "RFIDReader"("readerId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportLog" ADD CONSTRAINT "ReportLog_generatedBy_fkey" FOREIGN KEY ("generatedBy") REFERENCES "User"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SystemLogs" ADD CONSTRAINT "SystemLogs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_InstructorToSubjects" ADD CONSTRAINT "_InstructorToSubjects_A_fkey" FOREIGN KEY ("A") REFERENCES "Instructor"("instructorId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_InstructorToSubjects" ADD CONSTRAINT "_InstructorToSubjects_B_fkey" FOREIGN KEY ("B") REFERENCES "Subjects"("subjectId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AttendanceToInstructor" ADD CONSTRAINT "_AttendanceToInstructor_A_fkey" FOREIGN KEY ("A") REFERENCES "Attendance"("attendanceId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AttendanceToInstructor" ADD CONSTRAINT "_AttendanceToInstructor_B_fkey" FOREIGN KEY ("B") REFERENCES "Instructor"("instructorId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AttendanceToStudent" ADD CONSTRAINT "_AttendanceToStudent_A_fkey" FOREIGN KEY ("A") REFERENCES "Attendance"("attendanceId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AttendanceToStudent" ADD CONSTRAINT "_AttendanceToStudent_B_fkey" FOREIGN KEY ("B") REFERENCES "Student"("studentId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AttendanceToSubjectSchedule" ADD CONSTRAINT "_AttendanceToSubjectSchedule_A_fkey" FOREIGN KEY ("A") REFERENCES "Attendance"("attendanceId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AttendanceToSubjectSchedule" ADD CONSTRAINT "_AttendanceToSubjectSchedule_B_fkey" FOREIGN KEY ("B") REFERENCES "SubjectSchedule"("subjectSchedId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RFIDLogsToStudent" ADD CONSTRAINT "_RFIDLogsToStudent_A_fkey" FOREIGN KEY ("A") REFERENCES "RFIDLogs"("logsId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RFIDLogsToStudent" ADD CONSTRAINT "_RFIDLogsToStudent_B_fkey" FOREIGN KEY ("B") REFERENCES "Student"("studentId") ON DELETE CASCADE ON UPDATE CASCADE;
