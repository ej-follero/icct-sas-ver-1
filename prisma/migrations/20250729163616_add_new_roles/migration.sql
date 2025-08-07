/*
  Warnings:

  - You are about to drop the column `sectionType` on the `Section` table. All the data in the column will be lost.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "Role" ADD VALUE 'SUPER_ADMIN';
ALTER TYPE "Role" ADD VALUE 'DEPARTMENT_HEAD';
ALTER TYPE "Role" ADD VALUE 'SYSTEM_AUDITOR';

-- AlterTable
ALTER TABLE "Section" DROP COLUMN "sectionType";
