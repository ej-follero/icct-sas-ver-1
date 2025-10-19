import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST /api/students - create student linked to a user
export async function POST(request: NextRequest) {
  try {
    // Auth
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const reqUserId = Number((decoded as any)?.userId);
    if (!Number.isFinite(reqUserId)) {
      return NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 });
    }

    const reqUser = await prisma.user.findUnique({ where: { userId: reqUserId }, select: { status: true, role: true } });
    if (!reqUser || reqUser.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'User not found or inactive' }, { status: 401 });
    }
    const adminRoles = ['SUPER_ADMIN', 'ADMIN', 'DEPARTMENT_HEAD'];
    if (!adminRoles.includes(reqUser.role)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const {
      userId,
      studentIdNum,
      email,
      phoneNumber,
      firstName,
      middleName,
      lastName,
      suffix,
      address,
      gender,
      birthDate,
      nationality,
      studentType,
      yearLevel,
      courseId,
      guardianId,
      rfidTag,
    } = body || {};

    if (!userId || !studentIdNum || !email || !phoneNumber || !firstName || !lastName || !address || !gender || !studentType || !yearLevel) {
      return NextResponse.json({ error: 'Missing required student fields' }, { status: 400 });
    }

    // Ensure user exists
    const user = await prisma.user.findUnique({ where: { userId: Number(userId) } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Create student
    const student = await prisma.student.create({
      data: {
        userId: Number(userId),
        studentIdNum,
        email,
        phoneNumber,
        firstName,
        middleName: middleName ?? null,
        lastName,
        suffix: suffix ?? null,
        address,
        gender,
        birthDate: birthDate ? new Date(birthDate) : null,
        nationality: nationality ?? null,
        studentType,
        yearLevel,
        courseId: courseId ? Number(courseId) : null,
        guardianId: guardianId ? Number(guardianId) : null,
        rfidTag: rfidTag && String(rfidTag).trim().length > 0 ? rfidTag : `PENDING-${Date.now()}`,
      },
    });

    return NextResponse.json({ data: student, message: 'Student created successfully' }, { status: 201 });
  } catch (error) {
    console.error('Error creating student:', error);
    return NextResponse.json({ error: 'Failed to create student' }, { status: 500 });
  }
}

// GET - Fetch all students with relations
export async function GET(request: NextRequest) {
  try {
    // JWT Authentication (SUPER_ADMIN, ADMIN, DEPARTMENT_HEAD, INSTRUCTOR)
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const reqUserId = Number((decoded as any)?.userId);
    if (!Number.isFinite(reqUserId)) {
      return NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 });
    }

    const reqUser = await prisma.user.findUnique({ where: { userId: reqUserId }, select: { status: true, role: true } });
    if (!reqUser || reqUser.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'User not found or inactive' }, { status: 401 });
    }
    const allowedRoles = ['SUPER_ADMIN', 'ADMIN', 'DEPARTMENT_HEAD', 'INSTRUCTOR'];
    if (!allowedRoles.includes(reqUser.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status');
    const yearLevel = searchParams.get('yearLevel');
    const department = searchParams.get('department');
    const course = searchParams.get('course');
    const studentType = searchParams.get('studentType');

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    // Search filter
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { studentIdNum: { contains: search, mode: 'insensitive' } },
        { rfidTag: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Status filter (Status enum)
    if (status && status !== 'all') {
      const s = status.toUpperCase();
      if (['ACTIVE','INACTIVE','ARCHIVED'].includes(s)) where.status = s;
    }

    // Year level filter (yearLevel enum)
    if (yearLevel && yearLevel !== 'all') {
      const ylMap: any = { '1':'FIRST_YEAR','2':'SECOND_YEAR','3':'THIRD_YEAR','4':'FOURTH_YEAR' };
      const yl = ylMap[yearLevel] || yearLevel.toUpperCase();
      if (['FIRST_YEAR','SECOND_YEAR','THIRD_YEAR','FOURTH_YEAR'].includes(yl)) where.yearLevel = yl;
    }

    // Student type filter (StudentType enum)
    if (studentType && studentType !== 'all') {
      const st = studentType.toUpperCase();
      if (['REGULAR','IRREGULAR'].includes(st)) where.studentType = st;
    }

    // Department filter (relation path)
    if (department && department !== 'all') {
      where.Department = { is: { departmentName: department } };
    }

    // Course filter (relation path)
    if (course && course !== 'all') {
      where.CourseOffering = { is: { courseName: course } };
    }

    // Fetch students with relations
    const [students, total] = await Promise.all([
      prisma.student.findMany({
        where,
        skip,
        take: limit,
        include: {
          Department: {
            select: {
              departmentId: true,
              departmentName: true,
              departmentCode: true,
            }
          },
          CourseOffering: {
            select: {
              courseId: true,
              courseName: true,
              courseCode: true,
            }
          },
          Guardian: {
            select: {
              guardianId: true,
              firstName: true,
              lastName: true,
              email: true,
            }
          },
          StudentSection: {
            include: {
              Section: {
                select: {
                  sectionName: true,
                }
              }
            }
          }
        },
        orderBy: { lastName: 'asc' }
      }),
      prisma.student.count({ where })
    ]);

    // Transform data to include section_name and guardian_name
    const transformedStudents = students.map(student => ({
      ...student,
      section_name: student.StudentSection?.[0]?.Section?.sectionName || null,
      guardian_name: student.Guardian ? `${student.Guardian.firstName} ${student.Guardian.lastName}` : null,
    }));

    return NextResponse.json({
      data: transformedStudents,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });

  } catch (error) {
    console.error('Error fetching students:', error);
    return NextResponse.json(
      { error: 'Failed to fetch students' },
      { status: 500 }
    );
  }
}
