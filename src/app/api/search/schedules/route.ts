import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Search subject schedules by subject code/name or id
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get('q') || '').trim();
    const limit = Math.min(Number(searchParams.get('limit') || 10), 50);
    if (!q) return NextResponse.json({ items: [] });

    const schedules = await prisma.subjectSchedule.findMany({
      where: {
        OR: [
          { subject: { subjectCode: { contains: q, mode: 'insensitive' } } },
          { subject: { subjectName: { contains: q, mode: 'insensitive' } } },
          { section: { sectionName: { contains: q, mode: 'insensitive' } } },
        ],
      },
      include: { subject: true, section: true },
      take: limit,
    });

    return NextResponse.json({
      items: schedules.map(s => ({
        value: String(s.subjectSchedId),
        label: `${s.subject.subjectCode} • ${s.section.sectionName} • ${s.day} ${s.startTime}-${s.endTime}`,
      }))
    });
  } catch (e) {
    console.error('Schedule search error', e);
    return NextResponse.json({ items: [] });
  }
}



