export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const instructorId = Number(url.searchParams.get('instructorId'));

    if (!instructorId || Number.isNaN(instructorId)) {
      return NextResponse.json({ error: 'instructorId is required' }, { status: 400 });
    }

    // Find all sections taught by this instructor (from SubjectSchedule)
    const schedules = await prisma.subjectSchedule.findMany({
      where: { instructorId },
      select: { sectionId: true },
    });

    const sectionIds = schedules.map(s => s.sectionId);
    if (sectionIds.length === 0) {
      return NextResponse.json({ items: [] });
    }

    // Students enrolled in those sections
    const ss = await prisma.studentSection.findMany({
      where: { sectionId: { in: sectionIds } },
      include: {
        Student: {
          select: {
            studentId: true,
            studentIdNum: true,
            firstName: true,
            middleName: true,
            lastName: true,
            gender: true,   // UserGender enum in your schema
            status: true,   // Status enum in your schema
          },
        },
        Section: {
          select: {
            sectionId: true,
            sectionName: true,
          },
        },
      },
      orderBy: [
        { sectionId: 'asc' },
        { studentId: 'asc' },
      ],
    });

    const items = ss.map(s => ({
      studentId: s.Student.studentId,
      number: s.Student.studentIdNum,
      name: `${s.Student.lastName}, ${s.Student.firstName}${s.Student.middleName ? ' ' + s.Student.middleName : ''}`,
      gender: s.Student.gender,
      status: s.Student.status,
      section: s.Section.sectionName,
    }));

    return NextResponse.json({ items });
  } catch (e: any) {
    console.error('[students] error', e);
    return NextResponse.json({ error: e?.message ?? 'Failed to fetch students' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
