import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { BackupStatus, BackupType, BackupLocation } from "@prisma/client";
import { backupServerService } from "@/lib/services/backup-server.service";

async function assertAdmin(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  if (!token) return { ok: false, res: NextResponse.json({ error: 'Authentication required' }, { status: 401 }) };
  try {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId as number;
    const user = await prisma.user.findUnique({ where: { userId }, select: { role: true } });
    if (!user || (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN')) {
      return { ok: false, res: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
    }
    return { ok: true, userId } as const;
  } catch {
    return { ok: false, res: NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 }) };
  }
}

// POST - Test automated backup
export async function POST(request: NextRequest) {
  try {
    const gate = await assertAdmin(request);
    if (!('ok' in gate) || gate.ok !== true) return gate.res;
    const createdBy = (gate as any).userId as number;
    console.log('Testing automated backup...');

    // Get backup settings
    const settings = await prisma.backupSettings.findFirst();
    if (!settings) {
      return NextResponse.json(
        { error: "No backup settings found" },
        { status: 400 }
      );
    }

    // Create backup record
    const backup = await prisma.systemBackup.create({
      data: {
        name: `Test Automated Backup - ${new Date().toLocaleDateString()}`,
        description: `Test automated backup created manually`,
        type: BackupType.FULL,
        size: "0 MB",
        status: BackupStatus.IN_PROGRESS,
        location: BackupLocation.LOCAL,
        isEncrypted: settings.encryptionEnabled,
        retentionDays: settings.retentionDays,
        createdBy,
      }
    });

    // Create backup log entry
    await prisma.backupLog.create({
      data: {
        backupId: backup.id,
        action: "TEST_AUTOMATED_BACKUP_STARTED",
        status: "IN_PROGRESS",
        message: "Test automated backup started manually",
        createdBy,
      }
    });

    // Start the actual backup process
    const backupData = {
      name: backup.name,
      description: backup.description,
      type: backup.type,
      location: backup.location,
      createdBy: backup.createdBy,
    };

    // Run backup in background
    backupServerService.performBackup(backup.id.toString(), backupData)
      .then(async (result) => {
        // Update backup record with results
        await prisma.systemBackup.update({
          where: { id: backup.id },
          data: {
            status: BackupStatus.COMPLETED,
            size: result.size,
            filePath: result.filePath,
            completedAt: new Date(),
          }
        });

        // Create completion log
        await prisma.backupLog.create({
          data: {
            backupId: backup.id,
            action: "TEST_AUTOMATED_BACKUP_COMPLETED",
            status: "SUCCESS",
            message: `Test automated backup completed successfully: ${result.size}`,
            createdBy,
          }
        });

        console.log(`Test automated backup ${backup.id} completed: ${result.size}`);
      })
      .catch(async (error) => {
        console.error(`Test automated backup ${backup.id} failed:`, error);

        // Update backup record with error
        await prisma.systemBackup.update({
          where: { id: backup.id },
          data: {
            status: BackupStatus.FAILED,
            errorMessage: error.message || "Test automated backup failed",
            completedAt: new Date(),
          }
        });

        // Create error log
        await prisma.backupLog.create({
          data: {
            backupId: backup.id,
            action: "TEST_AUTOMATED_BACKUP_FAILED",
            status: "ERROR",
            message: `Test automated backup failed: ${error.message}`,
            createdBy,
          }
        });
      });

    return NextResponse.json({
      success: true,
      message: "Test automated backup started successfully",
      data: {
        backupId: backup.id,
        status: "IN_PROGRESS"
      }
    });

  } catch (error) {
    console.error("Error testing automated backup:", error);
    return NextResponse.json(
      { error: "Failed to test automated backup" },
      { status: 500 }
    );
  }
} 