import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { backupSchedulingService } from "@/lib/services/backup-scheduling.service";

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

// GET /api/backup/schedules - Get all backup schedules
export async function GET(request: NextRequest) {
  try {
    const gate = await assertAdmin(request);
    if (!('ok' in gate) || gate.ok !== true) return gate.res;
    const { searchParams } = new URL(request.url);
    const isActive = searchParams.get('isActive');
    const frequency = searchParams.get('frequency');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search');

    const params = {
      isActive: isActive ? isActive === 'true' : undefined,
      frequency: frequency as any,
      page,
      limit,
      search: search || undefined
    };

    const result = await backupSchedulingService.getSchedules(params);
    
    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error("Error fetching backup schedules:", error);
    return NextResponse.json(
      { 
        error: "Failed to fetch backup schedules",
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    );
  }
}

// POST /api/backup/schedules - Create a new backup schedule
export async function POST(request: NextRequest) {
  try {
    const gate = await assertAdmin(request);
    if (!('ok' in gate) || gate.ok !== true) return gate.res;
    const body = await request.json();
    const {
      name,
      description,
      frequency,
      interval,
      timeOfDay,
      daysOfWeek,
      dayOfMonth,
      backupType,
      location,
      isEncrypted,
      retentionDays
    } = body;

    // Validation
    if (!name || !frequency || !timeOfDay || !backupType || !location) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const schedule = await backupSchedulingService.createSchedule({
      name,
      description,
      frequency,
      interval: interval || 1,
      timeOfDay,
      daysOfWeek,
      dayOfMonth,
      backupType,
      location,
      isEncrypted: isEncrypted !== undefined ? isEncrypted : true,
      retentionDays: retentionDays || 30,
      createdBy: (gate as any).userId
    });

    return NextResponse.json({
      success: true,
      data: schedule
    });

  } catch (error) {
    console.error("Error creating backup schedule:", error);
    return NextResponse.json(
      { 
        error: "Failed to create backup schedule",
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    );
  }
} 