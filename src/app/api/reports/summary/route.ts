import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Auth: require valid JWT and allowed roles for summary access
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = Number((decoded as any)?.userId);
    if (!Number.isFinite(userId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid authentication token' },
        { status: 401 }
      );
    }
    const user = await prisma.user.findUnique({ where: { userId }, select: { role: true, status: true } });
    if (!user || user.status !== 'ACTIVE') {
      return NextResponse.json(
        { success: false, error: 'User not found or inactive' },
        { status: 404 }
      );
    }
    const allowedRoles = ['SUPER_ADMIN', 'ADMIN', 'DEPARTMENT_HEAD', 'INSTRUCTOR'];
    if (!allowedRoles.includes(user.role)) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [totalReports, generatedToday, activeUsers] = await Promise.all([
      prisma.reportLog.count(),
      prisma.reportLog.count({ where: { createdAt: { gte: startOfToday } } }),
      prisma.user.count({ where: { status: 'ACTIVE' } })
    ]);

    const summary = {
      totalReports,
      generatedToday,
      activeUsers,
      systemStatus: 'Online'
    };

    return NextResponse.json({
      success: true,
      data: summary,
      meta: {
        timestamp: new Date().toISOString(),
        cache: {
          ttl: 300, // 5 minutes
          expires: new Date(Date.now() + 300 * 1000).toISOString()
        }
      }
    });

  } catch (error) {
    console.error('Reports summary API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch reports summary',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
