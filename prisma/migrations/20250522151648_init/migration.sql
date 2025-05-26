/*
  Warnings:

  - You are about to drop the column `courseDescription` on the `CourseOffering` table. All the data in the column will be lost.
  - You are about to drop the column `rfidNo` on the `Student` table. All the data in the column will be lost.
  - You are about to drop the column `sectionId` on the `Student` table. All the data in the column will be lost.
  - The primary key for the `_AttendanceToInstructor` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `_AttendanceToStudent` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `_AttendanceToSubjectSchedule` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `_InstructorToSubjects` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the `_RFIDLogsToStudent` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[rfidTag]` on the table `Instructor` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[rfidtagNumber]` on the table `Instructor` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[roomId]` on the table `RFIDReader` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[tagNumber]` on the table `RFIDTags` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[studentId,instructorId]` on the table `RFIDTags` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[roomNo]` on the table `Room` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[rfidTag]` on the table `Student` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[A,B]` on the table `_AttendanceToInstructor` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[A,B]` on the table `_AttendanceToStudent` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[A,B]` on the table `_AttendanceToSubjectSchedule` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[A,B]` on the table `_InstructorToSubjects` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `departmentId` to the `Instructor` table without a default value. This is not possible if the table is not empty.
  - Added the required column `rfidTag` to the `Instructor` table without a default value. This is not possible if the table is not empty.
  - Added the required column `rfidtagNumber` to the `Instructor` table without a default value. This is not possible if the table is not empty.
  - Made the column `email` on table `Instructor` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `readerId` to the `Room` table without a default value. This is not possible if the table is not empty.
  - Added the required column `rfidTag` to the `Student` table without a default value. This is not possible if the table is not empty.
  - Made the column `email` on table `Student` required. This step will fail if there are existing NULL values in that column.
  - Made the column `phoneNumber` on table `Student` required. This step will fail if there are existing NULL values in that column.
  - Changed the type of `yearLevel` on the `Student` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "yearLevel" AS ENUM ('FIRST_YEAR', 'SECOND_YEAR', 'THIRD_YEAR', 'FOURTH_YEAR');

-- DropForeignKey
ALTER TABLE "Student" DROP CONSTRAINT "Student_sectionId_fkey";

-- DropForeignKey
ALTER TABLE "_RFIDLogsToStudent" DROP CONSTRAINT "_RFIDLogsToStudent_A_fkey";

-- DropForeignKey
ALTER TABLE "_RFIDLogsToStudent" DROP CONSTRAINT "_RFIDLogsToStudent_B_fkey";

-- DropIndex
DROP INDEX "Student_rfidNo_key";

-- AlterTable
ALTER TABLE "CourseOffering" DROP COLUMN "courseDescription";

-- AlterTable
ALTER TABLE "Instructor" ADD COLUMN     "departmentId" INTEGER NOT NULL,
ADD COLUMN     "rfidTag" TEXT NOT NULL,
ADD COLUMN     "rfidtagNumber" TEXT NOT NULL,
ALTER COLUMN "email" SET NOT NULL;

-- AlterTable
ALTER TABLE "Room" ADD COLUMN     "readerId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Student" DROP COLUMN "rfidNo",
DROP COLUMN "sectionId",
ADD COLUMN     "rfidTag" TEXT NOT NULL,
ALTER COLUMN "email" SET NOT NULL,
ALTER COLUMN "phoneNumber" SET NOT NULL,
DROP COLUMN "yearLevel",
ADD COLUMN     "yearLevel" "yearLevel" NOT NULL;

-- AlterTable
ALTER TABLE "_AttendanceToInstructor" DROP CONSTRAINT "_AttendanceToInstructor_AB_pkey";

-- AlterTable
ALTER TABLE "_AttendanceToStudent" DROP CONSTRAINT "_AttendanceToStudent_AB_pkey";

-- AlterTable
ALTER TABLE "_AttendanceToSubjectSchedule" DROP CONSTRAINT "_AttendanceToSubjectSchedule_AB_pkey";

-- AlterTable
ALTER TABLE "_InstructorToSubjects" DROP CONSTRAINT "_InstructorToSubjects_AB_pkey";

-- DropTable
DROP TABLE "_RFIDLogsToStudent";

-- CreateTable
CREATE TABLE "StudentSection" (
    "studentSectionId" SERIAL NOT NULL,
    "studentId" INTEGER NOT NULL,
    "sectionId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentSection_pkey" PRIMARY KEY ("studentId","sectionId")
);

-- CreateTable
CREATE TABLE "_InstructorToRFIDLogs" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_InstructorToRFIDLogs_AB_unique" ON "_InstructorToRFIDLogs"("A", "B");

-- CreateIndex
CREATE INDEX "_InstructorToRFIDLogs_B_index" ON "_InstructorToRFIDLogs"("B");

-- CreateIndex
CREATE UNIQUE INDEX "Instructor_rfidTag_key" ON "Instructor"("rfidTag");

-- CreateIndex
CREATE UNIQUE INDEX "Instructor_rfidtagNumber_key" ON "Instructor"("rfidtagNumber");

-- CreateIndex
CREATE UNIQUE INDEX "RFIDReader_roomId_key" ON "RFIDReader"("roomId");

-- CreateIndex
CREATE UNIQUE INDEX "RFIDTags_tagNumber_key" ON "RFIDTags"("tagNumber");

-- CreateIndex
CREATE UNIQUE INDEX "RFIDTags_studentId_instructorId_key" ON "RFIDTags"("studentId", "instructorId");

-- CreateIndex
CREATE UNIQUE INDEX "Room_roomNo_key" ON "Room"("roomNo");

-- CreateIndex
CREATE UNIQUE INDEX "Student_rfidTag_key" ON "Student"("rfidTag");

-- CreateIndex
CREATE UNIQUE INDEX "_AttendanceToInstructor_AB_unique" ON "_AttendanceToInstructor"("A", "B");

-- CreateIndex
CREATE UNIQUE INDEX "_AttendanceToStudent_AB_unique" ON "_AttendanceToStudent"("A", "B");

-- CreateIndex
CREATE UNIQUE INDEX "_AttendanceToSubjectSchedule_AB_unique" ON "_AttendanceToSubjectSchedule"("A", "B");

-- CreateIndex
CREATE UNIQUE INDEX "_InstructorToSubjects_AB_unique" ON "_InstructorToSubjects"("A", "B");

-- AddForeignKey
ALTER TABLE "Instructor" ADD CONSTRAINT "Instructor_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("departmentId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentSection" ADD CONSTRAINT "StudentSection_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("studentId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentSection" ADD CONSTRAINT "StudentSection_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("sectionId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_InstructorToRFIDLogs" ADD CONSTRAINT "_InstructorToRFIDLogs_A_fkey" FOREIGN KEY ("A") REFERENCES "Instructor"("instructorId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_InstructorToRFIDLogs" ADD CONSTRAINT "_InstructorToRFIDLogs_B_fkey" FOREIGN KEY ("B") REFERENCES "RFIDLogs"("logsId") ON DELETE CASCADE ON UPDATE CASCADE;
