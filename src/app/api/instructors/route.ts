import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const instructors = await prisma.instructor.findMany({
      select: {
        instructorId: true,
        firstName: true,
        lastName: true,
        email: true,
        status: true,
      },
      where: {
        status: true, // Only get active instructors
      },
      orderBy: {
        lastName: 'asc',
      },
    });

    return NextResponse.json(instructors);
  } catch (error) {
    console.error('Error fetching instructors:', error);
    return NextResponse.json(
      { error: 'Failed to fetch instructors' },
      { status: 500 }
    );
  }
} 