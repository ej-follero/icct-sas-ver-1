-- CreateTable
CREATE TABLE "BackupSettings" (
    "id" SERIAL NOT NULL,
    "autoBackup" BOOLEAN NOT NULL DEFAULT true,
    "backupFrequency" TEXT NOT NULL DEFAULT 'WEEKLY',
    "retentionDays" INTEGER NOT NULL DEFAULT 30,
    "encryptionEnabled" BOOLEAN NOT NULL DEFAULT true,
    "cloudStorage" BOOLEAN NOT NULL DEFAULT false,
    "compressionLevel" TEXT NOT NULL DEFAULT 'MEDIUM',
    "maxBackupSize" INTEGER NOT NULL DEFAULT 10,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BackupSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BackupSettings_autoBackup_idx" ON "BackupSettings"("autoBackup");

-- CreateIndex
CREATE INDEX "BackupSettings_backupFrequency_idx" ON "BackupSettings"("backupFrequency");
