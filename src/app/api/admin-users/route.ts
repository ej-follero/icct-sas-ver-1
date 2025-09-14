import { NextResponse } from 'next/server';
import { UserStatus, Role } from '@prisma/client';
import { prisma } from '@/lib/prisma';

// GET admin users only
export async function GET() {
  try {
    console.log('Fetching admin users...');
    
    const adminUsers = await prisma.user.findMany({
      where: {
        role: {
          in: [Role.ADMIN, Role.SUPER_ADMIN, Role.DEPARTMENT_HEAD, Role.SYSTEM_AUDITOR]
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
        isPhoneVerified: user.isPhoneVerified,
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
export async function PATCH(request: Request) {
  try {
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
export async function POST(request: Request) {
  try {
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
    if (![Role.ADMIN, Role.SUPER_ADMIN, Role.DEPARTMENT_HEAD, Role.SYSTEM_AUDITOR].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Only ADMIN, SUPER_ADMIN, DEPARTMENT_HEAD, and SYSTEM_AUDITOR roles are allowed' },
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
        isPhoneVerified: false,
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
    case Role.SYSTEM_AUDITOR:
      return [
        'Read-only access to all data',
        'Audit log access',
        'Compliance reporting',
        'System analytics access',
        'No modification permissions'
      ];
    default:
      return ['read'];
  }
} 