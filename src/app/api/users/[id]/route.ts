import { NextResponse } from 'next/server';
import { UserStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';

// GET single user
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
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

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Format user data similar to the main route
    const studentInfo = user.Student?.[0];
    const instructorInfo = user.Instructor?.[0];
    const guardianInfo = user.Guardian;
    const departmentHeadInfo = user.DepartmentHead?.[0];

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
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userId = parseInt(params.id);
    
    if (isNaN(userId)) {
      return NextResponse.json(
        { error: 'Invalid user ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { userName, email, role, status, isEmailVerified, isPhoneVerified, twoFactorEnabled } = body;

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
    if (isPhoneVerified !== undefined) updateData.isPhoneVerified = isPhoneVerified;
    if (twoFactorEnabled !== undefined) updateData.twoFactorEnabled = twoFactorEnabled;

    // Update user
    const updatedUser = await prisma.user.update({
      where: { userId },
      data: updateData,
    });

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
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userId = parseInt(params.id);
    
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