/*
  Warnings:

  - A unique constraint covering the columns `[employeeId]` on the table `Instructor` will be added. If there are existing duplicate values, this will fail.
*/

-- Add the column as nullable first
ALTER TABLE "Instructor" ADD COLUMN "employeeId" TEXT;

-- Update existing records with employeeId based on instructorId
UPDATE "Instructor" SET "employeeId" = 'EMP-' || "instructorId"::TEXT WHERE "employeeId" IS NULL;

-- Make the column NOT NULL
ALTER TABLE "Instructor" ALTER COLUMN "employeeId" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Instructor_employeeId_key" ON "Instructor"("employeeId");
