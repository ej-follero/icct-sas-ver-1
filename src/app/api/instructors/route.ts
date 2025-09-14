import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    console.log('Fetching instructors from database...');
    
    const instructors = await prisma.instructor.findMany({
      include: {
        Department: {
          select: {
            departmentId: true,
            departmentName: true,
            departmentCode: true,
          }
        }
      },
      orderBy: {
        lastName: 'asc',
      },
    });

    console.log('Instructors found:', instructors.length);
    console.log('Sample instructor:', instructors[0]);

    return NextResponse.json({ data: instructors });
  } catch (error) {
    console.error('Error fetching instructors:', error);
    return NextResponse.json(
      { error: 'Failed to fetch instructors' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const {
      firstName,
      middleName,
      lastName,
      suffix,
      email,
      phoneNumber,
      gender,
      instructorType,
      departmentId,
      status,
      rfidTag,
      employeeId,
      officeLocation,
      officeHours,
      specialization,
    } = body;

    // Create user first
    const user = await prisma.user.create({
      data: {
        userName: email,
        email: email,
        passwordHash: 'temp_password_hash', // This should be properly hashed
        role: 'INSTRUCTOR',
        status: 'ACTIVE',
      },
    });

    // Create instructor
    const instructor = await prisma.instructor.create({
      data: {
        instructorId: user.userId,
        firstName,
        middleName,
        lastName,
        suffix,
        email,
        phoneNumber,
        gender,
        instructorType,
        departmentId,
        status,
        rfidTag,
        employeeId,
        officeLocation,
        officeHours,
        specialization,
      },
      include: {
        Department: {
          select: {
            departmentId: true,
            departmentName: true,
            departmentCode: true,
          }
        }
      }
    });

    return NextResponse.json({ data: instructor });
  } catch (error) {
    console.error('Error creating instructor:', error);
    return NextResponse.json(
      { error: 'Failed to create instructor' },
      { status: 500 }
    );
  }
} 