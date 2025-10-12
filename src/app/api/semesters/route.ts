import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // JWT Authentication (SUPER_ADMIN, ADMIN, DEPARTMENT_HEAD, INSTRUCTOR)
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = Number((decoded as any)?.userId);
    if (!Number.isFinite(userId)) {
      return NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { userId },
      select: { status: true, role: true }
    });
    if (!user || user.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'User not found or inactive' }, { status: 401 });
    }
    const allowedRoles = ['SUPER_ADMIN', 'ADMIN', 'DEPARTMENT_HEAD', 'INSTRUCTOR'];
    if (!allowedRoles.includes(user.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || undefined; // SemesterStatus
    const isActive = searchParams.get('isActive');
    const year = searchParams.get('year');

    const where: any = {};
    if (status && status !== 'all') where.status = status;
    if (isActive === 'true') where.isActive = true;
    if (isActive === 'false') where.isActive = false;
    if (year && !Number.isNaN(Number(year))) where.year = Number(year);
    
    const semesters = await prisma.semester.findMany({
      where,
      select: {
        semesterId: true,
        year: true,
        semesterType: true,
        status: true,
        isActive: true,
        startDate: true,
        endDate: true,
        registrationStart: true,
        registrationEnd: true,
        enrollmentStart: true,
        enrollmentEnd: true,
        notes: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: [
        { year: 'desc' },
        { semesterType: 'asc' }
      ],
    });

    return NextResponse.json({ data: semesters });
  } catch (error) {
    console.error('Error fetching semesters:', error);
    return NextResponse.json(
      { error: 'Failed to fetch semesters' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // JWT Authentication (SUPER_ADMIN, ADMIN only)
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = Number((decoded as any)?.userId);
    if (!Number.isFinite(userId)) {
      return NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { userId },
      select: { status: true, role: true }
    });
    if (!user || user.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'User not found or inactive' }, { status: 401 });
    }
    const allowedRoles = ['SUPER_ADMIN', 'ADMIN'];
    if (!allowedRoles.includes(user.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const {
      startDate,
      endDate,
      year,
      semesterType,
      registrationStart,
      registrationEnd,
      enrollmentStart,
      enrollmentEnd,
      notes
    } = body;

    // Validation
    if (!startDate || !endDate || !year || !semesterType) {
      return NextResponse.json({ 
        error: 'Missing required fields: startDate, endDate, year, semesterType' 
      }, { status: 400 });
    }

    // Validate date ranges
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start >= end) {
      return NextResponse.json({ 
        error: 'Start date must be before end date' 
      }, { status: 400 });
    }

    // Check for conflicts with existing semesters
    const conflictingSemester = await prisma.semester.findFirst({
      where: {
        year: Number(year),
        semesterType: semesterType,
        status: { not: 'CANCELLED' }
      }
    });

    if (conflictingSemester) {
      return NextResponse.json({ 
        error: `A ${semesterType.toLowerCase().replace('_', ' ')} for year ${year} already exists` 
      }, { status: 400 });
    }

    // Check for date overlaps
    const overlappingSemester = await prisma.semester.findFirst({
      where: {
        status: { not: 'CANCELLED' },
        OR: [
          {
            AND: [
              { startDate: { lte: start } },
              { endDate: { gte: start } }
            ]
          },
          {
            AND: [
              { startDate: { lte: end } },
              { endDate: { gte: end } }
            ]
          },
          {
            AND: [
              { startDate: { gte: start } },
              { endDate: { lte: end } }
            ]
          }
        ]
      }
    });

    if (overlappingSemester) {
      return NextResponse.json({ 
        error: `Date range overlaps with existing semester: ${overlappingSemester.year} ${overlappingSemester.semesterType}` 
      }, { status: 400 });
    }

    // Create the semester
    const semester = await prisma.semester.create({
      data: {
        startDate: start,
        endDate: end,
        year: Number(year),
        semesterType: semesterType,
        status: 'UPCOMING',
        isActive: false,
        registrationStart: registrationStart ? new Date(registrationStart) : null,
        registrationEnd: registrationEnd ? new Date(registrationEnd) : null,
        enrollmentStart: enrollmentStart ? new Date(enrollmentStart) : null,
        enrollmentEnd: enrollmentEnd ? new Date(enrollmentEnd) : null,
        notes: notes || null
      }
    });

    return NextResponse.json(semester, { status: 201 });
  } catch (error) {
    console.error('Error creating semester:', error);
    return NextResponse.json(
      { error: 'Failed to create semester' },
      { status: 500 }
    );
  }
}