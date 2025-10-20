import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { sectionId } = await request.json();
    const studentId = Number(id);
    if (!studentId || !sectionId) {
      return NextResponse.json({ error: 'studentId and sectionId are required' }, { status: 400 });
    }

    // Ensure student and section exist
    const [student, section] = await Promise.all([
      prisma.student.findUnique({ where: { studentId } }),
      prisma.section.findUnique({ where: { sectionId: Number(sectionId) } }),
    ]);
    if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    if (!section) return NextResponse.json({ error: 'Section not found' }, { status: 404 });

    // Validate year level compatibility
    // Student.yearLevel is an enum (e.g., 'FIRST_YEAR'), while Section.yearLevel is a number (1-4).
    // Map enum to numeric year for comparison.
    const yearLevelMap: Record<string, number> = {
      FIRST_YEAR: 1,
      SECOND_YEAR: 2,
      THIRD_YEAR: 3,
      FOURTH_YEAR: 4,
    };

    const studentYearNumeric = yearLevelMap[String(student.yearLevel)] ?? NaN;
    const sectionYearNumeric = Number(section.yearLevel);

    if (studentYearNumeric !== sectionYearNumeric) {
      return NextResponse.json({
        error: `Year level mismatch: Student is in year ${student.yearLevel} but section requires year ${section.yearLevel}`,
      }, { status: 400 });
    }

    const upsert = await prisma.studentSection.upsert({
      where: { studentId_sectionId: { studentId, sectionId: Number(sectionId) } },
      update: { enrollmentStatus: 'ACTIVE' },
      create: { studentId, sectionId: Number(sectionId), enrollmentStatus: 'ACTIVE' },
      include: { Section: true },
    });

    return NextResponse.json({ success: true, data: upsert });
  } catch (error) {
    console.error('Assign section error:', error);
    return NextResponse.json({ error: 'Failed to assign student to section' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const sectionId = Number(searchParams.get('sectionId'));
    const studentId = Number(id);
    if (!studentId || !sectionId) {
      return NextResponse.json({ error: 'studentId and sectionId are required' }, { status: 400 });
    }

    await prisma.studentSection.delete({
      where: { studentId_sectionId: { studentId, sectionId } },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Unassign section error:', error);
    return NextResponse.json({ error: 'Failed to remove student from section' }, { status: 500 });
  }
}


