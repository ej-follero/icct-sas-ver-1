/*
  Warnings:

  - The values [TEACHER,GUARDIAN] on the enum `Role` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `scheduleId` on the `Attendance` table. All the data in the column will be lost.
  - You are about to drop the column `academicYear` on the `CourseOffering` table. All the data in the column will be lost.
  - You are about to drop the column `semester` on the `CourseOffering` table. All the data in the column will be lost.
  - You are about to drop the column `semesterId` on the `CourseOffering` table. All the data in the column will be lost.
  - You are about to drop the column `totalSections` on the `CourseOffering` table. All the data in the column will be lost.
  - You are about to drop the column `totalStudents` on the `CourseOffering` table. All the data in the column will be lost.
  - You are about to drop the column `totalInstructors` on the `Department` table. All the data in the column will be lost.
  - You are about to drop the column `totalStudents` on the `Department` table. All the data in the column will be lost.
  - You are about to drop the column `totalStudents` on the `Instructor` table. All the data in the column will be lost.
  - You are about to drop the column `totalSubjects` on the `Instructor` table. All the data in the column will be lost.
  - You are about to drop the column `sectionType` on the `Section` table. All the data in the column will be lost.
  - You are about to drop the column `totalAttendance` on the `Student` table. All the data in the column will be lost.
  - You are about to drop the column `totalSubjects` on the `Student` table. All the data in the column will be lost.
  - You are about to drop the column `currentEnrollment` on the `SubjectSchedule` table. All the data in the column will be lost.
  - You are about to drop the column `currentEnrollment` on the `Subjects` table. All the data in the column will be lost.
  - You are about to drop the `_AttendanceToInstructor` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_AttendanceToStudent` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_AttendanceToSubjectSchedule` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[rfidLogId]` on the table `Attendance` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[studentId,subjectSchedId,timestamp]` on the table `Attendance` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[employeeId]` on the table `Instructor` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `employeeId` to the `Instructor` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `roomBuildingLoc` on the `Room` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `roomFloorLoc` on the `Room` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "EmailStatus" AS ENUM ('SENT', 'DELIVERED', 'READ', 'FAILED', 'DRAFT', 'PENDING');

-- CreateEnum
CREATE TYPE "EmailFolder" AS ENUM ('INBOX', 'SENT', 'DRAFT', 'SPAM', 'TRASH');

-- CreateEnum
CREATE TYPE "EmailRecipientType" AS ENUM ('TO', 'CC', 'BCC');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('ABSENCE', 'TARDINESS', 'IMPROVEMENT', 'CONCERN');

-- CreateEnum
CREATE TYPE "RecipientType" AS ENUM ('PARENT', 'STUDENT', 'BOTH');

-- CreateEnum
CREATE TYPE "NotificationMethod" AS ENUM ('EMAIL');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('PENDING', 'SENT', 'FAILED');

-- CreateEnum
CREATE TYPE "BackupType" AS ENUM ('FULL', 'INCREMENTAL', 'DIFFERENTIAL');

-- CreateEnum
CREATE TYPE "BackupStatus" AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "BackupLocation" AS ENUM ('LOCAL', 'CLOUD', 'HYBRID');

-- CreateEnum
CREATE TYPE "RestoreStatus" AS ENUM ('AVAILABLE', 'RESTORING', 'FAILED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "ScheduleFrequency" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY', 'CUSTOM');

-- CreateEnum
CREATE TYPE "ScheduleLogStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "RoomBuilding" AS ENUM ('BuildingA', 'BuildingB', 'BuildingC', 'BuildingD', 'BuildingE');

-- CreateEnum
CREATE TYPE "RoomFloor" AS ENUM ('F1', 'F2', 'F3', 'F4', 'F5', 'F6');

-- AlterEnum
BEGIN;
CREATE TYPE "Role_new" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'DEPARTMENT_HEAD', 'INSTRUCTOR', 'STUDENT');
ALTER TABLE "User" ALTER COLUMN "role" TYPE "Role_new" USING ("role"::text::"Role_new");
ALTER TABLE "Attendance" ALTER COLUMN "userRole" TYPE "Role_new" USING ("userRole"::text::"Role_new");
ALTER TABLE "RFIDLogs" ALTER COLUMN "userRole" TYPE "Role_new" USING ("userRole"::text::"Role_new");
ALTER TABLE "Announcement" ALTER COLUMN "userType" TYPE "Role_new" USING ("userType"::text::"Role_new");
ALTER TYPE "Role" RENAME TO "Role_old";
ALTER TYPE "Role_new" RENAME TO "Role";
DROP TYPE "Role_old";
COMMIT;

-- AlterEnum
ALTER TYPE "Status" ADD VALUE 'ARCHIVED';

-- DropForeignKey
ALTER TABLE "CourseOffering" DROP CONSTRAINT "CourseOffering_semesterId_fkey";

-- DropForeignKey
ALTER TABLE "Guardian" DROP CONSTRAINT "Guardian_guardianId_fkey";

-- DropForeignKey
ALTER TABLE "_AttendanceToInstructor" DROP CONSTRAINT "_AttendanceToInstructor_A_fkey";

-- DropForeignKey
ALTER TABLE "_AttendanceToInstructor" DROP CONSTRAINT "_AttendanceToInstructor_B_fkey";

-- DropForeignKey
ALTER TABLE "_AttendanceToStudent" DROP CONSTRAINT "_AttendanceToStudent_A_fkey";

-- DropForeignKey
ALTER TABLE "_AttendanceToStudent" DROP CONSTRAINT "_AttendanceToStudent_B_fkey";

-- DropForeignKey
ALTER TABLE "_AttendanceToSubjectSchedule" DROP CONSTRAINT "_AttendanceToSubjectSchedule_A_fkey";

-- DropForeignKey
ALTER TABLE "_AttendanceToSubjectSchedule" DROP CONSTRAINT "_AttendanceToSubjectSchedule_B_fkey";

-- DropIndex
DROP INDEX "Attendance_scheduleId_timestamp_idx";

-- DropIndex
DROP INDEX "CourseOffering_academicYear_semester_idx";

-- DropIndex
DROP INDEX "Section_roomAssignment_idx";

-- AlterTable
ALTER TABLE "Attendance" DROP COLUMN "scheduleId",
ADD COLUMN     "academicYear" TEXT,
ADD COLUMN     "instructorId" INTEGER,
ADD COLUMN     "originalStatus" "AttendanceStatus",
ADD COLUMN     "overrideBy" INTEGER,
ADD COLUMN     "overrideReason" TEXT,
ADD COLUMN     "rfidLogId" INTEGER,
ADD COLUMN     "semesterId" INTEGER,
ADD COLUMN     "studentId" INTEGER,
ADD COLUMN     "subjectSchedId" INTEGER;

-- AlterTable
ALTER TABLE "CourseOffering" DROP COLUMN "academicYear",
DROP COLUMN "semester",
DROP COLUMN "semesterId",
DROP COLUMN "totalSections",
DROP COLUMN "totalStudents";

-- AlterTable
ALTER TABLE "Department" DROP COLUMN "totalInstructors",
DROP COLUMN "totalStudents",
ADD COLUMN     "departmentLogo" TEXT;

-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Instructor" DROP COLUMN "totalStudents",
DROP COLUMN "totalSubjects",
ADD COLUMN     "employeeId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "RFIDLogs" ADD COLUMN     "attendanceId" INTEGER;

-- AlterTable
ALTER TABLE "Room" DROP COLUMN "roomBuildingLoc",
ADD COLUMN     "roomBuildingLoc" "RoomBuilding" NOT NULL,
DROP COLUMN "roomFloorLoc",
ADD COLUMN     "roomFloorLoc" "RoomFloor" NOT NULL;

-- AlterTable
ALTER TABLE "Section" DROP COLUMN "sectionType";

-- AlterTable
ALTER TABLE "Student" DROP COLUMN "totalAttendance",
DROP COLUMN "totalSubjects",
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "deletionReason" TEXT;

-- AlterTable
ALTER TABLE "SubjectSchedule" DROP COLUMN "currentEnrollment";

-- AlterTable
ALTER TABLE "Subjects" DROP COLUMN "currentEnrollment";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "customRoleId" INTEGER,
ADD COLUMN     "sessionVersion" INTEGER NOT NULL DEFAULT 1;

-- DropTable
DROP TABLE "_AttendanceToInstructor";

-- DropTable
DROP TABLE "_AttendanceToStudent";

-- DropTable
DROP TABLE "_AttendanceToSubjectSchedule";

-- DropEnum
DROP TYPE "SectionType";

-- CreateTable
CREATE TABLE "Email" (
    "id" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "sender" TEXT NOT NULL,
    "recipient" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "EmailStatus" NOT NULL DEFAULT 'PENDING',
    "priority" "Priority" NOT NULL DEFAULT 'NORMAL',
    "type" "EmailFolder" NOT NULL DEFAULT 'INBOX',
    "content" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "isStarred" BOOLEAN NOT NULL DEFAULT false,
    "isImportant" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Email_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailRecipient" (
    "id" SERIAL NOT NULL,
    "emailId" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "rtype" "EmailRecipientType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailRecipient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailAttachment" (
    "id" SERIAL NOT NULL,
    "emailId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoleManagement" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "permissions" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "totalUsers" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RoleManagement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttendanceNotification" (
    "notificationId" SERIAL NOT NULL,
    "studentId" INTEGER NOT NULL,
    "attendanceId" INTEGER,
    "type" "NotificationType" NOT NULL,
    "message" TEXT NOT NULL,
    "recipient" "RecipientType" NOT NULL,
    "method" "NotificationMethod" NOT NULL,
    "status" "NotificationStatus" NOT NULL,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AttendanceNotification_pkey" PRIMARY KEY ("notificationId")
);

-- CreateTable
CREATE TABLE "PasswordResetToken" (
    "id" SERIAL NOT NULL,
    "token" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemBackup" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "BackupType" NOT NULL,
    "size" TEXT NOT NULL,
    "status" "BackupStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "location" "BackupLocation" NOT NULL,
    "isEncrypted" BOOLEAN NOT NULL DEFAULT true,
    "retentionDays" INTEGER NOT NULL DEFAULT 30,
    "filePath" TEXT,
    "checksum" TEXT,
    "createdBy" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "errorMessage" TEXT,

    CONSTRAINT "SystemBackup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RestorePoint" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "backupId" INTEGER NOT NULL,
    "status" "RestoreStatus" NOT NULL DEFAULT 'AVAILABLE',
    "createdBy" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "restoredAt" TIMESTAMP(3),
    "errorMessage" TEXT,

    CONSTRAINT "RestorePoint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BackupLog" (
    "id" SERIAL NOT NULL,
    "backupId" INTEGER,
    "action" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "message" TEXT,
    "details" JSONB,
    "createdBy" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BackupLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BackupSettings" (
    "id" SERIAL NOT NULL,
    "autoBackup" BOOLEAN NOT NULL DEFAULT true,
    "backupFrequency" TEXT NOT NULL DEFAULT 'WEEKLY',
    "retentionDays" INTEGER NOT NULL DEFAULT 30,
    "encryptionEnabled" BOOLEAN NOT NULL DEFAULT true,
    "cloudStorage" BOOLEAN NOT NULL DEFAULT false,
    "compressionLevel" TEXT NOT NULL DEFAULT 'MEDIUM',
    "maxBackupSize" INTEGER NOT NULL DEFAULT 10,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BackupSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BackupSchedule" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "frequency" "ScheduleFrequency" NOT NULL,
    "interval" INTEGER NOT NULL DEFAULT 1,
    "timeOfDay" TEXT NOT NULL DEFAULT '02:00',
    "daysOfWeek" "DayOfWeek"[] DEFAULT ARRAY[]::"DayOfWeek"[],
    "dayOfMonth" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastRun" TIMESTAMP(3),
    "nextRun" TIMESTAMP(3),
    "totalRuns" INTEGER NOT NULL DEFAULT 0,
    "successfulRuns" INTEGER NOT NULL DEFAULT 0,
    "failedRuns" INTEGER NOT NULL DEFAULT 0,
    "backupType" "BackupType" NOT NULL DEFAULT 'FULL',
    "location" "BackupLocation" NOT NULL DEFAULT 'LOCAL',
    "isEncrypted" BOOLEAN NOT NULL DEFAULT true,
    "retentionDays" INTEGER NOT NULL DEFAULT 30,
    "createdBy" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BackupSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BackupScheduleLog" (
    "id" SERIAL NOT NULL,
    "scheduleId" INTEGER NOT NULL,
    "backupId" INTEGER,
    "status" "ScheduleLogStatus" NOT NULL DEFAULT 'PENDING',
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "createdBy" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BackupScheduleLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SecuritySettings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "minPasswordLength" INTEGER NOT NULL,
    "requireUppercase" BOOLEAN NOT NULL,
    "requireLowercase" BOOLEAN NOT NULL,
    "requireNumbers" BOOLEAN NOT NULL,
    "requireSpecialChars" BOOLEAN NOT NULL,
    "passwordExpiryDays" INTEGER NOT NULL,
    "sessionTimeoutMinutes" INTEGER NOT NULL,
    "maxConcurrentSessions" INTEGER NOT NULL,
    "forceLogoutOnPasswordChange" BOOLEAN NOT NULL,
    "twoFactorEnabled" BOOLEAN NOT NULL,
    "twoFactorMethod" TEXT NOT NULL,
    "backupCodesEnabled" BOOLEAN NOT NULL,
    "maxLoginAttempts" INTEGER NOT NULL,
    "lockoutDurationMinutes" INTEGER NOT NULL,
    "ipWhitelistEnabled" BOOLEAN NOT NULL,
    "ipWhitelist" TEXT[],
    "auditLoggingEnabled" BOOLEAN NOT NULL,
    "loginNotificationsEnabled" BOOLEAN NOT NULL,
    "suspiciousActivityAlerts" BOOLEAN NOT NULL,
    "sslEnforcement" BOOLEAN NOT NULL,
    "apiRateLimiting" BOOLEAN NOT NULL,
    "dataEncryptionAtRest" BOOLEAN NOT NULL,

    CONSTRAINT "SecuritySettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SecurityLog" (
    "id" SERIAL NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "eventType" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "userId" INTEGER,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "details" JSONB,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedBy" INTEGER,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "SecurityLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SecurityAlert" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER,
    "ipAddress" TEXT,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedBy" INTEGER,
    "resolvedAt" TIMESTAMP(3),
    "actionRequired" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "SecurityAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "backups" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "size" TEXT,
    "location" TEXT NOT NULL DEFAULT 'LOCAL',
    "filePath" TEXT,
    "createdBy" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "restorePointsCount" INTEGER NOT NULL DEFAULT 0,
    "logsCount" INTEGER NOT NULL DEFAULT 0,
    "retentionDays" INTEGER NOT NULL DEFAULT 30,

    CONSTRAINT "backups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT,
    "type" TEXT NOT NULL DEFAULT 'SYSTEM',
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "access_rules" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "rules" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "access_rules_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Email_status_type_idx" ON "Email"("status", "type");

-- CreateIndex
CREATE INDEX "Email_timestamp_idx" ON "Email"("timestamp");

-- CreateIndex
CREATE INDEX "Email_priority_idx" ON "Email"("priority");

-- CreateIndex
CREATE INDEX "EmailRecipient_emailId_rtype_idx" ON "EmailRecipient"("emailId", "rtype");

-- CreateIndex
CREATE INDEX "EmailAttachment_emailId_idx" ON "EmailAttachment"("emailId");

-- CreateIndex
CREATE UNIQUE INDEX "RoleManagement_name_key" ON "RoleManagement"("name");

-- CreateIndex
CREATE INDEX "RoleManagement_status_idx" ON "RoleManagement"("status");

-- CreateIndex
CREATE INDEX "RoleManagement_name_idx" ON "RoleManagement"("name");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_token_key" ON "PasswordResetToken"("token");

-- CreateIndex
CREATE INDEX "SystemBackup_status_idx" ON "SystemBackup"("status");

-- CreateIndex
CREATE INDEX "SystemBackup_type_idx" ON "SystemBackup"("type");

-- CreateIndex
CREATE INDEX "SystemBackup_createdAt_idx" ON "SystemBackup"("createdAt");

-- CreateIndex
CREATE INDEX "SystemBackup_createdBy_idx" ON "SystemBackup"("createdBy");

-- CreateIndex
CREATE INDEX "RestorePoint_backupId_idx" ON "RestorePoint"("backupId");

-- CreateIndex
CREATE INDEX "RestorePoint_status_idx" ON "RestorePoint"("status");

-- CreateIndex
CREATE INDEX "RestorePoint_createdAt_idx" ON "RestorePoint"("createdAt");

-- CreateIndex
CREATE INDEX "BackupLog_backupId_idx" ON "BackupLog"("backupId");

-- CreateIndex
CREATE INDEX "BackupLog_action_idx" ON "BackupLog"("action");

-- CreateIndex
CREATE INDEX "BackupLog_createdAt_idx" ON "BackupLog"("createdAt");

-- CreateIndex
CREATE INDEX "BackupSettings_autoBackup_idx" ON "BackupSettings"("autoBackup");

-- CreateIndex
CREATE INDEX "BackupSettings_backupFrequency_idx" ON "BackupSettings"("backupFrequency");

-- CreateIndex
CREATE INDEX "BackupSchedule_isActive_idx" ON "BackupSchedule"("isActive");

-- CreateIndex
CREATE INDEX "BackupSchedule_nextRun_idx" ON "BackupSchedule"("nextRun");

-- CreateIndex
CREATE INDEX "BackupSchedule_createdBy_idx" ON "BackupSchedule"("createdBy");

-- CreateIndex
CREATE INDEX "BackupScheduleLog_scheduleId_idx" ON "BackupScheduleLog"("scheduleId");

-- CreateIndex
CREATE INDEX "BackupScheduleLog_scheduledAt_idx" ON "BackupScheduleLog"("scheduledAt");

-- CreateIndex
CREATE INDEX "BackupScheduleLog_backupId_idx" ON "BackupScheduleLog"("backupId");

-- CreateIndex
CREATE INDEX "SecurityAlert_type_idx" ON "SecurityAlert"("type");

-- CreateIndex
CREATE INDEX "SecurityAlert_resolved_idx" ON "SecurityAlert"("resolved");

-- CreateIndex
CREATE INDEX "SecurityAlert_timestamp_idx" ON "SecurityAlert"("timestamp");

-- CreateIndex
CREATE INDEX "backups_createdAt_idx" ON "backups"("createdAt");

-- CreateIndex
CREATE INDEX "notifications_userId_idx" ON "notifications"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_name_key" ON "permissions"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Attendance_rfidLogId_key" ON "Attendance"("rfidLogId");

-- CreateIndex
CREATE INDEX "Attendance_subjectSchedId_timestamp_idx" ON "Attendance"("subjectSchedId", "timestamp");

-- CreateIndex
CREATE INDEX "Attendance_studentId_idx" ON "Attendance"("studentId");

-- CreateIndex
CREATE INDEX "Attendance_instructorId_idx" ON "Attendance"("instructorId");

-- CreateIndex
CREATE INDEX "Attendance_semesterId_idx" ON "Attendance"("semesterId");

-- CreateIndex
CREATE INDEX "Attendance_rfidLogId_idx" ON "Attendance"("rfidLogId");

-- CreateIndex
CREATE INDEX "Attendance_studentId_subjectSchedId_timestamp_idx" ON "Attendance"("studentId", "subjectSchedId", "timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "Attendance_studentId_subjectSchedId_timestamp_key" ON "Attendance"("studentId", "subjectSchedId", "timestamp");

-- CreateIndex
CREATE INDEX "Event_deletedAt_idx" ON "Event"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Instructor_employeeId_key" ON "Instructor"("employeeId");

-- CreateIndex
CREATE INDEX "RFIDLogs_attendanceId_idx" ON "RFIDLogs"("attendanceId");

-- CreateIndex
CREATE INDEX "Room_roomBuildingLoc_roomFloorLoc_idx" ON "Room"("roomBuildingLoc", "roomFloorLoc");

-- CreateIndex
CREATE INDEX "User_customRoleId_idx" ON "User"("customRoleId");

-- AddForeignKey
ALTER TABLE "EmailRecipient" ADD CONSTRAINT "EmailRecipient_emailId_fkey" FOREIGN KEY ("emailId") REFERENCES "Email"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailAttachment" ADD CONSTRAINT "EmailAttachment_emailId_fkey" FOREIGN KEY ("emailId") REFERENCES "Email"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_customRoleId_fkey" FOREIGN KEY ("customRoleId") REFERENCES "RoleManagement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "Instructor"("instructorId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_overrideBy_fkey" FOREIGN KEY ("overrideBy") REFERENCES "User"("userId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_rfidLogId_fkey" FOREIGN KEY ("rfidLogId") REFERENCES "RFIDLogs"("logsId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_semesterId_fkey" FOREIGN KEY ("semesterId") REFERENCES "Semester"("semesterId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("studentId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_subjectSchedId_fkey" FOREIGN KEY ("subjectSchedId") REFERENCES "SubjectSchedule"("subjectSchedId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceNotification" ADD CONSTRAINT "AttendanceNotification_attendanceId_fkey" FOREIGN KEY ("attendanceId") REFERENCES "Attendance"("attendanceId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceNotification" ADD CONSTRAINT "AttendanceNotification_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("studentId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SystemBackup" ADD CONSTRAINT "SystemBackup_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RestorePoint" ADD CONSTRAINT "RestorePoint_backupId_fkey" FOREIGN KEY ("backupId") REFERENCES "SystemBackup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RestorePoint" ADD CONSTRAINT "RestorePoint_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BackupLog" ADD CONSTRAINT "BackupLog_backupId_fkey" FOREIGN KEY ("backupId") REFERENCES "SystemBackup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BackupLog" ADD CONSTRAINT "BackupLog_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BackupSchedule" ADD CONSTRAINT "BackupSchedule_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BackupScheduleLog" ADD CONSTRAINT "BackupScheduleLog_backupId_fkey" FOREIGN KEY ("backupId") REFERENCES "SystemBackup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BackupScheduleLog" ADD CONSTRAINT "BackupScheduleLog_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BackupScheduleLog" ADD CONSTRAINT "BackupScheduleLog_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "BackupSchedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecurityLog" ADD CONSTRAINT "SecurityLog_resolvedBy_fkey" FOREIGN KEY ("resolvedBy") REFERENCES "User"("userId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecurityLog" ADD CONSTRAINT "SecurityLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("userId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecurityAlert" ADD CONSTRAINT "SecurityAlert_resolvedBy_fkey" FOREIGN KEY ("resolvedBy") REFERENCES "User"("userId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecurityAlert" ADD CONSTRAINT "SecurityAlert_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("userId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "backups" ADD CONSTRAINT "backups_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;
