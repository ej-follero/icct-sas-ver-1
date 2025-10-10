import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Debug: Profile API called');

    // Shared prisma handles connection pooling; no explicit connect needed

    // Verify JWT token and extract user ID
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    let userId: number;
    try {
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const userIdRaw = (decoded as any)?.userId;
      userId = Number(userIdRaw);
      if (!Number.isFinite(userId)) throw new Error('Invalid user id');
    } catch (jwtError) {
      console.error('JWT verification failed:', jwtError);
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      );
    }

    // Test simple user query using authenticated userId
    console.log('🔍 Debug: Testing user query...', { userId });
    const user = await prisma.user.findUnique({
      where: { userId },
      select: {
        userId: true,
        userName: true,
        email: true,
        role: true,
        status: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true
      }
    });

    console.log('✅ Debug: User query successful:', user);

    return NextResponse.json({
      success: true,
      message: 'Debug API working',
      user: user
    });

  } catch (error) {
    console.error('❌ Debug: Error in profile API:', error);
    return NextResponse.json(
      { 
        error: 'Debug API failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
