import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, SemesterType, SubjectStatus, SubjectType } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Try to find valid foreign keys so we don't 500 on POST.
 * - department: prefer id = 1, otherwise the first available
 * - course:     pick the first available CourseOffering (uses its courseId)
 */
async function getDefaultFKs() {
  // Department
  const dept1 = await prisma.department.findUnique({ where: { departmentId: 1 } });
  const dept   = dept1 ?? (await prisma.department.findFirst({ orderBy: { departmentId: 'asc' } }));
  if (!dept) throw new Error('No Department found. Create one first.');

  // CourseOffering holds courseId; we only need a valid courseId that exists there.
  const anyCourseOffering = await prisma.courseOffering.findFirst({ orderBy: { courseId: 'asc' } });
  if (!anyCourseOffering) throw new Error('No CourseOffering found. Create one first.');

  return { departmentId: dept.departmentId, courseId: anyCourseOffering.courseId };
}

/** GET /api/subjects?q=... */
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const q = url.searchParams.get('q')?.trim() ?? '';

    const where = q
      ? {
          OR: [
            { subjectName: { contains: q, mode: 'insensitive' } },
            { subjectCode: { contains: q, mode: 'insensitive' } },
          ],
        }
      : undefined;

    const subjects = await prisma.subjects.findMany({
      where,
      orderBy: [{ subjectCode: 'asc' }],
      select: { subjectId: true, subjectCode: true, subjectName: true },
    });

    return NextResponse.json(subjects);
  } catch (e: any) {
    console.error('GET /api/subjects error:', e);
    return NextResponse.json({ error: e?.message ?? 'Failed to fetch subjects' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

/** POST /api/subjects  (body: { subjectCode, subjectName, ...optional }) */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const subjectCode = String(body.subjectCode ?? '').trim();
    const subjectName = String(body.subjectName ?? '').trim();

    if (!subjectCode || !subjectName) {
      return NextResponse.json({ error: 'subjectCode and subjectName are required' }, { status: 400 });
    }

    // Unique code guard
    const exists = await prisma.subjects.findUnique({ where: { subjectCode } });
    if (exists) {
      return NextResponse.json({ error: 'Subject code already exists' }, { status: 409 });
    }

    // Find safe defaults for required FKs
    const { departmentId, courseId } = await getDefaultFKs();

    // Optional inputs with safe fallbacks (your schema requires these)
    const academicYear = String(body.academicYear ?? '2024-2025');
    const semester     = (body.semester as SemesterType) ?? 'FIRST_SEMESTER';
    const totalHours   = Number.isFinite(Number(body.totalHours)) ? Number(body.totalHours) : 54;
    const lectureUnits = Number.isFinite(Number(body.lectureUnits)) ? Number(body.lectureUnits) : 3;
    const labUnits     = Number.isFinite(Number(body.labUnits)) ? Number(body.labUnits) : 2;

    const created = await prisma.subjects.create({
      data: {
        subjectCode,
        subjectName,
        subjectType: SubjectType.LECTURE,
        status: SubjectStatus.ACTIVE,
        description: body.description ?? null,
        lectureUnits,
        labUnits,
        creditedUnits: 0,
        totalHours,
        prerequisites: body.prerequisites ?? null,
        courseId,
        departmentId,
        academicYear,
        semester,
        maxStudents: 30,
      },
      select: { subjectId: true, subjectCode: true, subjectName: true },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (e: any) {
    console.error('POST /api/subjects error:', e);
    return NextResponse.json({ error: e?.message ?? 'Failed to create subject' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
