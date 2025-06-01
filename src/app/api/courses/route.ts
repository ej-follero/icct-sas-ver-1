import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const courses = await prisma.courseOffering.findMany({
      include: {
        Department: true,
      },
      orderBy: {
        courseName: 'asc',
      },
    });

    const formattedCourses = courses.map(course => ({
      id: course.courseId,
      name: course.courseName,
      code: course.courseCode,
      department: course.Department?.departmentName ?? '',
      units: course.totalUnits,
      totalInstructors: 0, // Update if you have a relation
      totalStudents: course.totalStudents,
      status: course.courseStatus === 'ACTIVE' ? 'active' : 'inactive',
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