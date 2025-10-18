import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'; // adjust import if your prisma is in another folder

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const instructorId = Number(searchParams.get('instructorId'));
    const date = searchParams.get('date') || undefined;

    if (!instructorId) {
      return NextResponse.json({ error: 'Missing instructorId' }, { status: 400 });
    }

    // Build WHERE filter
    const where: any = { instructorId };
    if (date) {
      const d = new Date(date);
      const start = new Date(d);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(end.getDate() + 1);
      where.startDate = { gte: start, lt: end };
    }

    const schedules = await prisma.subjectSchedule.findMany({
      where,
      orderBy: { startTime: 'asc' },
      select: {
        subjectSchedId: true,
        day: true,
        startTime: true,
        endTime: true,
        subject: { select: { subjectCode: true, subjectName: true } },
        section: { select: { sectionName: true } },
        room: { select: { roomBuildingLoc: true, roomFloorLoc: true } }, // match your schema
      },
    });

    const items = schedules.map(s => ({
      subjectSchedId: s.subjectSchedId,
      day: s.day,
      startTime: s.startTime,
      endTime: s.endTime,
      subjectCode: s.subject.subjectCode,
      subjectName: s.subject.subjectName,
      section: s.section.sectionName,
      room: `${s.room.roomBuildingLoc || ''} ${s.room.roomFloorLoc || ''}`.trim(),
    }));

    return NextResponse.json({ items });
  } catch (err: any) {
    console.error('GET /api/classes/my error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
