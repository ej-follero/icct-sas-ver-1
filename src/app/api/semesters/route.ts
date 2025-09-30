import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    console.log('Fetching semesters from database...');
    
    const semesters = await prisma.semester.findMany({
      select: {
        semesterId: true,
        year: true,
        semesterType: true,
        status: true,
        isActive: true
      },
      orderBy: [
        { year: 'desc' },
        { semesterType: 'asc' }
      ],
    });

    console.log('Semesters found:', semesters.length);

    return NextResponse.json({ data: semesters });
  } catch (error) {
    console.error('Error fetching semesters:', error);
    return NextResponse.json(
      { error: 'Failed to fetch semesters' },
      { status: 500 }
    );
  }
}
