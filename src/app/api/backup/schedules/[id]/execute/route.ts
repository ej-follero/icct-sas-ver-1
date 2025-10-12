import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { backupSchedulingService } from "@/lib/services/backup-scheduling.service";

// POST /api/backup/schedules/[id]/execute - Execute a backup schedule
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Admin auth (SUPER_ADMIN/ADMIN)
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    try {
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const userId = decoded.userId as number;
      const user = await prisma.user.findUnique({ where: { userId }, select: { role: true } });
      if (!user || (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    } catch {
      return NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 });
    }

    const { id } = await params;
    const backup = await backupSchedulingService.executeScheduledBackup(id);

    return NextResponse.json({
      success: true,
      data: backup,
      message: "Backup schedule executed successfully"
    });

  } catch (error) {
    console.error("Error executing backup schedule:", error);
    return NextResponse.json(
      { 
        error: "Failed to execute backup schedule",
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    );
  }
} 