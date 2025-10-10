import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { UserGender, InstructorType, Status } from '@prisma/client';

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

export async function POST(request: NextRequest) {
  try {
    const gate = await assertAdmin(request);
    if (!('ok' in gate) || gate.ok !== true) return gate.res;
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

    // Create instructor directly; avoid mismatched user/instructor linkage in schema
    const instructor = await prisma.instructor.create({
      data: {
        firstName,
        middleName,
        lastName,
        suffix,
        email,
        phoneNumber,
        gender: (gender as string)?.toUpperCase() as UserGender,
        instructorType: (instructorType as string)?.toUpperCase() as InstructorType,
        departmentId,
        status: (status as string)?.toUpperCase() as Status,
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