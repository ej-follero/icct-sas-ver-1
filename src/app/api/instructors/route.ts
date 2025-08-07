import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    console.log('Fetching instructors from database...');
    
    const instructors = await prisma.instructor.findMany({
      select: {
        instructorId: true,
        firstName: true,
        middleName: true,
        lastName: true,
        email: true,
        status: true,
      },
      where: {
        status: 'ACTIVE', // Only get active instructors
      },
      orderBy: {
        lastName: 'asc',
      },
    });

    console.log('Instructors found:', instructors.length);
    console.log('Sample instructor:', instructors[0]);

    // Transform the data to match the expected format for DepartmentForm
    const transformedInstructors = instructors.map(instructor => {
      // Create full name with middle name if available
      const fullName = [
        instructor.firstName,
        instructor.middleName,
        instructor.lastName
      ].filter(Boolean).join(' ').trim();
      
      return {
        id: instructor.instructorId.toString(),
        name: fullName,
        firstName: instructor.firstName,
        middleName: instructor.middleName,
        lastName: instructor.lastName,
        email: instructor.email,
        status: instructor.status
      };
    });

    console.log('Transformed instructors:', transformedInstructors.slice(0, 3));

    return NextResponse.json(transformedInstructors);
  } catch (error) {
    console.error('Error fetching instructors:', error);
    return NextResponse.json(
      { error: 'Failed to fetch instructors' },
      { status: 500 }
    );
  }
} 