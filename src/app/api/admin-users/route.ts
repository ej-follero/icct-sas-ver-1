import { NextRequest, NextResponse } from 'next/server';
import { UserStatus, Role } from '@prisma/client';
import { prisma } from '@/lib/prisma';

// GET admin users only
export async function GET() {
  try {
    console.log('Fetching admin users...');
    
    const adminUsers = await prisma.user.findMany({
      where: {
        role: {
          in: [Role.ADMIN, Role.SUPER_ADMIN, Role.DEPARTMENT_HEAD]
        }
      },
      include: {
        _count: {
          select: {
            Attendance: true,
            SystemLogs: true,
            ReportLogs: true,
            RFIDLogs: true,
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

    console.log(`Found ${adminUsers.length} admin users in database`);

    const formattedAdminUsers = adminUsers.map(user => {
      const departmentHeadInfo = user.DepartmentHead?.[0];

      return {
        id: user.userId.toString(),
        userName: user.userName,
        email: user.email,
        role: user.role,
        status: user.status === UserStatus.ACTIVE ? 'ACTIVE' : 
                user.status === UserStatus.INACTIVE ? 'INACTIVE' :
                user.status === UserStatus.SUSPENDED ? 'SUSPENDED' :
                user.status === UserStatus.PENDING ? 'PENDING' :
                user.status === UserStatus.BLOCKED ? 'BLOCKED' : 'UNKNOWN',
        fullName: user.userName, // For admin users, use userName as fullName
        lastLogin: user.lastLogin,
        lastPasswordChange: user.lastPasswordChange,
        failedLoginAttempts: user.failedLoginAttempts,
        isEmailVerified: user.isEmailVerified,
        twoFactorEnabled: user.twoFactorEnabled,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        sessionVersion: user.sessionVersion,
        department: departmentHeadInfo?.departmentName || null,
        permissions: getPermissionsForRole(user.role),
        statistics: {
          totalAttendance: user._count.Attendance,
          totalSystemLogs: user._count.SystemLogs,
          totalReportLogs: user._count.ReportLogs,
          totalRFIDLogs: user._count.RFIDLogs,
        },
      };
    });

    console.log(`Formatted ${formattedAdminUsers.length} admin users`);
    return NextResponse.json({ data: formattedAdminUsers });
  } catch (error) {
    console.error('Error fetching admin users:', error);
    return NextResponse.json(
      { error: `Failed to fetch admin users: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}

// PATCH to update admin user status
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
    const reqUser = await prisma.user.findUnique({ where: { userId: reqUserId }, select: { role: true, status: true } });
    if (!reqUser || reqUser.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'User not found or inactive' }, { status: 401 });
    }
    const adminRoles = ['SUPER_ADMIN', 'ADMIN'];
    if (!adminRoles.includes(reqUser.role)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
    const body = await request.json();
    const { userId, status } = body;

    if (!userId || !status) {
      return NextResponse.json(
        { error: 'Missing required fields: userId and status' },
        { status: 400 }
      );
    }

    // Validate status
    const validStatuses = ['ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING', 'BLOCKED'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status value' },
        { status: 400 }
      );
    }

    // Update user status
    const updatedUser = await prisma.user.update({
      where: { userId: parseInt(userId) },
      data: { 
        status: status as UserStatus,
        updatedAt: new Date()
      },
    });

    return NextResponse.json(
      { 
        data: updatedUser, 
        message: `Admin user status updated to ${status} successfully` 
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating admin user status:', error);
    return NextResponse.json(
      { error: 'Failed to update admin user status' },
      { status: 500 }
    );
  }
}

// POST to create new admin user
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
    const reqUser = await prisma.user.findUnique({ where: { userId: reqUserId }, select: { role: true, status: true } });
    if (!reqUser || reqUser.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'User not found or inactive' }, { status: 401 });
    }
    const adminRoles = ['SUPER_ADMIN', 'ADMIN'];
    if (!adminRoles.includes(reqUser.role)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
    const body = await request.json();
    const { userName, email, passwordHash, role = Role.ADMIN } = body;

    // Validate required fields
    if (!userName || !email || !passwordHash) {
      return NextResponse.json(
        { error: 'Missing required fields: userName, email, and passwordHash are required' },
        { status: 400 }
      );
    }

    // Validate role
    if (![Role.ADMIN, Role.SUPER_ADMIN, Role.DEPARTMENT_HEAD].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Only ADMIN, SUPER_ADMIN, and DEPARTMENT_HEAD roles are allowed' },
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

    // Create new admin user
    const newAdminUser = await prisma.user.create({
      data: {
        userName,
        email,
        passwordHash,
        role,
        status: UserStatus.ACTIVE,
        isEmailVerified: true,
        twoFactorEnabled: false,
      },
    });

    return NextResponse.json(
      { 
        data: newAdminUser, 
        message: 'Admin user created successfully' 
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating admin user:', error);
    return NextResponse.json(
      { error: 'Failed to create admin user' },
      { status: 500 }
    );
  }
}

// Helper function to get permissions based on role
function getPermissionsForRole(role: Role): string[] {
  switch (role) {
    case Role.SUPER_ADMIN:
      return [
        'All system permissions',
        'Emergency access capabilities', 
        'Super admin user management',
        'System configuration override',
        'Database administration',
        'Security audit access'
      ];
    case Role.ADMIN:
      return [
        'User management (excluding SUPER_ADMIN)',
        'Department management',
        'Course/subject management', 
        'Attendance oversight',
        'Report generation',
        'System monitoring',
        'Basic security settings',
        'RFID management',
        'Communication management'
      ];
    case Role.DEPARTMENT_HEAD:
      return [
        'Department-specific user management',
        'Department course management',
        'Department attendance reports',
        'Instructor oversight',
        'Department announcements',
        'Limited system access',
        'Department-specific RFID management',
        'Department communication'
      ];
    default:
      return ['read'];
  }
} 