export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, AttendanceStatus, AttendanceType, Role } from '@prisma/client';

const prisma = new PrismaClient();

function combineDateAndHHMM(dateStr: string, hhmm?: string | null) {
  const d = new Date(dateStr);
  if (!hhmm) return d;
  const [h, m] = hhmm.split(':').map(Number);
  const out = new Date(d);
  out.setHours(h ?? 0, m ?? 0, 0, 0);
  return out;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { date, instructorId, scheduleId, entries } = body;

    if (!date || !instructorId || !scheduleId || !Array.isArray(entries) || entries.length === 0) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const schedule = await prisma.subjectSchedule.findUnique({
      where: { subjectSchedId: Number(scheduleId) },
      select: { startTime: true, endTime: true },
    });
    if (!schedule) return NextResponse.json({ error: 'Schedule not found' }, { status: 404 });

    const tx = await prisma.$transaction(
      entries.map((e: any) => {
        const status = e.status as AttendanceStatus;
        const ts = e.checkIn
          ? combineDateAndHHMM(date, e.checkIn)
          : combineDateAndHHMM(date, schedule.startTime);
        const out = e.checkOut ? combineDateAndHHMM(date, e.checkOut) : null;

        return prisma.attendance.create({
          data: {
            scheduleId: Number(scheduleId),
            userId: Number(e.userId),
            userRole: Role.STUDENT,
            status,
            attendanceType: AttendanceType.MANUAL_ENTRY,
            timestamp: ts,
            checkOutTime: out,
            notes: e.notes ?? null,
            Student: e.studentId ? { connect: { studentId: Number(e.studentId) } } : undefined,
            Instructor: { connect: { instructorId: Number(instructorId) } },
            SubjectSchedule: { connect: { subjectSchedId: Number(scheduleId) } },
          },
        });
      })
    );

    return NextResponse.json({ success: true, count: tx.length });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Failed to save attendance' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
