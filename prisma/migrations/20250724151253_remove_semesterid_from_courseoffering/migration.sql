/*
  Warnings:

  - You are about to drop the column `semesterId` on the `CourseOffering` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "CourseOffering" DROP CONSTRAINT "CourseOffering_semesterId_fkey";

-- AlterTable
ALTER TABLE "CourseOffering" DROP COLUMN "semesterId";
