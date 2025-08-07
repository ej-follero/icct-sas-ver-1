-- CreateEnum
CREATE TYPE "BackupType" AS ENUM ('FULL', 'INCREMENTAL', 'DIFFERENTIAL');

-- CreateEnum
CREATE TYPE "BackupStatus" AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "BackupLocation" AS ENUM ('LOCAL', 'CLOUD', 'HYBRID');

-- CreateEnum
CREATE TYPE "RestoreStatus" AS ENUM ('AVAILABLE', 'RESTORING', 'FAILED', 'COMPLETED');

-- DropForeignKey
ALTER TABLE "PasswordResetToken" DROP CONSTRAINT "PasswordResetToken_userId_fkey";

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
