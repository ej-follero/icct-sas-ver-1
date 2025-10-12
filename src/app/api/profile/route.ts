import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
// no bcrypt usage here

const profileUpdateSchema = z.object({
  userId: z.number().optional(),
  userName: z.string().optional(),
  email: z.string().optional(),
  role: z.string().optional(),
  status: z.string().optional(),
  avatar: z.string().optional(),
  lastLogin: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phoneNumber: z.string().optional(),
  address: z.string().optional(),
  preferences: z.object({
    notifications: z.boolean().optional(),
    emailAlerts: z.boolean().optional(),
    language: z.string().optional(),
    timezone: z.string().optional(),
    theme: z.string().optional(),
    emailFrequency: z.string().optional(),
    dashboardLayout: z.string().optional()
  }).optional(),
  security: z.object({
    twoFactorEnabled: z.boolean().optional(),
    lastPasswordChange: z.string().optional(),
    failedLoginAttempts: z.number().optional(),
    isEmailVerified: z.boolean().optional()
  }).optional(),
  activity: z.object({
    totalLogins: z.number().optional(),
    lastActivity: z.string().optional(),
    sessionsCount: z.number().optional()
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
    // Get user ID from JWT token in cookies
    const token = request.cookies.get('token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verify JWT token and extract user ID
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userIdRaw = (decoded as any)?.userId;
    const userId = Number(userIdRaw);
    if (!Number.isFinite(userId)) {
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { userId },
      include: {
        Student: {
          include: {
            Department: true
          }
        },
        UserPreferences: true
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get user activity stats
    const totalLogins = await prisma.systemLogs.count({
      where: {
        userId,
        actionType: 'LOGIN'
      }
    });

    const lastActivity = await prisma.systemLogs.findFirst({
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

    // Get avatar from User model first, then fallback to Student/Instructor models
    const instructor = user ? await prisma.instructor.findFirst({ where: { email: user.email } }) : null;
    
    const avatarUrl = user?.avatar || user?.Student?.[0]?.img || instructor?.img || undefined;

    const profile = {
      userId: user.userId,
      userName: user.userName,
      email: user.email,
      role: user.role,
      status: user.status,
      firstName: user.Student?.[0]?.firstName,
      lastName: user.Student?.[0]?.lastName,
      phoneNumber: user.Student?.[0]?.phoneNumber,
      address: user.Student?.[0]?.address,
      avatar: avatarUrl,
      department: user.Student?.[0]?.Department?.departmentName,
      position: user.role === 'INSTRUCTOR' ? 'Instructor' : user.role === 'STUDENT' ? 'Student' : 'Administrator',
      lastLogin: user.lastLogin?.toISOString(),
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
      preferences: {
        notifications: user.UserPreferences?.notifications ?? true,
        emailAlerts: user.UserPreferences?.emailAlerts ?? true,
        language: user.UserPreferences?.language ?? 'en',
        timezone: user.UserPreferences?.timezone ?? 'Asia/Manila',
        theme: user.UserPreferences?.theme ?? 'light',
        emailFrequency: user.UserPreferences?.emailFrequency ?? 'daily',
        dashboardLayout: user.UserPreferences?.dashboardLayout ?? 'default'
      },
      security: {
        twoFactorEnabled: user.twoFactorEnabled,
        lastPasswordChange: user.lastPasswordChange?.toISOString() || user.createdAt.toISOString(),
        failedLoginAttempts: user.failedLoginAttempts,
        isEmailVerified: user.isEmailVerified
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
    
    let validatedData;
    try {
      validatedData = profileUpdateSchema.parse(body);
    } catch (validationError) {
      console.error('Validation error:', validationError);
      return NextResponse.json(
        { error: 'Invalid profile data', details: validationError },
        { status: 400 }
      );
    }
    
    // Get user ID from JWT token in cookies
    const token = request.cookies.get('token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verify JWT token and extract user ID
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userIdRaw = (decoded as any)?.userId;
    const userId = Number(userIdRaw);
    
    if (!Number.isFinite(userId)) {
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      );
    }
    
    // Check if user exists before updating
    const existingUser = await prisma.user.findUnique({
      where: { userId }
    });
    
    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Update user profile - only update allowed fields
    const updateData: any = {
      updatedAt: new Date()
    };
    
    // Only update userName if provided and not empty
    if (validatedData.userName && validatedData.userName.trim()) {
      updateData.userName = validatedData.userName.trim();
    }
    
    const updatedUser = await prisma.user.update({
      where: { userId },
      data: updateData
    });

    // Update student profile if exists
    if (validatedData.firstName || validatedData.lastName || validatedData.phoneNumber || validatedData.address) {
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
            address: validatedData.address
          }
        });
      }
    }

    // Update or create user preferences
    if (validatedData.preferences) {
      const existingPreferences = await prisma.userPreferences.findUnique({
        where: { userId }
      });

      if (existingPreferences) {
        await prisma.userPreferences.update({
          where: { userId },
          data: {
            notifications: validatedData.preferences.notifications,
            emailAlerts: validatedData.preferences.emailAlerts,
            language: validatedData.preferences.language,
            timezone: validatedData.preferences.timezone,
            theme: validatedData.preferences.theme,
            emailFrequency: validatedData.preferences.emailFrequency,
            dashboardLayout: validatedData.preferences.dashboardLayout,
            updatedAt: new Date()
          }
        });
      } else {
        await prisma.userPreferences.create({
          data: {
            userId,
            notifications: validatedData.preferences.notifications ?? true,
            emailAlerts: validatedData.preferences.emailAlerts ?? true,
            language: validatedData.preferences.language ?? 'en',
            timezone: validatedData.preferences.timezone ?? 'Asia/Manila',
            theme: validatedData.preferences.theme ?? 'light',
            emailFrequency: validatedData.preferences.emailFrequency ?? 'daily',
            dashboardLayout: validatedData.preferences.dashboardLayout ?? 'default'
          }
        });
      }
    }

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
