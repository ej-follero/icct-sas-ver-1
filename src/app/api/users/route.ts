import { NextRequest, NextResponse } from 'next/server';
import { UserStatus, Role } from '@prisma/client';
import { prisma } from '@/lib/prisma';

// GET all users
export async function GET(request: NextRequest) {
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
    
    const users = await prisma.user.findMany({
      include: {
        _count: {
          select: {
            Attendance: true,
            SystemLogs: true,
            ReportLogs: true,
            RFIDLogs: true,
          },
        },
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
        DepartmentHead: {
          select: {
            departmentId: true,
            departmentName: true,
            departmentCode: true,
          },
        },
      },
    });

    const formattedUsers = users.map(user => {
      // Get related entity info
      const studentInfo = user.Student?.[0];
      const departmentHeadInfo = user.DepartmentHead?.[0];

      // Determine user type and related info
      let userType = 'Unknown';
      let relatedInfo = null;
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
      } else if (departmentHeadInfo) {
        userType = 'Department Head';
        relatedInfo = {
          departmentId: departmentHeadInfo.departmentId,
          departmentName: departmentHeadInfo.departmentName,
          departmentCode: departmentHeadInfo.departmentCode,
        };
      }

      return {
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
          totalAttendance: user._count.Attendance,
          totalSystemLogs: user._count.SystemLogs,
          totalReportLogs: user._count.ReportLogs,
          totalRFIDLogs: user._count.RFIDLogs,
        },
      };
    });

    return NextResponse.json({ data: formattedUsers });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: `Failed to fetch users: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}

// POST new user
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { userName, email, passwordHash, role, status } = body;

    // Validate required fields
    if (!userName || !email || !passwordHash || !role) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Create new user
    const newUser = await prisma.user.create({
      data: {
        userName,
        email,
        passwordHash,
        role,
        status: status || UserStatus.ACTIVE,
      },
    });

    return NextResponse.json(
      { data: newUser, message: 'User created successfully' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
} 