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
      entityType: 'student' | 'instructor';
      entityId: number;
      status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
      subjectSchedId?: number;
      timestamp?: string;
      notes?: string;
    };

    if (!entityType || !entityId || !status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Basic referential validation
    if (entityType === 'student') {
      const exists = await prisma.student.findUnique({ where: { studentId: Number(entityId) }, select: { studentId: true } });
      if (!exists) return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    } else {
      const exists = await prisma.instructor.findUnique({ where: { instructorId: Number(entityId) }, select: { instructorId: true } });
      if (!exists) return NextResponse.json({ error: 'Instructor not found' }, { status: 404 });
    }

    if (subjectSchedId) {
      const sched = await prisma.subjectSchedule.findUnique({ where: { subjectSchedId: Number(subjectSchedId) }, select: { subjectSchedId: true } });
      if (!sched) {
        return NextResponse.json({ error: 'Subject schedule not found' }, { status: 404 });
      }
    }

    const created = await prisma.attendance.create({
      data: {
        userId: Number(entityId),
        userRole: entityType === 'student' ? 'STUDENT' : 'INSTRUCTOR',
        status,
        attendanceType: 'MANUAL_ENTRY',
        verification: 'PENDING',
        timestamp: timestamp ? new Date(timestamp) : undefined,
        notes: notes || undefined,
        studentId: entityType === 'student' ? Number(entityId) : undefined,
        instructorId: entityType === 'instructor' ? Number(entityId) : undefined,
        subjectSchedId: subjectSchedId ? Number(subjectSchedId) : undefined,
      },
      select: { attendanceId: true },
    });

    return NextResponse.json({ success: true, attendanceId: created.attendanceId }, { status: 201 });
  } catch (e) {
    console.error('Manual attendance POST error', e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}



