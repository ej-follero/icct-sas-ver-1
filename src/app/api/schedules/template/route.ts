import { NextRequest, NextResponse } from "next/server";
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // JWT Authentication - Admin only
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

    // Check user exists and is active
    const user = await prisma.user.findUnique({
      where: { userId },
      select: { status: true, role: true }
    });

    if (!user || user.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'User not found or inactive' }, { status: 401 });
    }

    // Admin-only access control
    const adminRoles = ['SUPER_ADMIN', 'ADMIN'];
    if (!adminRoles.includes(user.role)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get sample data for template
    const [subjects, sections, instructors, rooms, semesters] = await Promise.all([
      prisma.subjects.findMany({
        take: 5,
        select: { subjectId: true, subjectName: true, subjectCode: true }
      }),
      prisma.section.findMany({
        take: 5,
        select: { sectionId: true, sectionName: true }
      }),
      prisma.instructor.findMany({
        take: 5,
        select: { instructorId: true, firstName: true, lastName: true }
      }),
      prisma.room.findMany({
        take: 5,
        select: { roomId: true, roomNo: true }
      }),
      prisma.semester.findMany({
        take: 3,
        select: { semesterId: true, semesterType: true, year: true }
      })
    ]);

    // Create CSV template
    const headers = [
      'subjectId',
      'subjectName', 
      'subjectCode',
      'sectionId',
      'sectionName',
      'instructorId',
      'instructorName',
      'roomId',
      'roomNo',
      'day',
      'startTime',
      'endTime',
      'scheduleType',
      'status',
      'maxStudents',
      'notes',
      'semesterId',
      'academicYear'
    ];

    // Create sample rows
    const sampleRows = [
      [
        subjects[0]?.subjectId || '',
        subjects[0]?.subjectName || 'Mathematics 101',
        subjects[0]?.subjectCode || 'MATH101',
        sections[0]?.sectionId || '',
        sections[0]?.sectionName || 'Section A',
        instructors[0]?.instructorId || '',
        instructors[0] ? `${instructors[0].firstName} ${instructors[0].lastName}` : 'John Doe',
        rooms[0]?.roomId || '',
        rooms[0]?.roomNo || 'Room 101',
        'MONDAY',
        '08:00',
        '10:00',
        'REGULAR',
        'ACTIVE',
        '30',
        'Sample schedule notes',
        semesters[0]?.semesterId || '',
        semesters[0] ? `${semesters[0].year}-${semesters[0].year + 1}` : '2024-2025'
      ],
      [
        subjects[1]?.subjectId || '',
        subjects[1]?.subjectName || 'Physics 101',
        subjects[1]?.subjectCode || 'PHYS101',
        sections[1]?.sectionId || '',
        sections[1]?.sectionName || 'Section B',
        instructors[1]?.instructorId || '',
        instructors[1] ? `${instructors[1].firstName} ${instructors[1].lastName}` : 'Jane Smith',
        rooms[1]?.roomId || '',
        rooms[1]?.roomNo || 'Room 102',
        'TUESDAY',
        '10:00',
        '12:00',
        'REGULAR',
        'ACTIVE',
        '25',
        '',
        semesters[1]?.semesterId || '',
        semesters[1] ? `${semesters[1].year}-${semesters[1].year + 1}` : '2024-2025'
      ]
    ];

    const csvContent = [
      headers.join(','),
      ...sampleRows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="schedule-import-template.csv"'
      }
    });

  } catch (error) {
    console.error('Schedule template generation error:', error);
    return NextResponse.json({ 
      error: "Failed to generate schedule template",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
