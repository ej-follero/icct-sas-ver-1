export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, EnrollmentStatus } from '@prisma/client';
const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const scheduleId = Number(searchParams.get('scheduleId'));
    if (!scheduleId || Number.isNaN(scheduleId)) {
      return NextResponse.json({ error: 'scheduleId is required' }, { status: 400 });
    }

    console.log('[students] scheduleId =', scheduleId);

    const sched = await prisma.subjectSchedule.findUnique({
      where: { subjectSchedId: scheduleId },
      select: { sectionId: true },
    });

    if (!sched) {
      console.log('[students] schedule not found');
      return NextResponse.json({ items: [] }); // keep shape consistent
    }

    console.log('[students] sectionId =', sched.sectionId);

    const rows = await prisma.studentSection.findMany({
      where: {
        sectionId: sched.sectionId,
        enrollmentStatus: EnrollmentStatus.ACTIVE,
      },
      select: {
        Student: {
          select: {
            studentId: true,
            userId: true,
            studentIdNum: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { Student: { studentIdNum: 'asc' } },
    });

    const items = rows.map(r => ({
      studentId: r.Student.studentId,
      userId: r.Student.userId,
      studentIdNum: r.Student.studentIdNum,
      firstName: r.Student.firstName,
      lastName: r.Student.lastName,
    }));

    console.log('[students] items length =', items.length);

    return NextResponse.json({ items });
  } catch (e: any) {
    console.error('[students] error', e);
    return NextResponse.json({ error: e?.message ?? 'Failed to fetch students' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
