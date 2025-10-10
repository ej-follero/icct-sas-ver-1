import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Simple Profile API: Starting');
    
    // Get user ID from JWT token in cookies
    const token = request.cookies.get('token')?.value;
    console.log('🔍 Simple Profile API: Token found:', !!token);
    
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verify JWT token and coerce numeric userId
    console.log('🔍 Simple Profile API: Verifying JWT...');
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
    console.log('✅ Simple Profile API: JWT verified, userId:', userId);

    // Simple user query with preferences
    console.log('🔍 Simple Profile API: Querying user...');
    const user = await prisma.user.findUnique({
      where: { userId },
      include: {
        UserPreferences: true
      }
    });

    console.log('✅ Simple Profile API: User query successful');

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Simple response
    const profile = {
      userId: user.userId,
      userName: user.userName,
      email: user.email,
      role: user.role,
      status: user.status,
      lastLogin: user.lastLogin?.toISOString(),
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
      preferences: {
        notifications: user.UserPreferences?.notifications ?? true,
        emailAlerts: user.UserPreferences?.emailAlerts ?? true,
        language: user.UserPreferences?.language ?? 'en',
        timezone: user.UserPreferences?.timezone ?? 'Asia/Manila'
      },
      security: {
        twoFactorEnabled: user.twoFactorEnabled,
        lastPasswordChange: user.lastPasswordChange?.toISOString() || user.createdAt.toISOString(),
        failedLoginAttempts: user.failedLoginAttempts,
        isEmailVerified: user.isEmailVerified
      },
      activity: {
        totalLogins: 0,
        lastActivity: user.lastLogin?.toISOString() || user.createdAt.toISOString(),
        sessionsCount: 0
      }
    };

    console.log('✅ Simple Profile API: Returning response');
    return NextResponse.json({ data: profile });

  } catch (error) {
    console.error('❌ Simple Profile API: Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch profile',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
