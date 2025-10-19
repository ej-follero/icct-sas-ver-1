import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// PATCH /api/students/[id] - update student
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const studentId = parseInt(params.id);
    if (isNaN(studentId)) {
      return NextResponse.json({ error: 'Invalid student id' }, { status: 400 });
    }

    // Auth
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    const jwt = require('jsonwebtoken');
    let decoded: any;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (e) {
      return NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 });
    }
    const reqUserId = Number((decoded as any)?.userId);
    if (!Number.isFinite(reqUserId)) {
      return NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 });
    }

    const body = await request.json();
    console.log('[students PATCH] studentId:', studentId);
    console.log('[students PATCH] raw body:', body);

    // Build partial update payload: only include provided, valid values
    const updateData: any = {};
    if (typeof body.studentIdNum === 'string' && body.studentIdNum.trim() !== '') updateData.studentIdNum = body.studentIdNum.trim();
    if (typeof body.email === 'string' && body.email.trim() !== '') updateData.email = body.email.trim();
    if (typeof body.phoneNumber === 'string') updateData.phoneNumber = body.phoneNumber;
    if (typeof body.firstName === 'string' && body.firstName.trim() !== '') updateData.firstName = body.firstName.trim();
    if (typeof body.middleName !== 'undefined') updateData.middleName = body.middleName ?? null;
    if (typeof body.lastName === 'string' && body.lastName.trim() !== '') updateData.lastName = body.lastName.trim();
    if (typeof body.suffix !== 'undefined') updateData.suffix = body.suffix ?? null;
    if (typeof body.address !== 'undefined') updateData.address = body.address ?? undefined;
    // Enums: coerce to uppercase and validate against allowed values
    if (typeof body.gender === 'string') {
      const g = String(body.gender).toUpperCase();
      if (g === 'MALE' || g === 'FEMALE') updateData.gender = g;
    }
    if (typeof body.birthDate === 'string' && body.birthDate) {
      const d = new Date(body.birthDate);
      if (!isNaN(d.getTime())) updateData.birthDate = d;
    }
    if (typeof body.nationality !== 'undefined') updateData.nationality = body.nationality ?? undefined;
    if (typeof body.studentType === 'string') {
      const st = String(body.studentType).toUpperCase();
      if (st === 'REGULAR' || st === 'IRREGULAR') updateData.studentType = st;
    }
    if (typeof body.yearLevel === 'string' || typeof body.yearLevel === 'number') {
      const ylMap: Record<string, string> = {
        '1': 'FIRST_YEAR', 'FIRST_YEAR': 'FIRST_YEAR',
        '2': 'SECOND_YEAR', 'SECOND_YEAR': 'SECOND_YEAR',
        '3': 'THIRD_YEAR', 'THIRD_YEAR': 'THIRD_YEAR',
        '4': 'FOURTH_YEAR', 'FOURTH_YEAR': 'FOURTH_YEAR'
      };
      const key = String(body.yearLevel).toUpperCase();
      if (ylMap[key]) updateData.yearLevel = ylMap[key];
    }
    if (Number.isInteger(body.departmentId) && body.departmentId > 0) updateData.departmentId = body.departmentId;
    if (Number.isInteger(body.courseId) && body.courseId > 0) updateData.courseId = body.courseId;
    if (body.guardianId === null) updateData.guardianId = null; else if (Number.isInteger(body.guardianId) && body.guardianId > 0) updateData.guardianId = body.guardianId;
    if (typeof body.rfidTag !== 'undefined') updateData.rfidTag = body.rfidTag ?? undefined;

    console.log('[students PATCH] updateData:', updateData);
    const updated = await prisma.student.update({
      where: { studentId },
      data: updateData
    });

    return NextResponse.json({ data: updated, message: 'Student updated successfully' });
  } catch (error: any) {
    // Surface Prisma error codes/targets for quicker diagnosis
    const code = error?.code;
    const target = error?.meta?.target;
    console.error('Error updating student:', error);
    const message = typeof error?.message === 'string' ? error.message : 'Failed to update student';
    return NextResponse.json({ error: 'Failed to update student', details: message, code, target }, { status: 500 });
  }
}

// GET - Fetch single student by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    
    const { id } = await params;
    const studentId = parseInt(id);
    
    if (isNaN(studentId)) {
      return NextResponse.json(
        { error: 'Invalid student ID' },
        { status: 400 }
      );
    }

    const student = await prisma.student.findUnique({
      where: { studentId },
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
      }
    });

    if (!student) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      );
    }

    // Transform data to include section_name and guardian_name
    const transformedStudent = {
      ...student,
      section_name: student.StudentSection?.[0]?.Section?.sectionName || null,
      guardian_name: student.Guardian ? `${student.Guardian.firstName} ${student.Guardian.lastName}` : null,
    };

    return NextResponse.json({ data: transformedStudent });

  } catch (error) {
    console.error('Error fetching student:', error);
    return NextResponse.json(
      { error: 'Failed to fetch student' },
      { status: 500 }
    );
  }
}

// PUT - Update student
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // JWT Authentication - Admin only
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
    const adminRoles = ['SUPER_ADMIN', 'ADMIN'];
    if (!adminRoles.includes(reqUser.role)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
    
    const { id } = await params;
    const studentId = parseInt(id);
    
    if (isNaN(studentId)) {
      return NextResponse.json(
        { error: 'Invalid student ID' },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Check if student exists
    const existingStudent = await prisma.student.findUnique({
      where: { studentId }
    });

    if (!existingStudent) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      );
    }

    // Prepare update data - only include fields that are provided
    const updateData: any = {};
    
    if (body.firstName) updateData.firstName = body.firstName;
    if (body.lastName) updateData.lastName = body.lastName;
    if (body.studentIdNum) updateData.studentIdNum = body.studentIdNum;
    if (body.email) updateData.email = body.email;
    if (body.phoneNumber) updateData.phoneNumber = body.phoneNumber;
    if (body.yearLevel !== undefined) {
      const ylMap: any = {
        1: 'FIRST_YEAR',
        2: 'SECOND_YEAR',
        3: 'THIRD_YEAR',
        4: 'FOURTH_YEAR'
      };
      updateData.yearLevel = ylMap[body.yearLevel] || body.yearLevel;
    }
    if (body.status) {
      const allowedStatus = new Set(['ACTIVE', 'INACTIVE', 'ARCHIVED']);
      updateData.status = allowedStatus.has(body.status) ? body.status : undefined;
    }
    
    // Handle department and course updates if provided
    if (body.department) {
      // Find department by name
      const department = await prisma.department.findFirst({
        where: { departmentName: body.department }
      });
      if (department) {
        updateData.departmentId = department.departmentId;
      }
    }
    
    if (body.course) {
      // Find course by name
      const course = await prisma.courseOffering.findFirst({
        where: { courseName: body.course }
      });
      if (course) {
        updateData.courseId = course.courseId;
      }
    }

    // Update student
    const updatedStudent = await prisma.student.update({
      where: { studentId },
      data: updateData,
      include: {
        Department: true,
        CourseOffering: true,
        Guardian: true,
      }
    });

    return NextResponse.json({
      data: updatedStudent,
      message: 'Student updated successfully'
    });

  } catch (error) {
    console.error('Error updating student:', error);
    return NextResponse.json(
      { error: 'Failed to update student' },
      { status: 500 }
    );
  }
}

// (Note) Single PATCH handler is defined above; removed duplicate export.

// DELETE - Delete student
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // JWT Authentication - Admin only
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
    const adminRoles = ['SUPER_ADMIN', 'ADMIN'];
    if (!adminRoles.includes(reqUser.role)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
    
    const { id } = await params;
    const studentId = parseInt(id);
    
    if (isNaN(studentId)) {
      return NextResponse.json(
        { error: 'Invalid student ID' },
        { status: 400 }
      );
    }

    // Check if student exists
    const existingStudent = await prisma.student.findUnique({
      where: { studentId }
    });

    if (!existingStudent) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      );
    }

    // Delete student
    await prisma.student.delete({
      where: { studentId }
    });

    return NextResponse.json({
      message: 'Student deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting student:', error);
    return NextResponse.json(
      { error: 'Failed to delete student' },
      { status: 500 }
    );
  }
}
