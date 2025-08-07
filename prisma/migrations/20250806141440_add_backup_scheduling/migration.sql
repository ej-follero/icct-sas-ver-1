-- CreateEnum
CREATE TYPE "ScheduleFrequency" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY', 'CUSTOM');

-- CreateEnum
CREATE TYPE "ScheduleLogStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateTable
CREATE TABLE "BackupSchedule" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "frequency" "ScheduleFrequency" NOT NULL,
    "interval" INTEGER NOT NULL DEFAULT 1,
    "timeOfDay" TEXT NOT NULL DEFAULT '02:00',
    "daysOfWeek" "DayOfWeek"[] DEFAULT ARRAY[]::"DayOfWeek"[],
    "dayOfMonth" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastRun" TIMESTAMP(3),
    "nextRun" TIMESTAMP(3),
    "totalRuns" INTEGER NOT NULL DEFAULT 0,
    "successfulRuns" INTEGER NOT NULL DEFAULT 0,
    "failedRuns" INTEGER NOT NULL DEFAULT 0,
    "backupType" "BackupType" NOT NULL DEFAULT 'FULL',
    "location" "BackupLocation" NOT NULL DEFAULT 'LOCAL',
    "isEncrypted" BOOLEAN NOT NULL DEFAULT true,
    "retentionDays" INTEGER NOT NULL DEFAULT 30,
    "createdBy" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BackupSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BackupScheduleLog" (
    "id" SERIAL NOT NULL,
    "scheduleId" INTEGER NOT NULL,
    "backupId" INTEGER,
    "status" "ScheduleLogStatus" NOT NULL DEFAULT 'PENDING',
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "createdBy" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BackupScheduleLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BackupSchedule_isActive_idx" ON "BackupSchedule"("isActive");

-- CreateIndex
CREATE INDEX "BackupSchedule_nextRun_idx" ON "BackupSchedule"("nextRun");

-- CreateIndex
CREATE INDEX "BackupSchedule_createdBy_idx" ON "BackupSchedule"("createdBy");

-- CreateIndex
CREATE INDEX "BackupScheduleLog_scheduleId_idx" ON "BackupScheduleLog"("scheduleId");

-- CreateIndex
CREATE INDEX "BackupScheduleLog_scheduledAt_idx" ON "BackupScheduleLog"("scheduledAt");

-- CreateIndex
CREATE INDEX "BackupScheduleLog_backupId_idx" ON "BackupScheduleLog"("backupId");

-- AddForeignKey
ALTER TABLE "BackupSchedule" ADD CONSTRAINT "BackupSchedule_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BackupScheduleLog" ADD CONSTRAINT "BackupScheduleLog_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "BackupSchedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BackupScheduleLog" ADD CONSTRAINT "BackupScheduleLog_backupId_fkey" FOREIGN KEY ("backupId") REFERENCES "SystemBackup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BackupScheduleLog" ADD CONSTRAINT "BackupScheduleLog_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;
