import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import bcrypt from 'bcryptjs';

const profileUpdateSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phoneNumber: z.string().optional(),
  address: z.string().optional(),
  bio: z.string().optional(),
  preferences: z.object({
    notifications: z.boolean().optional(),
    emailAlerts: z.boolean().optional(),
    darkMode: z.boolean().optional(),
    language: z.string().optional(),
    timezone: z.string().optional()
  }).optional()
});

const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
  confirmPassword: z.string().min(1, 'Confirm password is required')
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export async function GET(request: NextRequest) {
  try {
    // TODO: Get user ID from session/token
    const userId = 1; // This should come from authentication

    const user = await prisma.user.findUnique({
      where: { userId },
      include: {
        Student: true,
        Instructor: true
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get user activity stats
    const totalLogins = await prisma.securityLogs.count({
      where: {
        userId,
        eventType: 'LOGIN_SUCCESS'
      }
    });

    const lastActivity = await prisma.securityLogs.findFirst({
      where: { userId },
      orderBy: { timestamp: 'desc' },
      select: { timestamp: true }
    });

    const activeSessions = await prisma.user.count({
      where: {
        userId,
        lastLogin: {
          gte: new Date(Date.now() - 30 * 60 * 1000) // Last 30 minutes
        }
      }
    });

    const profile = {
      userId: user.userId,
      userName: user.userName,
      email: user.email,
      role: user.role,
      status: user.status,
      firstName: user.Student?.[0]?.firstName || user.Instructor?.[0]?.firstName,
      lastName: user.Student?.[0]?.lastName || user.Instructor?.[0]?.lastName,
      phoneNumber: user.Student?.[0]?.phoneNumber || user.Instructor?.[0]?.phoneNumber,
      address: user.Student?.[0]?.address || user.Instructor?.[0]?.address,
      avatar: user.Student?.[0]?.img || user.Instructor?.[0]?.img,
      bio: user.Student?.[0]?.bio || user.Instructor?.[0]?.bio,
      department: user.Student?.[0]?.Department?.departmentName || user.Instructor?.[0]?.Department?.departmentName,
      position: user.role === 'INSTRUCTOR' ? 'Instructor' : user.role === 'STUDENT' ? 'Student' : 'Administrator',
      lastLogin: user.lastLogin?.toISOString(),
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
      preferences: {
        notifications: true, // Default values - these would be stored in a separate preferences table
        emailAlerts: true,
        darkMode: false,
        language: 'en',
        timezone: 'Asia/Manila'
      },
      security: {
        twoFactorEnabled: user.twoFactorEnabled,
        lastPasswordChange: user.lastPasswordChange?.toISOString() || user.createdAt.toISOString(),
        failedLoginAttempts: user.failedLoginAttempts,
        isEmailVerified: user.isEmailVerified,
        isPhoneVerified: user.isPhoneVerified
      },
      activity: {
        totalLogins,
        lastActivity: lastActivity?.timestamp.toISOString() || user.lastLogin?.toISOString(),
        sessionsCount: activeSessions
      }
    };

    return NextResponse.json({ data: profile });
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = profileUpdateSchema.parse(body);
    
    // TODO: Get user ID from session/token
    const userId = 1; // This should come from authentication

    // Update user profile
    const updatedUser = await prisma.user.update({
      where: { userId },
      data: {
        updatedAt: new Date()
      }
    });

    // Update student profile if exists
    if (validatedData.firstName || validatedData.lastName || validatedData.phoneNumber || validatedData.address || validatedData.bio) {
      const student = await prisma.student.findFirst({
        where: { userId }
      });

      if (student) {
        await prisma.student.update({
          where: { studentId: student.studentId },
          data: {
            firstName: validatedData.firstName,
            lastName: validatedData.lastName,
            phoneNumber: validatedData.phoneNumber,
            address: validatedData.address,
            bio: validatedData.bio
          }
        });
      }

      // Update instructor profile if exists
      const instructor = await prisma.instructor.findFirst({
        where: { userId }
      });

      if (instructor) {
        await prisma.instructor.update({
          where: { instructorId: instructor.instructorId },
          data: {
            firstName: validatedData.firstName,
            lastName: validatedData.lastName,
            phoneNumber: validatedData.phoneNumber,
            address: validatedData.address,
            bio: validatedData.bio
          }
        });
      }
    }

    // TODO: Update preferences in a separate preferences table
    // This would require creating a UserPreferences model

    return NextResponse.json({ 
      data: updatedUser,
      message: 'Profile updated successfully' 
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid profile data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}
