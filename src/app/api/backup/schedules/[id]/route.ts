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
    return { ok: true } as const;
  } catch {
    return { ok: false, res: NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 }) };
  }
}

// GET /api/backup/schedules/[id] - Get a specific backup schedule
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const gate = await assertAdmin(request);
    if (!('ok' in gate) || gate.ok !== true) return gate.res;
    const { id } = await params;
    const schedule = await backupSchedulingService.getSchedule(id);
    
    if (!schedule) {
      return NextResponse.json(
        { error: "Backup schedule not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: schedule
    });

  } catch (error) {
    console.error("Error fetching backup schedule:", error);
    return NextResponse.json(
      { 
        error: "Failed to fetch backup schedule",
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    );
  }
}

// PUT /api/backup/schedules/[id] - Update a backup schedule
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const gate = await assertAdmin(request);
    if (!('ok' in gate) || gate.ok !== true) return gate.res;
    const { id } = await params;
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

    const schedule = await backupSchedulingService.updateSchedule(id, {
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
    });

    return NextResponse.json({
      success: true,
      data: schedule
    });

  } catch (error) {
    console.error("Error updating backup schedule:", error);
    return NextResponse.json(
      { 
        error: "Failed to update backup schedule",
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    );
  }
}

// DELETE /api/backup/schedules/[id] - Delete a backup schedule
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const gate = await assertAdmin(request);
    if (!('ok' in gate) || gate.ok !== true) return gate.res;
    const { id } = await params;
    await backupSchedulingService.deleteSchedule(id);

    return NextResponse.json({
      success: true,
      message: "Backup schedule deleted successfully"
    });

  } catch (error) {
    console.error("Error deleting backup schedule:", error);
    return NextResponse.json(
      { 
        error: "Failed to delete backup schedule",
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    );
  }
} 