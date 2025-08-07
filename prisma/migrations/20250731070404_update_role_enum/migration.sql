/*
  Warnings:

  - The values [TEACHER] on the enum `Role` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "Role_new" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'DEPARTMENT_HEAD', 'INSTRUCTOR', 'STUDENT', 'GUARDIAN', 'SYSTEM_AUDITOR');
ALTER TABLE "User" ALTER COLUMN "role" TYPE "Role_new" USING ("role"::text::"Role_new");
ALTER TABLE "Attendance" ALTER COLUMN "userRole" TYPE "Role_new" USING ("userRole"::text::"Role_new");
ALTER TABLE "RFIDLogs" ALTER COLUMN "userRole" TYPE "Role_new" USING ("userRole"::text::"Role_new");
ALTER TABLE "Announcement" ALTER COLUMN "userType" TYPE "Role_new" USING ("userType"::text::"Role_new");
ALTER TYPE "Role" RENAME TO "Role_old";
ALTER TYPE "Role_new" RENAME TO "Role";
DROP TYPE "Role_old";
COMMIT;
