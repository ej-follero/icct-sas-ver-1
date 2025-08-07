import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { BackupType, BackupStatus, BackupLocation } from "@prisma/client";
import { backupServerService } from "@/lib/services/backup-server.service";
import "@/lib/services/backup-scheduler.service"; // Initialize scheduler

// GET /api/backup - Get all backups
export async function GET() {
  try {
    console.log("Fetching backups from database...");
    
    // Ensure database connection
    await prisma.$connect();
    
    const backups = await prisma.systemBackup.findMany({
      include: {
        createdByUser: {
          select: {
            userId: true,
            userName: true,
            email: true,
          },
        },
        restorePoints: {
          select: {
            id: true,
            name: true,
            status: true,
            createdAt: true,
          },
        },
        _count: {
          select: {
            restorePoints: true,
            backupLogs: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    console.log(`Retrieved ${backups.length} backups from database`);

    const formattedBackups = backups.map(backup => ({
      id: backup.id.toString(),
      name: backup.name,
      type: backup.type,
      size: backup.size,
      status: backup.status,
      createdAt: backup.createdAt.toISOString(),
      description: backup.description,
      retentionDays: backup.retentionDays,
      isEncrypted: backup.isEncrypted,
      location: backup.location,
      createdBy: backup.createdByUser?.userName || 'Unknown User',
      completedAt: backup.completedAt?.toISOString(),
      errorMessage: backup.errorMessage,
      restorePointsCount: backup._count.restorePoints,
      logsCount: backup._count.backupLogs,
    }));

    return NextResponse.json({
      success: true,
      data: formattedBackups,
      count: backups.length,
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=59',
      }
    });

  } catch (error) {
    console.error("Error fetching backups:", error);
    
    // Log more details for debugging
    if (error instanceof Error) {
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    
    return NextResponse.json(
      { 
        error: "Failed to fetch backups",
        details: process.env.NODE_ENV === 'development' ? {
          message: error instanceof Error ? error.message : 'Unknown error',
          name: error instanceof Error ? error.name : 'Unknown',
          stack: error instanceof Error ? error.stack : undefined
        } : undefined
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// POST /api/backup - Create a new backup
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, description, type, location, createdBy } = body;

    if (!name || !type || !location || !createdBy) {
      return NextResponse.json(
        { error: "Missing required fields: name, type, location, createdBy" },
        { status: 400 }
      );
    }

    console.log("Creating new backup...");
    
    // Ensure database connection
    await prisma.$connect();
    
    const newBackup = await prisma.systemBackup.create({
      data: {
        name,
        description,
        type: type as BackupType,
        location: location as BackupLocation,
        status: BackupStatus.IN_PROGRESS,
        size: "0 MB", // Will be updated when backup completes
        createdBy: parseInt(createdBy),
        isEncrypted: true,
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
        action: "CREATE",
        status: "IN_PROGRESS",
        message: `Backup creation started: ${name}`,
        createdBy: parseInt(createdBy),
      },
    });

    console.log(`Created backup with ID: ${newBackup.id}`);

    // Start the actual backup process in background
    backupServerService.performBackup(newBackup.id.toString(), {
      name,
      description,
      type,
      location,
      createdBy: parseInt(createdBy)
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
            action: "COMPLETE",
            status: "SUCCESS",
            message: `Backup completed successfully: ${result.size}`,
            createdBy: parseInt(createdBy),
          },
        });
        
        await backgroundPrisma.$disconnect();
      } catch (error) {
        console.error('Error updating backup completion:', error);
      }
    }).catch(async (error) => {
      console.error('Backup failed:', error);
      
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
            completedAt: new Date(),
          },
        });

        // Create failure log
        await backgroundPrisma.backupLog.create({
          data: {
            backupId: newBackup.id,
            action: "FAIL",
            status: "FAILED",
            message: `Backup failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            createdBy: parseInt(createdBy),
          },
        });
        
        await backgroundPrisma.$disconnect();
      } catch (updateError) {
        console.error('Error updating backup failure:', updateError);
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        id: newBackup.id.toString(),
        name: newBackup.name,
        type: newBackup.type,
        status: newBackup.status,
        createdAt: newBackup.createdAt.toISOString(),
        description: newBackup.description,
        retentionDays: newBackup.retentionDays,
        isEncrypted: newBackup.isEncrypted,
        location: newBackup.location,
        size: newBackup.size,
        createdBy: newBackup.createdByUser?.userName || 'Unknown User',
        completedAt: newBackup.completedAt?.toISOString(),
        errorMessage: newBackup.errorMessage,
        restorePointsCount: 0,
        logsCount: 1,
      },
      message: "Backup creation started successfully",
    });

  } catch (error) {
    console.error("Error creating backup:", error);
    console.error("Error details:", {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    
    return NextResponse.json(
      { 
        error: "Failed to create backup",
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
} 