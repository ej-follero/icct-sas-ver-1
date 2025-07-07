/*
  Warnings:

  - You are about to drop the column `subjectScheduleId` on the `Attendance` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[studentId,subjectSchedId,timestamp]` on the table `Attendance` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "Attendance" DROP CONSTRAINT "Attendance_subjectScheduleId_fkey";

-- DropIndex
DROP INDEX "Attendance_studentId_subjectScheduleId_timestamp_idx";

-- DropIndex
DROP INDEX "Attendance_studentId_subjectScheduleId_timestamp_key";

-- DropIndex
DROP INDEX "Attendance_subjectScheduleId_timestamp_idx";

-- AlterTable
ALTER TABLE "Attendance" DROP COLUMN "subjectScheduleId",
ADD COLUMN     "subjectSchedId" INTEGER;

-- CreateIndex
CREATE INDEX "Attendance_subjectSchedId_timestamp_idx" ON "Attendance"("subjectSchedId", "timestamp");

-- CreateIndex
CREATE INDEX "Attendance_studentId_subjectSchedId_timestamp_idx" ON "Attendance"("studentId", "subjectSchedId", "timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "Attendance_studentId_subjectSchedId_timestamp_key" ON "Attendance"("studentId", "subjectSchedId", "timestamp");

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_subjectSchedId_fkey" FOREIGN KEY ("subjectSchedId") REFERENCES "SubjectSchedule"("subjectSchedId") ON DELETE SET NULL ON UPDATE CASCADE;
