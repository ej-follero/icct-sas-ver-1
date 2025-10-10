import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
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

// POST /api/backup/test - Test backup functionality
export async function POST(request: NextRequest) {
  try {
    const gate = await assertAdmin(request);
    if (!('ok' in gate) || gate.ok !== true) return gate.res;
    const createdBy = (gate as any).userId as number;
    console.log("Testing backup functionality...");
    
    // Check if there are any existing backups
    const existingBackups = await prisma.systemBackup.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' }
    });
    
    console.log(`Found ${existingBackups.length} existing backups`);
    
    // Create a test backup
    const testBackup = await prisma.systemBackup.create({
      data: {
        name: "Test Backup",
        description: "Test backup created via API",
        type: "FULL",
        location: "LOCAL",
        status: "IN_PROGRESS",
        size: "0 MB",
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

    console.log(`Created test backup with ID: ${testBackup.id}`);

    // Create a log entry
    await prisma.backupLog.create({
      data: {
        backupId: testBackup.id,
        action: "CREATE",
        status: "IN_PROGRESS",
        message: "Test backup creation started",
        createdBy,
      },
    });

    // Start the actual backup process in background
    console.log("Starting backup process...");
    backupServerService.performBackup(testBackup.id.toString(), {
      name: "Test Backup",
      description: "Test backup created via API",
      type: "FULL",
      location: "LOCAL",
      createdBy
    }).then(async (result) => {
      console.log("Backup completed successfully:", result);
      
      try {
        // Create a new Prisma connection for the background process
        const backgroundPrisma = new (await import('@prisma/client')).PrismaClient();
        await backgroundPrisma.$connect();
        
        // Update backup with completion data
        await backgroundPrisma.systemBackup.update({
          where: { id: testBackup.id },
          data: {
            status: "COMPLETED",
            size: result.size,
            filePath: result.filePath,
            completedAt: new Date(),
          },
        });

        // Create completion log
        await backgroundPrisma.backupLog.create({
          data: {
            backupId: testBackup.id,
            action: "COMPLETE",
            status: "SUCCESS",
            message: `Test backup completed successfully: ${result.size}`,
            createdBy,
          },
        });
        
        await backgroundPrisma.$disconnect();
        console.log("Database updated with completion data");
      } catch (error) {
        console.error('Error updating backup completion:', error);
      }
    }).catch(async (error) => {
      console.error('Test backup failed:', error);
      
      try {
        // Create a new Prisma connection for the background process
        const backgroundPrisma = new (await import('@prisma/client')).PrismaClient();
        await backgroundPrisma.$connect();
        
        // Update backup with failure data
        await backgroundPrisma.systemBackup.update({
          where: { id: testBackup.id },
          data: {
            status: "FAILED",
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
            completedAt: new Date(),
          },
        });

        // Create failure log
        await backgroundPrisma.backupLog.create({
          data: {
            backupId: testBackup.id,
            action: "FAIL",
            status: "FAILED",
            message: `Test backup failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            createdBy,
          },
        });
        
        await backgroundPrisma.$disconnect();
        console.log("Database updated with failure data");
      } catch (updateError) {
        console.error('Error updating backup failure:', updateError);
      }
    });

    return NextResponse.json({
      success: true,
      message: "Test backup started successfully",
      data: {
        backupId: testBackup.id,
        existingBackups: existingBackups.length,
        status: "IN_PROGRESS"
      }
    });

  } catch (error) {
    console.error("Error testing backup:", error);
    return NextResponse.json(
      { 
        error: "Failed to test backup",
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    );
  }
} 