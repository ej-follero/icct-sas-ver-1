import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Status, GuardianType, UserGender } from '@prisma/client';

async function assertAdmin(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const isDev = process.env.NODE_ENV !== 'production';
  if (!token) return isDev ? { ok: true } as const : { ok: false, res: NextResponse.json({ error: 'Authentication required' }, { status: 401 }) };
  try {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const role = decoded.role as string | undefined;
    if (!role || (role !== 'SUPER_ADMIN' && role !== 'ADMIN')) {
      return { ok: false, res: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
    }
    return { ok: true } as const;
  } catch {
    return { ok: false, res: NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 }) };
  }
}

export async function GET(request: NextRequest) {
  try {
    const gate = await assertAdmin(request);
    if (!('ok' in gate) || gate.ok !== true) return gate.res;
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const search = searchParams.get('search');

    // Build where clause
    const where: any = {};
    
    if (status && status !== 'all') {
      const upper = status.toUpperCase();
      if (upper in Status) where.status = upper as Status;
    }
    
    if (type && type !== 'all') {
      const upper = type.toUpperCase();
      if (upper in GuardianType) where.guardianType = upper as GuardianType;
    }

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phoneNumber: { contains: search, mode: 'insensitive' } },
      ];
    }

    const guardians = await prisma.guardian.findMany({
      where,
      include: {
        Student: {
          select: {
            studentId: true,
            firstName: true,
            lastName: true,
            studentIdNum: true,
            yearLevel: true,
            status: true,
            CourseOffering: {
              select: {
                courseName: true,
                courseCode: true,
              }
            },
            Department: {
              select: {
                departmentName: true,
                departmentCode: true,
              }
            }
          }
        }
      },
      orderBy: [
        { lastName: 'asc' },
        { firstName: 'asc' }
      ]
    });

    // Transform data to match the expected format
    const transformedGuardians = guardians.map(guardian => ({
      id: guardian.guardianId.toString(),
      name: `${guardian.firstName} ${guardian.middleName || ''} ${guardian.lastName} ${guardian.suffix || ''}`.trim(),
      firstName: guardian.firstName,
      middleName: guardian.middleName,
      lastName: guardian.lastName,
      suffix: guardian.suffix,
      email: guardian.email,
      phoneNumber: guardian.phoneNumber,
      address: guardian.address,
      img: guardian.img,
      gender: guardian.gender,
      guardianType: guardian.guardianType,
      status: guardian.status.toLowerCase() as 'active' | 'inactive',
      occupation: guardian.occupation,
      workplace: guardian.workplace,
      emergencyContact: guardian.emergencyContact,
      relationshipToStudent: guardian.relationshipToStudent,
      totalStudents: guardian.totalStudents,
      lastLogin: guardian.lastLogin,
      createdAt: guardian.createdAt,
      updatedAt: guardian.updatedAt,
      students: guardian.Student.map(student => ({
        id: student.studentId.toString(),
        name: `${student.firstName} ${student.lastName}`,
        studentIdNum: student.studentIdNum,
        yearLevel: student.yearLevel,
        status: student.status,
        course: student.CourseOffering ? {
          name: student.CourseOffering.courseName,
          code: student.CourseOffering.courseCode,
        } : null,
        department: student.Department ? {
          name: student.Department.departmentName,
          code: student.Department.departmentCode,
        } : null,
      }))
    }));

    return NextResponse.json({ data: transformedGuardians });
  } catch (error) {
    console.error('Error fetching guardians:', error);
    return NextResponse.json(
      { error: 'Failed to fetch guardians' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const gate = await assertAdmin(request);
    if (!('ok' in gate) || gate.ok !== true) return gate.res;
    const body = await request.json();

    // Normalize enums
    const statusUpper = (body.status || 'ACTIVE').toString().toUpperCase();
    const statusEnum: Status = (statusUpper in Status ? statusUpper : 'ACTIVE') as Status;
    const typeUpper = (body.guardianType || '').toString().toUpperCase();
    const typeEnum: GuardianType | null = (typeUpper in GuardianType ? (typeUpper as GuardianType) : null);
    const genderUpper = (body.gender || '').toString().toUpperCase();
    const genderEnum: UserGender | null = (genderUpper in UserGender ? (genderUpper as UserGender) : null);

    // Create guardian (no user account)
    const guardian = await prisma.guardian.create({
      data: {
        email: body.email,
        phoneNumber: body.phoneNumber,
        firstName: body.firstName,
        middleName: body.middleName,
        lastName: body.lastName,
        suffix: body.suffix,
        address: body.address,
        img: body.img,
        gender: genderEnum as any,
        guardianType: typeEnum as any,
        status: statusEnum,
        occupation: body.occupation,
        workplace: body.workplace,
        emergencyContact: body.emergencyContact,
        relationshipToStudent: body.relationshipToStudent,
        totalStudents: 0,
      },
      include: {
        Student: true
      }
    });

    return NextResponse.json({ 
      data: guardian,
      message: 'Guardian created successfully' 
    });
  } catch (error) {
    console.error('Error creating guardian:', error);
    return NextResponse.json(
      { error: 'Failed to create guardian' },
      { status: 500 }
    );
  }
}
