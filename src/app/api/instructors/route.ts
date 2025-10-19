import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    // JWT Authentication
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

    // Role-based access control
    const allowedRoles = ['SUPER_ADMIN', 'ADMIN', 'DEPARTMENT_HEAD', 'INSTRUCTOR'];
    if (!allowedRoles.includes(user.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "all";

    // Build where clause
    const where: any = {};
    
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { employeeId: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (status !== 'all') {
      where.status = status;
    }

    // Fetch instructors with related data
    const instructors = await prisma.instructor.findMany({
      where,
      include: {
        Department: {
          select: {
            departmentId: true,
            departmentName: true,
            departmentCode: true
          }
        },
        Subjects: {
          select: {
            subjectId: true,
            subjectName: true,
            subjectCode: true
          }
        },
        SubjectSchedule: {
          select: {
            subjectSchedId: true,
            day: true,
            startTime: true,
            endTime: true
          }
        }
      },
      orderBy: [
        { firstName: 'asc' },
        { lastName: 'asc' }
      ]
    });

    // Transform the data for frontend
    const transformedInstructors = instructors.map(instructor => ({
      instructorId: instructor.instructorId,
      firstName: instructor.firstName,
      middleName: instructor.middleName,
      lastName: instructor.lastName,
      suffix: instructor.suffix,
      email: instructor.email,
      phoneNumber: instructor.phoneNumber,
      employeeId: instructor.employeeId,
      rfidTag: instructor.rfidTag,
      gender: instructor.gender,
      instructorType: instructor.instructorType,
      status: instructor.status,
      departmentId: instructor.departmentId,
      department: instructor.Department ? {
        departmentId: instructor.Department.departmentId,
        departmentName: instructor.Department.departmentName,
        departmentCode: instructor.Department.departmentCode
      } : null,
      officeLocation: instructor.officeLocation,
      officeHours: instructor.officeHours,
      specialization: instructor.specialization,
      img: instructor.img,
      totalSubjects: instructor.Subjects.length,
      totalSchedules: instructor.SubjectSchedule.length,
      createdAt: instructor.createdAt,
      updatedAt: instructor.updatedAt
    }));

    return NextResponse.json(transformedInstructors);
  } catch (error) {
    console.error('Error fetching instructors:', error);
    return NextResponse.json(
      { error: 'Failed to fetch instructors' },
      { status: 500 }
    );
  }
}