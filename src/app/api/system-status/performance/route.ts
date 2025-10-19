import { NextRequest, NextResponse } from 'next/server';
import { performanceMonitor, PerformanceStats, PerformanceAlert } from '@/lib/performance-monitor';
import { prisma } from '@/lib/prisma';

// Mock authentication for API routes
interface AuthSession {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

async function getServerSession(): Promise<AuthSession | null> {
  // Mock session for development
  return {
    user: {
      id: '1',
      email: 'admin@icct.edu.ph',
      role: 'SUPER_ADMIN'
    }
  };
}

interface PerformanceStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  stats: PerformanceStats;
  alerts: PerformanceAlert[];
  recommendations: string[];
  lastCheck: string;
}

export async function GET() {
  try {
    const session = await getServerSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to view system status
    const userRole = session.user?.role;
    if (!userRole || !['SUPER_ADMIN', 'ADMIN', 'SYSTEM_AUDITOR'].includes(userRole)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Get performance statistics
    const stats = performanceMonitor.getStats();
    const alerts = performanceMonitor.getAlerts();

    // Determine overall status
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    const recommendations: string[] = [];

    if (stats.performanceScore < 50) {
      status = 'unhealthy';
      recommendations.push('Critical performance issues detected. Immediate attention required.');
    } else if (stats.performanceScore < 80) {
      status = 'degraded';
      recommendations.push('Performance degradation detected. Consider optimization.');
    }

    if (stats.errorQueries > 0) {
      recommendations.push(`Database errors detected: ${stats.errorQueries} error queries.`);
    }

    if (stats.slowQueries > 0) {
      recommendations.push(`Slow queries detected: ${stats.slowQueries} queries exceeding threshold.`);
    }

    if (stats.averageQueryTime > 500) {
      recommendations.push('Average query time is high. Consider query optimization.');
    }

    if (Object.keys(stats.queriesByTable).length > 10) {
      recommendations.push('Many tables being accessed. Consider query consolidation.');
    }

    // Add positive recommendations if performance is good
    if (stats.performanceScore >= 90) {
      recommendations.push('Excellent database performance. System is running optimally.');
    }

    const performanceStatus: PerformanceStatus = {
      status,
      stats,
      alerts,
      recommendations,
      lastCheck: new Date().toISOString()
    };

    return NextResponse.json(performanceStatus);

  } catch (error) {
    console.error('Error fetching performance status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch performance status' },
      { status: 500 }
    );
  }
}

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

    const { action, alertId } = await request.json();

    switch (action) {
      case 'resolve_alert':
        if (alertId) {
          performanceMonitor.resolveAlert(alertId);
          return NextResponse.json({ message: 'Alert resolved successfully' });
        }
        break;

      case 'clear_data':
        performanceMonitor.clearOldData();
        return NextResponse.json({ message: 'Old performance data cleared successfully' });

      case 'enable_monitoring':
        performanceMonitor.enable();
        return NextResponse.json({ message: 'Performance monitoring enabled' });

      case 'disable_monitoring':
        performanceMonitor.disable();
        return NextResponse.json({ message: 'Performance monitoring disabled' });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    console.error('Error processing performance action:', error);
    return NextResponse.json(
      { error: 'Failed to process performance action' },
      { status: 500 }
    );
  }
}
