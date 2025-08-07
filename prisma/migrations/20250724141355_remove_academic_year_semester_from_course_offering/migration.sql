/*
  Warnings:

  - You are about to drop the column `academicYear` on the `CourseOffering` table. All the data in the column will be lost.
  - You are about to drop the column `semester` on the `CourseOffering` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "CourseOffering_academicYear_semester_idx";

-- AlterTable
ALTER TABLE "CourseOffering" DROP COLUMN "academicYear",
DROP COLUMN "semester";
