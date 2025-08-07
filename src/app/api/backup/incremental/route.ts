import { NextResponse } from "next/server";
import { incrementalBackupService } from "@/lib/services/incremental-backup.service";
import { db } from "@/lib/db";
import { BackupType, BackupStatus } from "@prisma/client";

// GET /api/backup/incremental - Get incremental backup information
export async function GET(request: Request) {
  try {
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
export async function POST(request: Request) {
  try {
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
    
    // Ensure database connection
    await db.$connect();
    
    // Create backup record
    const newBackup = await db.systemBackup.create({
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
    await db.backupLog.create({
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
        // Create a new Prisma connection for the background process
        const backgroundPrisma = new (await import('@prisma/client')).PrismaClient();
        await backgroundPrisma.$connect();
        
        // Update backup with completion data
        await backgroundPrisma.systemBackup.update({
          where: { id: newBackup.id },
          data: {
            status: BackupStatus.COMPLETED,
            size: result.size,
            filePath: result.filePath,
            completedAt: new Date(),
          },
        });

        // Create completion log
        await backgroundPrisma.backupLog.create({
          data: {
            backupId: newBackup.id,
            action: "COMPLETE_INCREMENTAL",
            status: "SUCCESS",
            message: `Incremental backup completed successfully: ${result.size}`,
            createdBy: parseInt(createdBy),
          },
        });
        
        await backgroundPrisma.$disconnect();
      } catch (error) {
        console.error('Error updating incremental backup completion:', error);
      }
    }).catch(async (error) => {
      console.error('Incremental backup failed:', error);
      
      try {
        // Create a new Prisma connection for the background process
        const backgroundPrisma = new (await import('@prisma/client')).PrismaClient();
        await backgroundPrisma.$connect();
        
        // Update backup with failure data
        await backgroundPrisma.systemBackup.update({
          where: { id: newBackup.id },
          data: {
            status: BackupStatus.FAILED,
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
          },
        });

        // Create failure log
        await backgroundPrisma.backupLog.create({
          data: {
            backupId: newBackup.id,
            action: "FAIL_INCREMENTAL",
            status: "FAILED",
            message: `Incremental backup failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            createdBy: parseInt(createdBy),
          },
        });
        
        await backgroundPrisma.$disconnect();
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