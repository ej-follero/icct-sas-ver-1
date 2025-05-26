/*
  Warnings:

  - The values [DAILY,WEEKLY,MONTHLY,SEMESTRAL,ANNUAL] on the enum `ReportType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `rfidtagNumber` on the `Instructor` table. All the data in the column will be lost.
  - The `status` column on the `RFIDReader` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `studentID` on the `SubjectSchedule` table. All the data in the column will be lost.
  - The `status` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the `_InstructorToRFIDLogs` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[courseCode]` on the table `CourseOffering` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[departmentCode]` on the table `Department` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[readerId]` on the table `Room` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[subjectCode]` on the table `Subjects` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updatedAt` to the `Announcement` table without a default value. This is not possible if the table is not empty.
  - Added the required column `attendanceType` to the `Attendance` table without a default value. This is not possible if the table is not empty.
  - Added the required column `academicYear` to the `CourseOffering` table without a default value. This is not possible if the table is not empty.
  - Added the required column `departmentId` to the `CourseOffering` table without a default value. This is not possible if the table is not empty.
  - Added the required column `semester` to the `CourseOffering` table without a default value. This is not possible if the table is not empty.
  - Added the required column `semesterId` to the `CourseOffering` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalUnits` to the `CourseOffering` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `CourseOffering` table without a default value. This is not possible if the table is not empty.
  - Added the required column `eventType` to the `Event` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Event` table without a default value. This is not possible if the table is not empty.
  - Added the required column `relationshipToStudent` to the `Guardian` table without a default value. This is not possible if the table is not empty.
  - Added the required column `location` to the `RFIDLogs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `scanType` to the `RFIDLogs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userRole` to the `RFIDLogs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `components` to the `RFIDReader` table without a default value. This is not possible if the table is not empty.
  - Added the required column `deviceName` to the `RFIDReader` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `eventType` on the `RFIDReaderLogs` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `tagType` to the `RFIDTags` table without a default value. This is not possible if the table is not empty.
  - Added the required column `reportName` to the `ReportLog` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `ReportLog` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `reportType` on the `ReportLog` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `updatedAt` to the `Room` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `roomType` on the `Room` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `academicYear` to the `Section` table without a default value. This is not possible if the table is not empty.
  - Added the required column `semester` to the `Section` table without a default value. This is not possible if the table is not empty.
  - Added the required column `semesterId` to the `Section` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Section` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Semester` table without a default value. This is not possible if the table is not empty.
  - Added the required column `academicYear` to the `SubjectSchedule` table without a default value. This is not possible if the table is not empty.
  - Added the required column `semesterId` to the `SubjectSchedule` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `SubjectSchedule` table without a default value. This is not possible if the table is not empty.
  - Added the required column `academicYear` to the `Subjects` table without a default value. This is not possible if the table is not empty.
  - Added the required column `courseId` to the `Subjects` table without a default value. This is not possible if the table is not empty.
  - Added the required column `departmentId` to the `Subjects` table without a default value. This is not possible if the table is not empty.
  - Added the required column `semester` to the `Subjects` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalHours` to the `Subjects` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Subjects` table without a default value. This is not possible if the table is not empty.
  - Added the required column `module` to the `SystemLogs` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING', 'BLOCKED');

-- CreateEnum
CREATE TYPE "RoomType" AS ENUM ('LECTURE', 'LABORATORY', 'CONFERENCE', 'OFFICE', 'OTHER');

-- CreateEnum
CREATE TYPE "RoomStatus" AS ENUM ('AVAILABLE', 'OCCUPIED', 'MAINTENANCE', 'RESERVED', 'INACTIVE');

-- CreateEnum
CREATE TYPE "SemesterStatus" AS ENUM ('UPCOMING', 'CURRENT', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "EnrollmentStatus" AS ENUM ('ACTIVE', 'DROPPED', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "CourseStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'ARCHIVED', 'PENDING_REVIEW');

-- CreateEnum
CREATE TYPE "DepartmentType" AS ENUM ('ACADEMIC', 'ADMINISTRATIVE');

-- CreateEnum
CREATE TYPE "SubjectType" AS ENUM ('LECTURE', 'LABORATORY', 'HYBRID', 'THESIS', 'RESEARCH', 'INTERNSHIP');

-- CreateEnum
CREATE TYPE "SubjectStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'ARCHIVED', 'PENDING_REVIEW');

-- CreateEnum
CREATE TYPE "ScheduleType" AS ENUM ('REGULAR', 'MAKEUP', 'SPECIAL', 'REVIEW', 'EXAM');

-- CreateEnum
CREATE TYPE "ScheduleStatus" AS ENUM ('ACTIVE', 'CANCELLED', 'POSTPONED', 'COMPLETED', 'CONFLICT');

-- CreateEnum
CREATE TYPE "AttendanceType" AS ENUM ('RFID_SCAN', 'MANUAL_ENTRY', 'ONLINE');

-- CreateEnum
CREATE TYPE "AttendanceVerification" AS ENUM ('PENDING', 'VERIFIED', 'DISPUTED', 'REJECTED');

-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('PENDING', 'GENERATING', 'COMPLETED', 'FAILED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "RFIDEventType" AS ENUM ('SCAN_SUCCESS', 'SCAN_ERROR', 'CONNECTION_LOST', 'CONNECTION_RESTORED', 'BATTERY_LOW', 'BATTERY_CRITICAL', 'SIGNAL_WEAK', 'SIGNAL_LOST', 'RESTART', 'CONFIGURATION_CHANGE', 'FIRMWARE_UPDATE', 'MAINTENANCE_REQUIRED', 'SYSTEM_ERROR');

-- CreateEnum
CREATE TYPE "LogSeverity" AS ENUM ('DEBUG', 'INFO', 'WARNING', 'ERROR', 'CRITICAL');

-- CreateEnum
CREATE TYPE "ScanType" AS ENUM ('CHECK_IN', 'CHECK_OUT', 'VERIFICATION', 'TEST_SCAN', 'MAINTENANCE');

-- CreateEnum
CREATE TYPE "ScanStatus" AS ENUM ('SUCCESS', 'FAILED', 'DUPLICATE', 'INVALID_TAG', 'EXPIRED_TAG', 'UNAUTHORIZED', 'SYSTEM_ERROR');

-- CreateEnum
CREATE TYPE "ReaderStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'TESTING', 'CALIBRATION', 'REPAIR', 'OFFLINE', 'ERROR');

-- CreateEnum
CREATE TYPE "TagType" AS ENUM ('STUDENT_CARD', 'INSTRUCTOR_CARD', 'TEMPORARY_PASS', 'VISITOR_PASS', 'MAINTENANCE', 'TEST');

-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('ACADEMIC', 'SOCIAL', 'SPORTS', 'ORIENTATION', 'GRADUATION', 'MEETING', 'WORKSHOP', 'SEMINAR', 'OTHER');

-- CreateEnum
CREATE TYPE "EventStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'ONGOING', 'COMPLETED', 'CANCELLED', 'POSTPONED');

-- CreateEnum
CREATE TYPE "ReportType_new" AS ENUM ('ATTENDANCE_SUMMARY', 'STUDENT_ATTENDANCE', 'INSTRUCTOR_ATTENDANCE', 'COURSE_ATTENDANCE', 'DEPARTMENT_ATTENDANCE', 'RFID_ACTIVITY', 'SYSTEM_ACTIVITY', 'USER_ACTIVITY', 'CUSTOM');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "RFIDStatus" ADD VALUE 'LOST';
ALTER TYPE "RFIDStatus" ADD VALUE 'DAMAGED';
ALTER TYPE "RFIDStatus" ADD VALUE 'EXPIRED';
ALTER TYPE "RFIDStatus" ADD VALUE 'REPLACED';
ALTER TYPE "RFIDStatus" ADD VALUE 'RESERVED';

-- DropForeignKey
ALTER TABLE "SubjectSchedule" DROP CONSTRAINT "SubjectSchedule_studentID_fkey";

-- DropForeignKey
ALTER TABLE "_InstructorToRFIDLogs" DROP CONSTRAINT "_InstructorToRFIDLogs_A_fkey";

-- DropForeignKey
ALTER TABLE "_InstructorToRFIDLogs" DROP CONSTRAINT "_InstructorToRFIDLogs_B_fkey";

-- DropIndex
DROP INDEX "Instructor_rfidtagNumber_key";

-- All ALTER TABLE statements
ALTER TABLE "Announcement" ADD COLUMN     "priority" "Priority" NOT NULL DEFAULT 'NORMAL',
ADD COLUMN     "status" "Status" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "isGeneral" SET DEFAULT false;

ALTER TABLE "Attendance" ADD COLUMN     "attendanceType" "AttendanceType" NOT NULL DEFAULT 'RFID_SCAN',
ADD COLUMN     "checkOutTime" TIMESTAMP(3),
ADD COLUMN     "deviceInfo" JSONB,
ADD COLUMN     "duration" INTEGER,
ADD COLUMN     "location" TEXT,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "verification" "AttendanceVerification" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "verificationNotes" TEXT,
ADD COLUMN     "verificationTime" TIMESTAMP(3),
ADD COLUMN     "verifiedBy" INTEGER;

ALTER TABLE "CourseOffering" ADD COLUMN     "academicYear" TEXT NOT NULL DEFAULT '2024-2025',
ADD COLUMN     "courseStatus" "CourseStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "departmentId" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "semester" "SemesterType" NOT NULL DEFAULT 'FIRST_SEMESTER',
ADD COLUMN     "semesterId" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "totalSections" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "totalStudents" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "totalUnits" INTEGER NOT NULL DEFAULT 3,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "Department" ADD COLUMN     "contactEmail" TEXT,
ADD COLUMN     "contactPhone" TEXT,
ADD COLUMN     "departmentType" "DepartmentType" NOT NULL DEFAULT 'ACADEMIC',
ADD COLUMN     "headOfDepartment" INTEGER,
ADD COLUMN     "location" TEXT,
ADD COLUMN     "totalInstructors" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "totalStudents" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "Event" ADD COLUMN     "capacity" INTEGER,
ADD COLUMN     "contactEmail" TEXT,
ADD COLUMN     "contactPhone" TEXT,
ADD COLUMN     "endDate" TIMESTAMP(3),
ADD COLUMN     "eventType" "EventType" NOT NULL DEFAULT 'ACADEMIC',
ADD COLUMN     "imageUrl" TEXT,
ADD COLUMN     "isPublic" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "priority" "Priority" NOT NULL DEFAULT 'NORMAL',
ADD COLUMN     "registeredCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "requiresRegistration" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "status" "EventStatus" NOT NULL DEFAULT 'DRAFT',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "Guardian" ADD COLUMN     "emergencyContact" TEXT,
ADD COLUMN     "lastLogin" TIMESTAMP(3),
ADD COLUMN     "notificationPreferences" JSONB,
ADD COLUMN     "occupation" TEXT,
ADD COLUMN     "relationshipToStudent" TEXT NOT NULL DEFAULT 'Parent',
ADD COLUMN     "totalStudents" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "workplace" TEXT;

ALTER TABLE "Instructor" DROP COLUMN "rfidtagNumber",
ADD COLUMN     "officeHours" TEXT,
ADD COLUMN     "officeLocation" TEXT,
ADD COLUMN     "specialization" TEXT,
ADD COLUMN     "totalStudents" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "totalSubjects" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "RFIDReader" ADD COLUMN     "assemblyDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "components" JSONB NOT NULL DEFAULT '{"rfidModule": "Default", "microcontroller": "Default", "powerSupply": "Default", "antenna": "Default"}',
ADD COLUMN     "deviceName" TEXT NOT NULL DEFAULT 'RFID Reader',
ADD COLUMN     "lastCalibration" TIMESTAMP(3),
ADD COLUMN     "lastSeen" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "nextCalibration" TIMESTAMP(3),
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "testResults" JSONB,
DROP COLUMN "status",
ADD COLUMN     "status" "ReaderStatus" NOT NULL DEFAULT 'ACTIVE';

ALTER TABLE "RFIDLogs" ADD COLUMN     "deviceInfo" JSONB,
ADD COLUMN     "ipAddress" TEXT,
ADD COLUMN     "location" TEXT NOT NULL DEFAULT 'Unknown',
ADD COLUMN     "scanStatus" "ScanStatus" NOT NULL DEFAULT 'SUCCESS',
ADD COLUMN     "scanType" "ScanType" NOT NULL DEFAULT 'CHECK_IN',
ADD COLUMN     "userRole" "Role" NOT NULL DEFAULT 'STUDENT';

ALTER TABLE "RFIDReaderLogs" ADD COLUMN "details" JSONB,
ADD COLUMN "ipAddress" TEXT,
ADD COLUMN "resolvedAt" TIMESTAMP(3),
ADD COLUMN "resolution" TEXT,
ADD COLUMN "severity" "LogSeverity" NOT NULL DEFAULT 'INFO';

ALTER TABLE "RFIDTags" ADD COLUMN     "tagType" "TagType" NOT NULL DEFAULT 'STUDENT_CARD';
-- ADD COLUMN     "status" "RFIDStatus" NOT NULL DEFAULT 'ACTIVE';

ALTER TABLE "ReportLog" ADD COLUMN     "reportName" TEXT NOT NULL DEFAULT 'Untitled Report',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "Room" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "Section" ADD COLUMN     "academicYear" TEXT NOT NULL DEFAULT '2024-2025',
ADD COLUMN     "semester" "SemesterType" NOT NULL DEFAULT 'FIRST_SEMESTER',
ADD COLUMN     "semesterId" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "roomAssignment" TEXT;

ALTER TABLE "Semester" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "status" "SemesterStatus" NOT NULL DEFAULT 'UPCOMING';

ALTER TABLE "Student" ADD COLUMN     "status" "Status" NOT NULL DEFAULT 'ACTIVE';

ALTER TABLE "StudentSection" ADD COLUMN     "status" "EnrollmentStatus" NOT NULL DEFAULT 'ACTIVE';

ALTER TABLE "SubjectSchedule" ADD COLUMN     "academicYear" TEXT NOT NULL DEFAULT '2024-2025',
ADD COLUMN     "semesterId" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "Subjects" ADD COLUMN     "academicYear" TEXT NOT NULL DEFAULT '2024-2025',
ADD COLUMN     "courseId" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "departmentId" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "semester" "SemesterType" NOT NULL DEFAULT 'FIRST_SEMESTER',
ADD COLUMN     "totalHours" INTEGER NOT NULL DEFAULT 54,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "SystemLogs" ADD COLUMN     "module" TEXT NOT NULL DEFAULT 'System';

-- DropTable
DROP TABLE "_InstructorToRFIDLogs";

-- CreateTable
CREATE TABLE "StudentSchedule" (
    "id" SERIAL NOT NULL,
    "studentId" INTEGER NOT NULL,
    "scheduleId" INTEGER NOT NULL,
    "status" "ScheduleStatus" NOT NULL DEFAULT 'ACTIVE',
    "enrolledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "droppedAt" TIMESTAMP(3),
    "notes" TEXT,

    CONSTRAINT "StudentSchedule_pkey" PRIMARY KEY ("id")
);

-- All CREATE INDEX statements (removing duplicates)
CREATE INDEX "Attendance_userId_timestamp_idx" ON "Attendance"("userId", "timestamp");
CREATE INDEX "Attendance_eventId_timestamp_idx" ON "Attendance"("eventId", "timestamp");
CREATE INDEX "Attendance_scheduleId_timestamp_idx" ON "Attendance"("scheduleId", "timestamp");
CREATE INDEX "Attendance_status_verification_idx" ON "Attendance"("status", "verification");
CREATE INDEX "Attendance_attendanceType_timestamp_idx" ON "Attendance"("attendanceType", "timestamp");

CREATE UNIQUE INDEX "CourseOffering_courseCode_key" ON "CourseOffering"("courseCode");
CREATE INDEX "CourseOffering_departmentId_courseStatus_idx" ON "CourseOffering"("departmentId", "courseStatus");
CREATE INDEX "CourseOffering_academicYear_semester_idx" ON "CourseOffering"("academicYear", "semester");

CREATE UNIQUE INDEX "Department_departmentCode_key" ON "Department"("departmentCode");
CREATE INDEX "Department_departmentType_departmentStatus_idx" ON "Department"("departmentType", "departmentStatus");
CREATE INDEX "Department_headOfDepartment_idx" ON "Department"("headOfDepartment");

CREATE INDEX "Event_eventType_idx" ON "Event"("eventType");
CREATE INDEX "Event_status_idx" ON "Event"("status");
CREATE INDEX "Event_createdBy_status_idx" ON "Event"("createdBy", "status");

CREATE INDEX "Guardian_guardianType_status_idx" ON "Guardian"("guardianType", "status");
CREATE INDEX "Guardian_email_idx" ON "Guardian"("email");
CREATE INDEX "Guardian_phoneNumber_idx" ON "Guardian"("phoneNumber");

CREATE INDEX "Instructor_departmentId_status_idx" ON "Instructor"("departmentId", "status");
CREATE INDEX "Instructor_instructorType_idx" ON "Instructor"("instructorType");
CREATE INDEX "Instructor_rfidTag_idx" ON "Instructor"("rfidTag");

CREATE INDEX "RFIDLogs_rfidTag_timestamp_idx" ON "RFIDLogs"("rfidTag", "timestamp");
CREATE INDEX "RFIDLogs_userId_userRole_idx" ON "RFIDLogs"("userId", "userRole");

CREATE INDEX "RFIDReader_status_idx" ON "RFIDReader"("status");
CREATE INDEX "RFIDReader_lastSeen_idx" ON "RFIDReader"("lastSeen");
CREATE INDEX "RFIDReader_deviceId_status_idx" ON "RFIDReader"("deviceId", "status");

CREATE INDEX "RFIDReaderLogs_timestamp_idx" ON "RFIDReaderLogs"("timestamp");
CREATE INDEX "RFIDReaderLogs_severity_idx" ON "RFIDReaderLogs"("severity");
CREATE INDEX "RFIDReaderLogs_readerId_eventType_idx" ON "RFIDReaderLogs"("readerId", "eventType");

--CREATE INDEX "RFIDTags_status_idx" ON "RFIDTags"("status");
CREATE INDEX "RFIDTags_tagType_idx" ON "RFIDTags"("tagType");

CREATE INDEX "ReportLog_generatedBy_reportType_idx" ON "ReportLog"("generatedBy", "reportType");
CREATE INDEX "ReportLog_createdAt_idx" ON "ReportLog"("createdAt");

CREATE UNIQUE INDEX "Room_readerId_key" ON "Room"("readerId");
CREATE INDEX "Room_roomNo_idx" ON "Room"("roomNo");
CREATE INDEX "Room_roomBuildingLoc_roomFloorLoc_idx" ON "Room"("roomBuildingLoc", "roomFloorLoc");
CREATE INDEX "Room_readerId_idx" ON "Room"("readerId");

CREATE INDEX "Section_sectionName_idx" ON "Section"("sectionName");
CREATE INDEX "Section_courseId_sectionStatus_idx" ON "Section"("courseId", "sectionStatus");
CREATE INDEX "Section_yearLevel_academicYear_idx" ON "Section"("yearLevel", "academicYear");
CREATE INDEX "Section_roomAssignment_idx" ON "Section"("roomAssignment");

CREATE INDEX "Semester_year_semesterType_idx" ON "Semester"("year", "semesterType");
CREATE INDEX "Semester_startDate_endDate_idx" ON "Semester"("startDate", "endDate");
CREATE INDEX "Semester_status_idx" ON "Semester"("status");

CREATE INDEX "Student_studentIdNum_idx" ON "Student"("studentIdNum");
CREATE INDEX "Student_rfidTag_idx" ON "Student"("rfidTag");
CREATE INDEX "Student_courseId_yearLevel_idx" ON "Student"("courseId", "yearLevel");
CREATE INDEX "Student_departmentId_status_idx" ON "Student"("departmentId", "status");
CREATE INDEX "Student_studentType_status_idx" ON "Student"("studentType", "status");

CREATE INDEX "StudentSection_studentId_enrollmentStatus_idx" ON "StudentSection"("studentId", "enrollmentStatus");
CREATE INDEX "StudentSection_sectionId_enrollmentStatus_idx" ON "StudentSection"("sectionId", "enrollmentStatus");
CREATE INDEX "StudentSection_enrollmentDate_idx" ON "StudentSection"("enrollmentDate");

CREATE INDEX "StudentSchedule_studentId_status_idx" ON "StudentSchedule"("studentId", "status");
CREATE INDEX "StudentSchedule_scheduleId_status_idx" ON "StudentSchedule"("scheduleId", "status");
CREATE UNIQUE INDEX "StudentSchedule_studentId_scheduleId_key" ON "StudentSchedule"("studentId", "scheduleId");

CREATE INDEX "SubjectSchedule_subjectId_day_startTime_idx" ON "SubjectSchedule"("subjectId", "day", "startTime");
CREATE INDEX "SubjectSchedule_instructorId_day_startTime_idx" ON "SubjectSchedule"("instructorId", "day", "startTime");
CREATE INDEX "SubjectSchedule_roomId_day_startTime_idx" ON "SubjectSchedule"("roomId", "day", "startTime");
CREATE INDEX "SubjectSchedule_semesterId_academicYear_idx" ON "SubjectSchedule"("semesterId", "academicYear");
CREATE INDEX "SubjectSchedule_sectionId_status_idx" ON "SubjectSchedule"("sectionId", "status");

CREATE UNIQUE INDEX "Subjects_subjectCode_key" ON "Subjects"("subjectCode");
CREATE INDEX "Subjects_academicYear_semester_idx" ON "Subjects"("academicYear", "semester");
CREATE INDEX "Subjects_courseId_status_idx" ON "Subjects"("courseId", "status");
CREATE INDEX "Subjects_departmentId_status_idx" ON "Subjects"("departmentId", "status");

CREATE INDEX "SystemLogs_userId_actionType_idx" ON "SystemLogs"("userId", "actionType");
CREATE INDEX "SystemLogs_module_entityId_idx" ON "SystemLogs"("module", "entityId");

CREATE INDEX "User_email_idx" ON "User"("email");
CREATE INDEX "User_lastLogin_idx" ON "User"("lastLogin");

-- Update ReportType
ALTER TABLE "ReportLog" ALTER COLUMN "reportType" TYPE "ReportType_new" USING ("reportType"::text::"ReportType_new");
DROP TYPE "ReportType";
ALTER TYPE "ReportType_new" RENAME TO "ReportType";
