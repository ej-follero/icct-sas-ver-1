import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// PATCH - Soft delete student (deactivate)
export async function PATCH(
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
    const { reason, deletedAt, action = 'deactivate' } = body;

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

    // Check if student is already deactivated or archived
    if (existingStudent.status === 'INACTIVE' || existingStudent.status === 'ARCHIVED') {
      return NextResponse.json(
        { error: 'Student is already deactivated or archived' },
        { status: 400 }
      );
    }

    // Determine the new status based on action
    const newStatus = action === 'archive' ? 'ARCHIVED' : 'INACTIVE';
    
    // Soft delete the student by updating status and adding deletion info
    const updatedStudent = await prisma.student.update({
      where: { studentId },
      data: {
        status: newStatus,
        deletedAt: deletedAt ? new Date(deletedAt) : new Date(),
        deletionReason: reason || 'No reason provided',
        updatedAt: new Date()
      },
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
        }
      }
    });

    const actionMessage = action === 'archive' ? 'archived' : 'deactivated';
    
    return NextResponse.json({
      success: true,
      data: updatedStudent,
      message: `Student has been successfully ${actionMessage}`
    });

  } catch (error) {
    console.error('Error soft deleting student:', error);
    return NextResponse.json(
      { error: 'Failed to deactivate student' },
      { status: 500 }
    );
  }
}
