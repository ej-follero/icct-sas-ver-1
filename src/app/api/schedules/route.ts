// app/api/schedules/route.ts
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, ScheduleStatus } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const instructorId = Number(searchParams.get('instructorId'));
    const academicYear  = searchParams.get('academicYear') || undefined;
    const semesterId    = searchParams.get('semesterId') ? Number(searchParams.get('semesterId')) : undefined;

    if (!instructorId || Number.isNaN(instructorId)) {
      return NextResponse.json({ error: 'instructorId is required' }, { status: 400 });
    }

    const where: any = {
      instructorId,
      status: ScheduleStatus.ACTIVE,            
      ...(academicYear && { academicYear }),
      ...(semesterId   && { semesterId }),
    };

    const schedules = await prisma.subjectSchedule.findMany({
      where,
      include: {
        subject:   true,
        section:   true,
        instructor:true,
        room:      true,
        semester:  true,
      },
      orderBy: [{ day: 'asc' }, { startTime: 'asc' }],
    });

    return NextResponse.json(schedules);
  } catch (e: any) {
    console.error('GET /api/schedules error:', e);
    return NextResponse.json({ error: e?.message ?? 'Failed to fetch schedules' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
