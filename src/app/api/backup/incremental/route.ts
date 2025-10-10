import { NextRequest, NextResponse } from "next/server";
import { incrementalBackupService } from "@/lib/services/incremental-backup.service";
import { prisma } from "@/lib/prisma";
import { BackupType, BackupStatus } from "@prisma/client";

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
    return { ok: true } as const;
  } catch {
    return { ok: false, res: NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 }) };
  }
}

// GET /api/backup/incremental - Get incremental backup information
export async function GET(request: NextRequest) {
  try {
    const gate = await assertAdmin(request);
    if (!('ok' in gate) || gate.ok !== true) return gate.res;
    const { searchParams } = new URL(request.url);
    const baseBackupId = searchParams.get('baseBackupId');

    console.log('Detecting changes for incremental backup...');
    
    const changes = await incrementalBackupService.detectChanges(baseBackupId || undefined);
    
    return NextResponse.json({
      success: true,
      data: {
        changes: changes.changes,
        totalFiles: changes.totalFiles,
        totalSize: changes.totalSize,
        databaseChanges: changes.databaseChanges,
        baseBackupId: changes.baseBackupId,
        estimatedBackupSize: `${(changes.totalSize / (1024 * 1024)).toFixed(2)} MB`
      }
    });
  } catch (error) {
    console.error('Error detecting changes:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to detect changes' 
      },
      { status: 500 }
    );
  }
}

// POST /api/backup/incremental - Create an incremental backup
export async function POST(request: NextRequest) {
  try {
    const gate = await assertAdmin(request);
    if (!('ok' in gate) || gate.ok !== true) return gate.res;
    const body = await request.json();
    const { 
      name, 
      description, 
      baseBackupId, 
      location, 
      isEncrypted, 
      createdBy,
      options 
    } = body;

    if (!name || !location || !createdBy) {
      return NextResponse.json(
        { error: "Missing required fields: name, location, createdBy" },
        { status: 400 }
      );
    }

    console.log("Creating incremental backup...");
    
    // Create backup record
    const newBackup = await prisma.systemBackup.create({
      data: {
        name,
        description,
        type: BackupType.INCREMENTAL,
        location: location as any,
        status: BackupStatus.IN_PROGRESS,
        size: "0 MB", // Will be updated when backup completes
        createdBy: parseInt(createdBy),
        isEncrypted: isEncrypted ?? true,
        retentionDays: 30,
      },
      include: {
        createdByUser: {
          select: {
            userId: true,
            userName: true,
            email: true,
          },
        },
      },
    });

    // Create a log entry
    await prisma.backupLog.create({
      data: {
        backupId: newBackup.id,
        action: "CREATE_INCREMENTAL",
        status: "IN_PROGRESS",
        message: `Incremental backup creation started: ${name}`,
        createdBy: parseInt(createdBy),
      },
    });

    console.log(`Created incremental backup with ID: ${newBackup.id}`);

    // Start the incremental backup process in background
    const { backupServerService } = await import('@/lib/services/backup-server.service');
    
    backupServerService.performBackup(newBackup.id.toString(), {
      name,
      description,
      type: 'INCREMENTAL',
      location,
      baseBackupId,
      isEncrypted,
      createdBy: parseInt(createdBy),
      options: options || {}
    }).then(async (result) => {
      try {
        // Update backup with completion data
        await prisma.systemBackup.update({
          where: { id: newBackup.id },
          data: {
            status: BackupStatus.COMPLETED,
            size: result.size,
            filePath: result.filePath,
            completedAt: new Date(),
          },
        });

        // Create completion log
        await prisma.backupLog.create({
          data: {
            backupId: newBackup.id,
            action: "COMPLETE_INCREMENTAL",
            status: "SUCCESS",
            message: `Incremental backup completed successfully: ${result.size}`,
            createdBy: parseInt(createdBy),
          },
        });
      } catch (error) {
        console.error('Error updating incremental backup completion:', error);
      }
    }).catch(async (error) => {
      console.error('Incremental backup failed:', error);
      
      try {
        // Update backup with failure data
        await prisma.systemBackup.update({
          where: { id: newBackup.id },
          data: {
            status: BackupStatus.FAILED,
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
          },
        });

        // Create failure log
        await prisma.backupLog.create({
          data: {
            backupId: newBackup.id,
            action: "FAIL_INCREMENTAL",
            status: "FAILED",
            message: `Incremental backup failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            createdBy: parseInt(createdBy),
          },
        });
      } catch (updateError) {
        console.error('Error updating incremental backup failure:', updateError);
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        backup: newBackup,
        message: "Incremental backup creation started"
      }
    });

  } catch (error) {
    console.error('Error creating incremental backup:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to create incremental backup' 
      },
      { status: 500 }
    );
  }
} 