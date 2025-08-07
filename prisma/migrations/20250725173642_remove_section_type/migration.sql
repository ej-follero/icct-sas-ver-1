/*
  Warnings:

  - The `sectionType` column on the `Section` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Section" DROP COLUMN "sectionType",
ADD COLUMN     "sectionType" TEXT;

-- DropEnum
DROP TYPE "SectionType";
