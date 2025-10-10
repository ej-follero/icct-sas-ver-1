import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(request: NextRequest) {
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

    const { studentIds, status, reason } = await request.json();
    
    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return NextResponse.json({ 
        error: 'Student IDs are required and must be a non-empty array' 
      }, { status: 400 });
    }

    if (!status) {
      return NextResponse.json({ 
        error: 'Status is required' 
      }, { status: 400 });
    }

    const validStatuses = ['ACTIVE', 'INACTIVE', 'ARCHIVED'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ 
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` 
      }, { status: 400 });
    }

    // Update all students in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const normalizedIds: number[] = studentIds
        .map((id: any) => Number(id))
        .filter((n: number) => Number.isFinite(n));

      const updatePromises = normalizedIds.map(studentId =>
        tx.student.update({
          where: { studentId },
          data: { status }
        })
      );

      const updatedStudents = await Promise.all(updatePromises);
      
      // Optional: write an audit log per bulk operation
      try {
        await tx.securityLog.create({
          data: {
            userId: reqUserId,
            level: 'INFO',
            module: 'STUDENTS',
            action: 'BULK_STATUS_UPDATE',
            eventType: 'USER_ACTIVITY',
            severity: 'INFO',
            message: `Updated ${updatedStudents.length} student(s) to ${status}`,
          }
        });
      } catch {}

      return {
        success: true,
        updatedCount: updatedStudents.length,
        updatedStudents: updatedStudents.map(student => ({
          studentId: student.studentId,
          studentName: `${student.firstName} ${student.lastName}`.trim(),
          status: student.status
        }))
      };
    });

    return NextResponse.json(result);

  } catch (error: any) {
    console.error('Error updating student statuses:', error);
    
    if (error.code === 'P2025') {
      return NextResponse.json({ 
        error: 'One or more students not found' 
      }, { status: 404 });
    }
    
    return NextResponse.json({ 
      error: 'Failed to update student statuses' 
    }, { status: 500 });
  }
}
