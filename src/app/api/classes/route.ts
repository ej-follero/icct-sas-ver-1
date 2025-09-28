export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, DayOfWeek } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * GET /api/classes?instructorId=2&date=YYYY-MM-DD&day=MONDAY
 * - instructorId (required)
 * - date (optional): highlights Today filter (we infer the weekday)
 * - day (optional): MONDAY|TUESDAY|...
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const instructorId = Number(searchParams.get('instructorId'));
    const date = searchParams.get('date') || '';
    const dayParam = searchParams.get('day') as DayOfWeek | null;

    if (!instructorId || Number.isNaN(instructorId)) {
      return NextResponse.json({ error: 'instructorId is required' }, { status: 400 });
    }

    let dayFilter: DayOfWeek | undefined;
    if (dayParam) {
      dayFilter = dayParam;
    } else if (date) {
      const d = new Date(date);
      const weekdayIndex = d.getDay(); // 0 Sun ... 6 Sat
      const map: DayOfWeek[] = [
        'SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY',
      ];
      dayFilter = map[weekdayIndex];
    }

    const where: any = { instructorId };
    if (dayFilter) where.day = dayFilter;

    // Pull classes the instructor teaches
    const rows = await prisma.subjectSchedule.findMany({
      where,
      orderBy: [{ day: 'asc' }, { startTime: 'asc' }],
      include: {
        subject: true,
        section: true,
        room: true,
        semester: true,
      },
    });

    const items = rows.map(r => ({
      scheduleId: r.subjectSchedId,
      day: r.day,
      start: r.startTime,        // keep raw string you store (e.g. "08:00")
      end: r.endTime,            // same
      subjectCode: r.subject.subjectCode,
      subjectName: r.subject.subjectName,
      section: r.section.sectionName,
      room: r.room.roomNo,
      semester: r.semester.semesterType,
      academicYear: r.academicYear,
      status: r.status,
      scheduleType: r.scheduleType,
      notes: r.notes ?? '',
    }));

    return NextResponse.json({ items });
  } catch (e: any) {
    console.error('[classes] error', e);
    return NextResponse.json({ error: e?.message ?? 'Failed to fetch classes' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
