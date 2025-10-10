import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // JWT Authentication - Admin only
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = Number((decoded as any)?.userId);
    if (!Number.isFinite(userId)) {
      return NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 });
    }

    // Check user exists and is active
    const user = await prisma.user.findUnique({
      where: { userId },
      select: { status: true, role: true }
    });

    if (!user || user.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'User not found or inactive' }, { status: 401 });
    }

    // Admin-only access control
    const adminRoles = ['SUPER_ADMIN', 'ADMIN'];
    if (!adminRoles.includes(user.role)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get security settings
    const settings = await prisma.securitySettings.findUnique({
      where: { id: 1 }
    });

    // Get recent security logs
    const recentLogs = await prisma.securityLog.findMany({
      where: {
        timestamp: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      },
      orderBy: { timestamp: 'desc' },
      take: 50,
      include: {
        user: {
          select: {
            userId: true,
            userName: true,
            email: true
          }
        }
      }
    });

    // Calculate security metrics
    const totalUsers = await prisma.user.count();
    const activeUsers = await prisma.user.count({
      where: {
        lastLogin: {
          gte: new Date(Date.now() - 30 * 60 * 1000) // Last 30 minutes
        }
      }
    });

    const failedAttempts = await prisma.securityLog.count({
      where: {
        eventType: 'LOGIN_FAILED',
        severity: 'CRITICAL',
        timestamp: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      }
    });

    const suspiciousActivities = await prisma.securityLog.count({
      where: {
        eventType: 'SUSPICIOUS_ACTIVITY',
        timestamp: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      }
    });

    // Calculate security score based on enabled features and recent activity
    let securityScore = 0;
    if (settings) {
      const enabledFeatures = [
        settings.twoFactorEnabled,
        settings.auditLoggingEnabled,
        settings.sslEnforcement,
        settings.apiRateLimiting,
        settings.dataEncryptionAtRest,
        settings.suspiciousActivityAlerts
      ].filter(Boolean).length;

      const baseScore = Math.min(100, enabledFeatures * 15);
      const activityPenalty = Math.min(20, (failedAttempts + suspiciousActivities) * 2);
      securityScore = Math.max(0, baseScore - activityPenalty);
    }

    // Get vulnerabilities count (simplified - based on failed attempts and suspicious activities)
    const vulnerabilities = failedAttempts + suspiciousActivities;

    // Get recommendations
    const recommendations = [];
    if (settings) {
      if (!settings.twoFactorEnabled) {
        recommendations.push('Enable two-factor authentication');
      }
      if (settings.sessionTimeoutMinutes > 30) {
        recommendations.push('Consider reducing session timeout for enhanced security');
      }
      if (!settings.suspiciousActivityAlerts) {
        recommendations.push('Enable suspicious activity alerts');
      }
      if (failedAttempts > 5) {
        recommendations.push('Review and strengthen password policies');
      }
    }

    const securityStatus = {
      overallScore: securityScore,
      lastScan: new Date().toISOString(),
      vulnerabilities,
      recommendations: recommendations.length,
      activeSessions: activeUsers,
      failedAttempts,
      suspiciousActivities,
      totalUsers,
      enabledFeatures: settings ? [
        settings.twoFactorEnabled,
        settings.auditLoggingEnabled,
        settings.sslEnforcement,
        settings.apiRateLimiting,
        settings.dataEncryptionAtRest,
        settings.suspiciousActivityAlerts
      ].filter(Boolean).length : 0,
      recentActivity: recentLogs.slice(0, 10),
      recommendationsList: recommendations
    };

    return NextResponse.json(securityStatus);
  } catch (error) {
    console.error('Error fetching security status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch security status' },
      { status: 500 }
    );
  }
}