import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, SemesterType, SubjectStatus, SubjectType } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = Number(params.id);
    if (!Number.isFinite(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

    const s = await prisma.subjects.findUnique({
      where: { subjectId: id },
    });

    if (!s) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(s);
  } catch (e: any) {
    console.error('GET /api/subjects/[id] error:', e);
    return NextResponse.json({ error: e?.message ?? 'Failed to fetch subject' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = Number(params.id);
    if (!Number.isFinite(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

    const body = await req.json();

    // Minimal editable fields in UI; you can include more if you want
    const data: any = {};
    if (body.subjectCode !== undefined) data.subjectCode = String(body.subjectCode).trim();
    if (body.subjectName !== undefined) data.subjectName = String(body.subjectName).trim();

    // Optional extended fields (only update if provided)
    if (body.academicYear !== undefined) data.academicYear = String(body.academicYear);
    if (body.semester !== undefined)     data.semester = body.semester as SemesterType;
    if (body.totalHours !== undefined)   data.totalHours = Number(body.totalHours);
    if (body.lectureUnits !== undefined) data.lectureUnits = Number(body.lectureUnits);
    if (body.labUnits !== undefined)     data.labUnits = Number(body.labUnits);
    if (body.status !== undefined)       data.status = body.status as SubjectStatus;
    if (body.subjectType !== undefined)  data.subjectType = body.subjectType as SubjectType;
    if (body.description !== undefined)  data.description = body.description ?? null;
    if (body.prerequisites !== undefined) data.prerequisites = body.prerequisites ?? null;

    const updated = await prisma.subjects.update({
      where: { subjectId: id },
      data,
      select: { subjectId: true, subjectCode: true, subjectName: true },
    });

    return NextResponse.json(updated);
  } catch (e: any) {
    console.error('PUT /api/subjects/[id] error:', e);
    return NextResponse.json({ error: e?.message ?? 'Failed to update subject' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
