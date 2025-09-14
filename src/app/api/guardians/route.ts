import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { Status, GuardianType } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const search = searchParams.get('search');

    // Build where clause
    const where: any = {};
    
    if (status && status !== 'all') {
      where.status = status.toUpperCase() as Status;
    }
    
    if (type && type !== 'all') {
      where.guardianType = type.toUpperCase() as GuardianType;
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
    const body = await request.json();
    
    // Create user first
    const user = await prisma.user.create({
      data: {
        userName: body.email.split('@')[0], // Use email prefix as username
        email: body.email,
        passwordHash: '$2b$10$default.hash.for.new.users', // You should hash this properly
        role: 'GUARDIAN',
        status: 'ACTIVE',
      }
    });

    // Create guardian
    const guardian = await prisma.guardian.create({
      data: {
        guardianId: user.userId,
        email: body.email,
        phoneNumber: body.phoneNumber,
        firstName: body.firstName,
        middleName: body.middleName,
        lastName: body.lastName,
        suffix: body.suffix,
        address: body.address,
        img: body.img,
        gender: body.gender,
        guardianType: body.guardianType,
        status: body.status?.toUpperCase() || 'ACTIVE',
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
