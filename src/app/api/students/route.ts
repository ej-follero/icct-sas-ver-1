import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET - Fetch all students with relations
export async function GET(request: NextRequest) {
  try {
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

    // Status filter
    if (status && status !== 'all') {
      where.status = status.toUpperCase();
    }

    // Year level filter
    if (yearLevel && yearLevel !== 'all') {
      where.yearLevel = yearLevel.toUpperCase();
    }

    // Student type filter
    if (studentType && studentType !== 'all') {
      where.studentType = studentType.toUpperCase();
    }

    // Department filter
    if (department && department !== 'all') {
      where.Department = {
        departmentName: department
      };
    }

    // Course filter
    if (course && course !== 'all') {
      where.CourseOffering = {
        courseName: course
      };
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

// POST - Create new student
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.studentIdNum || !body.firstName || !body.lastName || !body.email) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if student ID or RFID tag already exists
    const existingStudent = await prisma.student.findFirst({
      where: {
        OR: [
          { studentIdNum: body.studentIdNum },
          { rfidTag: body.rfidTag },
          { email: body.email }
        ]
      }
    });

    if (existingStudent) {
      return NextResponse.json(
        { error: 'Student ID, RFID tag, or email already exists' },
        { status: 400 }
      );
    }

    // Create student
    const student = await prisma.student.create({
      data: {
        studentIdNum: body.studentIdNum,
        rfidTag: body.rfidTag,
        firstName: body.firstName,
        middleName: body.middleName,
        lastName: body.lastName,
        suffix: body.suffix,
        email: body.email,
        phoneNumber: body.phoneNumber,
        address: body.address,
        img: body.img,
        gender: body.gender,
        birthDate: body.birthDate ? new Date(body.birthDate) : null,
        nationality: body.nationality,
        studentType: body.studentType,
        yearLevel: body.yearLevel,
        courseId: body.courseId,
        departmentId: body.departmentId,
        guardianId: body.guardianId,
        userId: body.userId,
      },
      include: {
        Department: true,
        CourseOffering: true,
        Guardian: true,
      }
    });

    return NextResponse.json({
      data: student,
      message: 'Student created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating student:', error);
    return NextResponse.json(
      { error: 'Failed to create student' },
      { status: 500 }
    );
  }
}
