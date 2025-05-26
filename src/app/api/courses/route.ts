import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const courses = await prisma.course.findMany({
      select: {
        id: true,
        name: true,
        code: true,
        description: true,
        status: true,
        _count: {
          select: {
            students: true,
            sections: true,
          },
        },
      },
      where: {
        status: true, // Only get active courses
      },
      orderBy: {
        name: 'asc',
      },
    });

    // Transform the data to match the expected format
    const formattedCourses = courses.map(course => ({
      id: course.id,
      name: course.name,
      code: course.code,
      description: course.description,
      status: course.status ? 'active' : 'inactive',
      totalStudents: course._count.students,
      totalSections: course._count.sections,
    }));

    return NextResponse.json(formattedCourses);
  } catch (error) {
    console.error('Error fetching courses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch courses' },
      { status: 500 }
    );
  }
} 