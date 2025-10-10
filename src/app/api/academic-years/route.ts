import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Authorization: allow ADMIN, DEPARTMENT_HEAD, INSTRUCTOR
    const isDev = process.env.NODE_ENV !== 'production';
    if (!isDev) {
      const token = request.cookies.get('token')?.value;
      if (!token) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
      }
      try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.userId as number;
        const user = await prisma.user.findUnique({ where: { userId }, select: { role: true } });
        const allowed = user && (user.role === 'ADMIN' || user.role === 'DEPARTMENT_HEAD' || user.role === 'INSTRUCTOR');
        if (!allowed) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
      } catch {
        return NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 });
      }
    }

    // Get all semesters grouped by year
    const semesters = await prisma.semester.findMany({
      where: {
        status: {
          not: 'CANCELLED'
        }
      },
      orderBy: [
        { year: 'desc' },
        { semesterType: 'asc' }
      ]
    });

    // Group semesters by year and create academic year structure
    const academicYearsMap = new Map<number, any>();
    
    semesters.forEach(semester => {
      const year = semester.year;
      
      if (!academicYearsMap.has(year)) {
        academicYearsMap.set(year, {
          id: year,
          name: `${year}-${year + 1}`,
          startDate: new Date(semester.startDate),
          endDate: new Date(semester.endDate),
          isActive: semester.isActive,
          semesters: []
        });
      }
      
      const academicYear = academicYearsMap.get(year);
      
      // Update academic year dates to cover the full range
      if (new Date(semester.startDate) < new Date(academicYear.startDate)) {
        academicYear.startDate = new Date(semester.startDate);
      }
      if (new Date(semester.endDate) > new Date(academicYear.endDate)) {
        academicYear.endDate = new Date(semester.endDate);
      }
      
      // Add semester to the academic year
      academicYear.semesters.push({
        id: semester.semesterId,
        name: getSemesterName(semester.semesterType),
        startDate: new Date(semester.startDate),
        endDate: new Date(semester.endDate),
        type: getSemesterTypeShort(semester.semesterType),
        isActive: semester.isActive,
        status: semester.status
      });
    });

    // Convert map to array and sort by year (newest first)
    const academicYears = Array.from(academicYearsMap.values())
      .sort((a, b) => b.id - a.id);

    return NextResponse.json(academicYears);
  } catch (error) {
    console.error('GET /api/academic-years error', error);
    return NextResponse.json({ 
      error: 'Failed to fetch academic years',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

function getSemesterName(semesterType: string): string {
  switch (semesterType) {
    case 'FIRST_SEMESTER':
      return '1st Semester';
    case 'SECOND_SEMESTER':
      return '2nd Semester';
    case 'THIRD_SEMESTER':
      return 'Summer';
    default:
      return 'Unknown Semester';
  }
}

function getSemesterTypeShort(semesterType: string): string {
  switch (semesterType) {
    case 'FIRST_SEMESTER':
      return '1st';
    case 'SECOND_SEMESTER':
      return '2nd';
    case 'THIRD_SEMESTER':
      return 'Summer';
    default:
      return 'Unknown';
  }
}
