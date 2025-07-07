/*
  Warnings:

  - You are about to drop the column `scheduleId` on the `Attendance` table. All the data in the column will be lost.
  - You are about to drop the column `totalSections` on the `CourseOffering` table. All the data in the column will be lost.
  - You are about to drop the column `totalStudents` on the `CourseOffering` table. All the data in the column will be lost.
  - You are about to drop the column `totalInstructors` on the `Department` table. All the data in the column will be lost.
  - You are about to drop the column `totalStudents` on the `Department` table. All the data in the column will be lost.
  - You are about to drop the column `totalStudents` on the `Instructor` table. All the data in the column will be lost.
  - You are about to drop the column `totalSubjects` on the `Instructor` table. All the data in the column will be lost.
  - You are about to drop the column `totalAttendance` on the `Student` table. All the data in the column will be lost.
  - You are about to drop the column `totalSubjects` on the `Student` table. All the data in the column will be lost.
  - You are about to drop the column `currentEnrollment` on the `SubjectSchedule` table. All the data in the column will be lost.
  - You are about to drop the column `currentEnrollment` on the `Subjects` table. All the data in the column will be lost.
  - You are about to drop the `_AttendanceToInstructor` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_AttendanceToStudent` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_AttendanceToSubjectSchedule` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[rfidLogId]` on the table `Attendance` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[studentId,subjectScheduleId,timestamp]` on the table `Attendance` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('ABSENCE', 'TARDINESS', 'IMPROVEMENT', 'CONCERN');

-- CreateEnum
CREATE TYPE "RecipientType" AS ENUM ('PARENT', 'STUDENT', 'BOTH');

-- CreateEnum
CREATE TYPE "NotificationMethod" AS ENUM ('EMAIL', 'SMS', 'BOTH');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('PENDING', 'SENT', 'FAILED');

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
ADD COLUMN     "subjectScheduleId" INTEGER;

-- AlterTable
ALTER TABLE "CourseOffering" DROP COLUMN "totalSections",
DROP COLUMN "totalStudents";

-- AlterTable
ALTER TABLE "Department" DROP COLUMN "totalInstructors",
DROP COLUMN "totalStudents";

-- AlterTable
ALTER TABLE "Instructor" DROP COLUMN "totalStudents",
DROP COLUMN "totalSubjects";

-- AlterTable
ALTER TABLE "RFIDLogs" ADD COLUMN     "attendanceId" INTEGER;

-- AlterTable
ALTER TABLE "Student" DROP COLUMN "totalAttendance",
DROP COLUMN "totalSubjects";

-- AlterTable
ALTER TABLE "SubjectSchedule" DROP COLUMN "currentEnrollment";

-- AlterTable
ALTER TABLE "Subjects" DROP COLUMN "currentEnrollment";

-- DropTable
DROP TABLE "_AttendanceToInstructor";

-- DropTable
DROP TABLE "_AttendanceToStudent";

-- DropTable
DROP TABLE "_AttendanceToSubjectSchedule";

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

-- CreateIndex
CREATE UNIQUE INDEX "Attendance_rfidLogId_key" ON "Attendance"("rfidLogId");

-- CreateIndex
CREATE INDEX "Attendance_subjectScheduleId_timestamp_idx" ON "Attendance"("subjectScheduleId", "timestamp");

-- CreateIndex
CREATE INDEX "Attendance_studentId_idx" ON "Attendance"("studentId");

-- CreateIndex
CREATE INDEX "Attendance_instructorId_idx" ON "Attendance"("instructorId");

-- CreateIndex
CREATE INDEX "Attendance_semesterId_idx" ON "Attendance"("semesterId");

-- CreateIndex
CREATE INDEX "Attendance_rfidLogId_idx" ON "Attendance"("rfidLogId");

-- CreateIndex
CREATE INDEX "Attendance_studentId_subjectScheduleId_timestamp_idx" ON "Attendance"("studentId", "subjectScheduleId", "timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "Attendance_studentId_subjectScheduleId_timestamp_key" ON "Attendance"("studentId", "subjectScheduleId", "timestamp");

-- CreateIndex
CREATE INDEX "RFIDLogs_attendanceId_idx" ON "RFIDLogs"("attendanceId");

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_subjectScheduleId_fkey" FOREIGN KEY ("subjectScheduleId") REFERENCES "SubjectSchedule"("subjectSchedId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("studentId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "Instructor"("instructorId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_semesterId_fkey" FOREIGN KEY ("semesterId") REFERENCES "Semester"("semesterId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_rfidLogId_fkey" FOREIGN KEY ("rfidLogId") REFERENCES "RFIDLogs"("logsId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_overrideBy_fkey" FOREIGN KEY ("overrideBy") REFERENCES "User"("userId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceNotification" ADD CONSTRAINT "AttendanceNotification_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("studentId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceNotification" ADD CONSTRAINT "AttendanceNotification_attendanceId_fkey" FOREIGN KEY ("attendanceId") REFERENCES "Attendance"("attendanceId") ON DELETE SET NULL ON UPDATE CASCADE;
