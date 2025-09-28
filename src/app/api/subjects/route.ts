// src/app/api/subjects/route.ts
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, ScheduleStatus } from '@prisma/client';

const prisma = new PrismaClient();

type GroupedRow = {
  subjectId: number;
  code: string;
  name: string;
  department: string | null;
  course: string | null;
  academicYear: string | null;
  semester: string | null; // e.g., 'FIRST_SEMESTER'
  status: string;
  sections: Set<number>;
};

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const instructorId = Number(url.searchParams.get('instructorId'));

    if (!instructorId || Number.isNaN(instructorId)) {
      return NextResponse.json({ error: 'instructorId is required' }, { status: 400 });
    }

    // Pull everything we need with precise selects so Prisma types line up
    const schedules = await prisma.subjectSchedule.findMany({
      where: {
        instructorId,
        status: ScheduleStatus.ACTIVE,
      },
      select: {
        subjectSchedId: true,
        subjectId: true,
        sectionId: true,
        academicYear: true,
        // This is a RELATION in your schema – get the enum inside it:
        semester: { select: { semesterType: true } },
        subject: {
          select: {
            subjectId: true,
            subjectCode: true,
            subjectName: true,
            status: true,
            CourseOffering: {
              select: {
                courseCode: true,
                courseName: true,
                academicYear: true,
                semester: true, // this one IS an enum on CourseOffering
              },
            },
            Department: { select: { departmentName: true } },
          },
        },
        section: { select: { sectionId: true } },
      },
      orderBy: [{ subjectId: 'asc' }, { sectionId: 'asc' }],
    });

    // Group by subject with strong typing to avoid 'unknown'
    const grouped = new Map<number, GroupedRow>();

    for (const s of schedules) {
      const key = s.subjectId;
      if (!grouped.has(key)) {
        const subj = s.subject;
        const co = subj.CourseOffering;

        grouped.set(key, {
          subjectId: key,
          code: subj.subjectCode,
          name: subj.subjectName,
          department: subj.Department?.departmentName ?? null,
          course: co ? `${co.courseCode} — ${co.courseName}` : null,
          // Prefer schedule's AY/semester; fall back to subject's course offering
          academicYear: s.academicYear ?? co?.academicYear ?? null,
          semester: s.semester?.semesterType ?? co?.semester ?? null,
          status: subj.status,
          sections: new Set<number>(),
        });
      }
      grouped.get(key)!.sections.add(s.sectionId);
    }

    // Count students across sections per subject
    const items = await Promise.all(
      Array.from(grouped.values()).map(async (row) => {
        const sectionIds = Array.from(row.sections) as number[];
        const students =
          sectionIds.length === 0
            ? 0
            : await prisma.studentSection.count({
                where: { sectionId: { in: sectionIds } },
              });

        return {
          subjectId: row.subjectId,
          code: row.code,
          name: row.name,
          department: row.department,
          course: row.course,
          academicYear: row.academicYear,
          semester: row.semester,
          status: row.status,
          sections: sectionIds.length,
          students,
        };
      })
    );

    return NextResponse.json({ items });
  } catch (e: any) {
    console.error('[subjects] error', e);
    return NextResponse.json(
      { error: e?.message ?? 'Failed to fetch subjects' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
