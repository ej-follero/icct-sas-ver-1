import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Create manual attendance entry
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    const {
      entityType,
      entityId,
      status,
      subjectSchedId,
      timestamp,
      notes,
    } = body as {
      entityType: 'student';
      entityId: number;
      status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
      subjectSchedId?: number;
      timestamp?: string;
      notes?: string;
    };

    if (!entityType || !entityId || !status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate entity exists and get userId (students only)
    let actualUserId: number;
    let userRole: 'STUDENT' = 'STUDENT';

    if (entityType === 'student') {
      const student = await prisma.student.findUnique({ 
        where: { studentId: Number(entityId) }, 
        select: { studentId: true, userId: true } 
      });
      if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 });
      actualUserId = student.userId;
    } else {
      return NextResponse.json({ error: 'Only student manual attendance is supported' }, { status: 410 });
    }

    // Validate subject schedule if provided (maps to subjectSchedId in schema)
    let validatedSubjectSchedId: number | null = null;
    if (subjectSchedId !== undefined && subjectSchedId !== null) {
      const schedule = await prisma.subjectSchedule.findUnique({
        where: { subjectSchedId: Number(subjectSchedId) },
        select: { subjectSchedId: true }
      });
      if (!schedule) {
        return NextResponse.json({ error: 'Subject schedule not found' }, { status: 404 });
      }
      validatedSubjectSchedId = schedule.subjectSchedId;
    }

    // Create attendance record according to schema
    const attendanceData = {
      userId: actualUserId,
      userRole: userRole,
      studentId: Number(entityId),
      subjectSchedId: validatedSubjectSchedId,
      status: status,
      attendanceType: 'MANUAL_ENTRY' as const,
      verification: 'PENDING' as const,
      timestamp: timestamp ? new Date(timestamp) : new Date(),
      notes: notes || null,
    };

    const created = await prisma.attendance.create({
      data: attendanceData,
      select: { 
        attendanceId: true,
        timestamp: true,
        status: true,
        attendanceType: true
      },
    });

    return NextResponse.json({ 
      success: true, 
      attendanceId: created.attendanceId,
      timestamp: created.timestamp,
      status: created.status,
      attendanceType: created.attendanceType
    }, { status: 201 });
  } catch (e) {
    console.error('Manual attendance POST error', e);
    console.error('Error details:', {
      message: e instanceof Error ? e.message : 'Unknown error',
      stack: e instanceof Error ? e.stack : undefined,
      name: e instanceof Error ? e.name : undefined
    });
    return NextResponse.json({ 
      error: 'Internal Server Error',
      details: e instanceof Error ? e.message : 'Unknown error'
    }, { status: 500 });
  }
}



