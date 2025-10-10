import { NextRequest, NextResponse } from "next/server";
import { backupSchedulerService } from "@/lib/services/backup-scheduler.service";
import { prisma } from "@/lib/prisma";

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

// GET - Get scheduler status
export async function GET(request: NextRequest) {
  try {
    const gate = await assertAdmin(request);
    if (!('ok' in gate) || gate.ok !== true) return gate.res;
    const status = await backupSchedulerService.getSchedulerStatus();
    
    return NextResponse.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error("Error getting scheduler status:", error);
    return NextResponse.json(
      { error: "Failed to get scheduler status" },
      { status: 500 }
    );
  }
}

// POST - Control scheduler
export async function POST(request: NextRequest) {
  try {
    const gate = await assertAdmin(request);
    if (!('ok' in gate) || gate.ok !== true) return gate.res;
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'start':
        // Scheduler starts automatically, just return status
        const status = await backupSchedulerService.getSchedulerStatus();
        return NextResponse.json({
          success: true,
          message: "Scheduler is running",
          data: status
        });

      case 'stop':
        backupSchedulerService.stopScheduler();
        return NextResponse.json({
          success: true,
          message: "Scheduler stopped"
        });

      case 'status':
        const currentStatus = await backupSchedulerService.getSchedulerStatus();
        return NextResponse.json({
          success: true,
          data: currentStatus
        });

      default:
        return NextResponse.json(
          { error: "Invalid action" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Error controlling scheduler:", error);
    return NextResponse.json(
      { error: "Failed to control scheduler" },
      { status: 500 }
    );
  }
} 