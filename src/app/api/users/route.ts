import { NextResponse } from 'next/server';
import { UserStatus, Role } from '@prisma/client';
import { prisma } from '@/lib/prisma';

// GET all users
export async function GET() {
  try {
    console.log('Connecting to database...');
    await prisma.$connect();
    console.log('Database connected, fetching users...');
    
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
          },
        },
        Instructor: {
          select: {
            instructorId: true,
            firstName: true,
            lastName: true,
            email: true,
            status: true,
          },
        },
        Guardian: {
          select: {
            guardianId: true,
            firstName: true,
            lastName: true,
            email: true,
            status: true,
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

    console.log(`Found ${users.length} users in database`);

    const formattedUsers = users.map(user => {
      // Get related entity info
      const studentInfo = user.Student?.[0];
      const instructorInfo = user.Instructor?.[0];
      const guardianInfo = user.Guardian;
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
        };
      } else if (instructorInfo) {
        userType = 'Instructor';
        fullName = `${instructorInfo.firstName} ${instructorInfo.lastName}`.trim();
        relatedInfo = {
          id: instructorInfo.instructorId,
          email: instructorInfo.email,
          status: instructorInfo.status,
        };
      } else if (guardianInfo) {
        userType = 'Guardian';
        fullName = `${guardianInfo.firstName} ${guardianInfo.lastName}`.trim();
        relatedInfo = {
          id: guardianInfo.guardianId,
          email: guardianInfo.email,
          status: guardianInfo.status,
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
        isPhoneVerified: user.isPhoneVerified,
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

    console.log(`Formatted ${formattedUsers.length} users`);
    return NextResponse.json({ data: formattedUsers });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: `Failed to fetch users: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// POST new user
export async function POST(request: Request) {
  try {
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