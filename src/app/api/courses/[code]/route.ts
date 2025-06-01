import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request, { params }: { params: { code: string } }) {
  try {
    const course = await prisma.courseOffering.findUnique({
      where: { courseCode: params.code },
      include: {
        Department: true,
      },
    });

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    return NextResponse.json({
      id: course.courseId,
      name: course.courseName,
      code: course.courseCode,
      department: course.Department?.departmentName ?? '',
      description: course.description,
      units: course.totalUnits,
      status: course.courseStatus === 'ACTIVE' ? 'active' : 'inactive',
      totalStudents: course.totalStudents,
      totalInstructors: 0, // Update if you have instructor relation
      createdAt: course.createdAt,
      updatedAt: course.updatedAt,
      objectives: [], // Fill if you have objectives
      requirements: [], // Fill if you have requirements
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch course' }, { status: 500 });
  }
} 