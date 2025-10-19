import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST /api/instructors/create - create instructor linked to a user
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
      email,
      phoneNumber,
      firstName,
      middleName,
      lastName,
      suffix,
      gender,
      instructorType,
      departmentId,
      officeLocation,
      officeHours,
      specialization,
      employeeId,
      rfidTag,
    } = body || {};

    if (!userId || !email || !phoneNumber || !firstName || middleName === undefined || !lastName || !gender || !instructorType || !departmentId || !employeeId || !rfidTag) {
      return NextResponse.json({ error: 'Missing required instructor fields' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { userId: Number(userId) } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const instructor = await prisma.instructor.create({
      data: {
        email,
        phoneNumber,
        firstName,
        middleName,
        lastName,
        suffix: suffix ?? null,
        gender,
        instructorType,
        departmentId: Number(departmentId),
        officeLocation: officeLocation ?? null,
        officeHours: officeHours ?? null,
        specialization: specialization ?? null,
        employeeId,
        rfidTag,
      }
    });

    return NextResponse.json({ data: instructor, message: 'Instructor created successfully' }, { status: 201 });
  } catch (error) {
    console.error('Error creating instructor:', error);
    return NextResponse.json({ error: 'Failed to create instructor' }, { status: 500 });
  }
}


