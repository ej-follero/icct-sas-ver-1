import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { SecurityLogger } from '@/lib/services/security-logger.service';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const days = parseInt(searchParams.get('days') || '30');

    // Get security statistics
    const stats = await SecurityLogger.getSecurityStats(days);

    // Get recent events for timeline
    const recentEvents = await SecurityLogger.getRecentEvents(20);

    // Calculate event type distribution
    const eventTypeDistribution = stats.reduce((acc, stat) => {
      const eventType = stat.eventType;
      if (!acc[eventType]) {
        acc[eventType] = 0;
      }
      acc[eventType] += stat._count.id;
      return acc;
    }, {} as Record<string, number>);

    // Calculate severity distribution
    const severityDistribution = stats.reduce((acc, stat) => {
      const severity = stat.severity;
      if (!acc[severity]) {
        acc[severity] = 0;
      }
      acc[severity] += stat._count.id;
      return acc;
    }, {} as Record<string, number>);

    // Get daily event counts for the last 30 days
    const dailyEvents = await prisma.securityLog.groupBy({
      by: ['timestamp'],
      where: {
        timestamp: {
          gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
        },
      },
      _count: {
        id: true,
      },
    });

    // Get top IP addresses with suspicious activity
    const topSuspiciousIPs = await prisma.securityLog.groupBy({
      by: ['ipAddress'],
      where: {
        eventType: 'SUSPICIOUS_ACTIVITY',
        timestamp: {
          gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
        },
        ipAddress: {
          not: null,
        },
      },
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
      take: 10,
    });

    // Get failed login attempts by user
    const failedLoginsByUser = await prisma.securityLog.groupBy({
      by: ['userId'],
      where: {
        eventType: 'LOGIN_FAILED',
        timestamp: {
          gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
        },
      },
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
      take: 10,
    });

    // Get user details for failed logins
    const failedLoginUsers = await Promise.all(
      failedLoginsByUser.map(async (login) => {
        if (login.userId) {
          const user = await prisma.user.findUnique({
            where: { userId: login.userId },
            select: { userName: true, email: true },
          });
          return {
            userId: login.userId,
            userName: user?.userName || 'Unknown',
            email: user?.email || 'Unknown',
            failedAttempts: login._count.id,
          };
        }
        return null;
      })
    );

    const analytics = {
      eventTypeDistribution,
      severityDistribution,
      dailyEvents: dailyEvents.map(event => ({
        date: event.timestamp.toISOString().split('T')[0],
        count: event._count.id,
      })),
      topSuspiciousIPs: topSuspiciousIPs.map(ip => ({
        ipAddress: ip.ipAddress,
        count: ip._count.id,
      })),
      failedLoginUsers: failedLoginUsers.filter(Boolean),
      recentEvents: recentEvents.map(event => ({
        id: event.id,
        eventType: event.eventType,
        severity: event.severity,
        description: event.description,
        timestamp: event.timestamp,
        ipAddress: event.ipAddress,
        user: event.user,
      })),
      summary: {
        totalEvents: stats.reduce((sum, stat) => sum + stat._count.id, 0),
        highSeverityEvents: severityDistribution.HIGH || 0,
        criticalSeverityEvents: severityDistribution.CRITICAL || 0,
        suspiciousActivities: eventTypeDistribution.SUSPICIOUS_ACTIVITY || 0,
        failedLogins: eventTypeDistribution.LOGIN_FAILED || 0,
      },
    };

    return NextResponse.json(analytics);
  } catch (error) {
    console.error('Error fetching security analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch security analytics' },
      { status: 500 }
    );
  }
} 