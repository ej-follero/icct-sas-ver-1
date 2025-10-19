import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { BackupType, BackupStatus, BackupLocation } from "@prisma/client";
import { backupServerService } from "@/lib/services/backup-server.service";
import { createNotification } from '@/lib/notifications';
import "@/lib/services/backup-scheduler.service"; // Initialize scheduler

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

// GET /api/backup - Get all backups
export async function GET(request: NextRequest) {
  try {
    const gate = await assertAdmin(request);
    if (!('ok' in gate) || gate.ok !== true) return gate.res;
    console.log("Fetching backups from database...");

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
    // no-op
  }
}

// POST /api/backup - Create a new backup
export async function POST(request: NextRequest) {
  try {
    const gate = await assertAdmin(request);
    if (!('ok' in gate) || gate.ok !== true) return gate.res;
    const createdBy = (gate as any).userId as number;
    const body = await request.json();
    const { name, description, type, location } = body;

    if (!name || !type || !location) {
      return NextResponse.json(
        { error: "Missing required fields: name, type, location" },
        { status: 400 }
      );
    }

    console.log("Creating new backup...");

    const newBackup = await prisma.systemBackup.create({
      data: {
        name,
        description,
        type: type as BackupType,
        location: location as BackupLocation,
        status: BackupStatus.IN_PROGRESS,
        size: "0 MB", // Will be updated when backup completes
        createdBy,
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
        createdBy,
      },
    });

    console.log(`Created backup with ID: ${newBackup.id}`);

    // Start the actual backup process in background
    backupServerService.performBackup(newBackup.id.toString(), {
      name,
      description,
      type,
      location,
      createdBy
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
            createdBy,
          },
        });

        // Notify creator
        try {
          await createNotification(createdBy, {
            title: 'Backup completed',
            message: `Backup "${name}" saved (${result.size}) at ${result.filePath || 'storage'}`,
            priority: 'NORMAL',
            type: 'BACKUP',
          });
        } catch {}
        
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
            createdBy,
          },
        });

        // Notify creator of failure
        try {
          await createNotification(createdBy, {
            title: 'Backup failed',
            message: `Backup "${name}" failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            priority: 'HIGH',
            type: 'BACKUP',
          });
        } catch {}
        
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
    // no-op
  }
} 