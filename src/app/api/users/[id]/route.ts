import { NextRequest, NextResponse } from 'next/server';
import { UserStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { createNotification } from '@/lib/notifications';

// GET single user
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

    const userCheck = await prisma.user.findUnique({ where: { userId: reqUserId }, select: { status: true, role: true } });
    if (!userCheck || userCheck.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'User not found or inactive' }, { status: 401 });
    }
    const allowedRoles = ['SUPER_ADMIN', 'ADMIN', 'DEPARTMENT_HEAD', 'INSTRUCTOR'];
    if (!allowedRoles.includes(userCheck.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { id } = await params;
    const userId = parseInt(id);
    
    if (isNaN(userId)) {
      return NextResponse.json(
        { error: 'Invalid user ID' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { userId },
      include: {
        _count: true,
        Student: {
          select: {
            studentId: true,
            firstName: true,
            lastName: true,
            studentIdNum: true,
            status: true,
            Guardian: {
              select: {
                guardianId: true,
                firstName: true,
                lastName: true,
                email: true,
                status: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Format user data similar to the main route
    const studentInfo = (user as any).Student?.[0];

    let userType = 'Unknown';
    let relatedInfo: any = null;
    let fullName = user.userName;

    if (studentInfo) {
      userType = 'Student';
      fullName = `${studentInfo.firstName} ${studentInfo.lastName}`.trim();
      relatedInfo = {
        id: studentInfo.studentId,
        studentIdNum: studentInfo.studentIdNum,
        status: studentInfo.status,
        guardian: studentInfo.Guardian ? {
          id: studentInfo.Guardian.guardianId,
          name: `${studentInfo.Guardian.firstName} ${studentInfo.Guardian.lastName}`.trim(),
          email: studentInfo.Guardian.email,
          status: studentInfo.Guardian.status,
        } : null,
      };
    }

    const formattedUser = {
      id: user.userId.toString(),
      userName: user.userName,
      email: user.email,
      role: user.role,
      status: user.status === UserStatus.ACTIVE ? 'active' : 
              user.status === UserStatus.INACTIVE ? 'inactive' :
              user.status === UserStatus.SUSPENDED ? 'suspended' :
              user.status === UserStatus.PENDING ? 'pending' :
              user.status === UserStatus.BLOCKED ? 'blocked' : 'unknown',
      userType,
      fullName,
      lastLogin: user.lastLogin,
      lastPasswordChange: user.lastPasswordChange,
      failedLoginAttempts: user.failedLoginAttempts,
      isEmailVerified: user.isEmailVerified,
      twoFactorEnabled: user.twoFactorEnabled,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      sessionVersion: user.sessionVersion,
      relatedInfo,
      statistics: {
        totalAttendance: (user as any)._count?.Attendance ?? 0,
        totalSystemLogs: (user as any)._count?.SystemLogs ?? 0,
        totalReportLogs: (user as any)._count?.ReportLogs ?? 0,
        totalRFIDLogs: (user as any)._count?.RFIDLogs ?? 0,
      },
    };

    return NextResponse.json({ data: formattedUser });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}

// PATCH update user
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

    const userCheck = await prisma.user.findUnique({ where: { userId: reqUserId }, select: { status: true, role: true } });
    if (!userCheck || userCheck.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'User not found or inactive' }, { status: 401 });
    }
    const adminRoles = ['SUPER_ADMIN', 'ADMIN'];
    if (!adminRoles.includes(userCheck.role)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
    const { id } = await params;
    const userId = parseInt(id);
    
    if (isNaN(userId)) {
      return NextResponse.json(
        { error: 'Invalid user ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { userName, email, role, status, isEmailVerified, twoFactorEnabled } = body;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { userId },
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if email is being changed and if it already exists
    if (email && email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email },
      });

      if (emailExists) {
        return NextResponse.json(
          { error: 'Email already exists' },
          { status: 409 }
        );
      }
    }

    // Prepare update data
    const updateData: any = {};
    if (userName !== undefined) updateData.userName = userName;
    if (email !== undefined) updateData.email = email;
    if (role !== undefined) updateData.role = role;
    if (status !== undefined) {
      updateData.status = status === 'active' ? UserStatus.ACTIVE :
                         status === 'inactive' ? UserStatus.INACTIVE :
                         status === 'suspended' ? UserStatus.SUSPENDED :
                         status === 'pending' ? UserStatus.PENDING :
                         status === 'blocked' ? UserStatus.BLOCKED :
                         existingUser.status;
    }
    if (isEmailVerified !== undefined) updateData.isEmailVerified = isEmailVerified;
    if (twoFactorEnabled !== undefined) updateData.twoFactorEnabled = twoFactorEnabled;

    // Update user
    const prev = await prisma.user.findUnique({ where: { userId }, select: { role: true } });
    const updatedUser = await prisma.user.update({
      where: { userId },
      data: updateData,
    });

    // Notify on role change
    try {
      if (prev && role !== undefined && prev.role !== updatedUser.role) {
        await createNotification(userId, {
          title: 'User role updated',
          message: `Your role has been changed to ${updatedUser.role}`,
          priority: 'NORMAL',
          type: 'SECURITY',
        });
      }
    } catch {}

    return NextResponse.json({
      data: updatedUser,
      message: 'User updated successfully'
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

// DELETE user (soft delete by setting status to inactive)
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

    const userCheck = await prisma.user.findUnique({ where: { userId: reqUserId }, select: { status: true, role: true } });
    if (!userCheck || userCheck.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'User not found or inactive' }, { status: 401 });
    }
    const adminRoles = ['SUPER_ADMIN', 'ADMIN'];
    if (!adminRoles.includes(userCheck.role)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
    const { id } = await params;
    const userId = parseInt(id);
    
    if (isNaN(userId)) {
      return NextResponse.json(
        { error: 'Invalid user ID' },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { userId },
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Soft delete by setting status to inactive
    const updatedUser = await prisma.user.update({
      where: { userId },
      data: { status: UserStatus.INACTIVE },
    });

    return NextResponse.json({
      data: updatedUser,
      message: 'User deactivated successfully'
    });
  } catch (error) {
    console.error('Error deactivating user:', error);
    return NextResponse.json(
      { error: 'Failed to deactivate user' },
      { status: 500 }
    );
  }
} 