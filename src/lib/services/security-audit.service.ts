import { prisma } from '@/lib/prisma';
import { auditService } from './audit.service';

export interface SecurityEvent {
  type: 'LOGIN' | 'LOGOUT' | 'ACCESS_DENIED' | 'SUSPICIOUS_ACTIVITY' | 'PASSWORD_CHANGE' | 'ROLE_CHANGE' | 'DATA_ACCESS' | 'SYSTEM_CHANGE';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  userId?: number;
  userEmail?: string;
  ipAddress?: string;
  userAgent?: string;
  details: Record<string, any>;
  timestamp?: Date;
}

export interface SecurityAlert {
  id: string;
  type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  title: string;
  message: string;
  userId?: number;
  ipAddress?: string;
  timestamp: Date;
  resolved: boolean;
  resolvedBy?: number;
  resolvedAt?: Date;
  details: Record<string, any>;
}

export interface SecurityMetrics {
  totalEvents: number;
  eventsByType: Record<string, number>;
  eventsBySeverity: Record<string, number>;
  eventsByHour: Record<string, number>;
  topUsers: Array<{ userId: number; userEmail: string; eventCount: number }>;
  topIPs: Array<{ ipAddress: string; eventCount: number; riskLevel: string }>;
  recentAlerts: SecurityAlert[];
  securityScore: number;
}

export class SecurityAuditService {
  
  /**
   * Log a security event
   */
  async logSecurityEvent(event: SecurityEvent): Promise<void> {
    try {
      // Log to security log table
      await prisma.securityLog.create({
        data: {
          level: event.severity,
          module: 'SECURITY_AUDIT',
          action: event.type,
          userId: event.userId,
          userEmail: event.userEmail,
          ipAddress: event.ipAddress,
          userAgent: event.userAgent,
          details: JSON.stringify(event.details),
          severity: event.severity,
          eventType: event.type,
          message: `${event.type} event detected`,
          timestamp: event.timestamp || new Date(),
        },
      });

      // Check for suspicious patterns and create alerts
      await this.checkForSuspiciousActivity(event);

      // Update security metrics
      await this.updateSecurityMetrics(event);

    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  }

  /**
   * Check for suspicious activity patterns
   */
  private async checkForSuspiciousActivity(event: SecurityEvent): Promise<void> {
    const suspiciousPatterns = [];

    // Check for multiple failed logins from same IP
    if (event.type === 'LOGIN' && event.details?.success === false) {
      const recentFailedLogins = await prisma.securityLog.count({
        where: {
          action: 'LOGIN',
          ipAddress: event.ipAddress,
          timestamp: {
            gte: new Date(Date.now() - 15 * 60 * 1000), // Last 15 minutes
          },
        },
      });

      if (recentFailedLogins >= 5) {
        suspiciousPatterns.push({
          type: 'MULTIPLE_FAILED_LOGINS',
          severity: 'HIGH',
          message: `Multiple failed login attempts from IP ${event.ipAddress}`,
        });
      }
    }

    // Check for unusual access patterns
    if (event.type === 'ACCESS_DENIED') {
      const recentAccessDenied = await prisma.securityLog.count({
        where: {
          action: 'ACCESS_DENIED',
          userId: event.userId,
          timestamp: {
            gte: new Date(Date.now() - 30 * 60 * 1000), // Last 30 minutes
          },
        },
      });

      if (recentAccessDenied >= 3) {
        suspiciousPatterns.push({
          type: 'REPEATED_ACCESS_DENIED',
          severity: 'MEDIUM',
          message: `Repeated access denied attempts for user ${event.userEmail}`,
        });
      }
    }

    // Check for unusual time access
    if (event.type === 'LOGIN' && event.details?.success === true) {
      const hour = new Date().getHours();
      if (hour < 6 || hour > 22) {
        suspiciousPatterns.push({
          type: 'UNUSUAL_TIME_ACCESS',
          severity: 'MEDIUM',
          message: `Login during unusual hours (${hour}:00)`,
        });
      }
    }

    // Create alerts for suspicious patterns
    for (const pattern of suspiciousPatterns) {
      await this.createSecurityAlert({
        type: pattern.type,
        severity: pattern.severity as any,
        title: `Suspicious Activity Detected`,
        message: pattern.message,
        userId: event.userId,
        ipAddress: event.ipAddress,
        details: {
          originalEvent: event,
          pattern: pattern,
        },
      });
    }
  }

  /**
   * Create a security alert
   */
  async createSecurityAlert(alert: Omit<SecurityAlert, 'id' | 'timestamp' | 'resolved'>): Promise<void> {
    try {
      await prisma.securityAlert.create({
        data: {
          type: alert.type,
          title: alert.title,
          message: alert.message,
          timestamp: new Date(),
          details: JSON.stringify(alert.details),
        } as any, // Type assertion for schema compatibility
      });
    } catch (error) {
      console.error('Failed to create security alert:', error);
    }
  }

  /**
   * Get security metrics
   */
  async getSecurityMetrics(hours: number = 24): Promise<SecurityMetrics> {
    const startTime = new Date(Date.now() - hours * 60 * 60 * 1000);

    // Get total events
    const totalEvents = await prisma.securityLog.count({
      where: {
        timestamp: { gte: startTime },
      },
    });

    // Get events by type
    const eventsByType = await prisma.securityLog.groupBy({
      by: ['action'],
      where: {
        timestamp: { gte: startTime },
      },
      _count: {
        id: true,
      },
    });

    // Get events by severity
    const eventsBySeverity = await prisma.securityLog.groupBy({
      by: ['severity'],
      where: {
        timestamp: { gte: startTime },
      },
      _count: {
        id: true,
      },
    });

    // Get events by hour
    const eventsByHour = await prisma.$queryRaw`
      SELECT 
        EXTRACT(HOUR FROM timestamp) as hour,
        COUNT(*) as count
      FROM "SecurityLog"
      WHERE timestamp >= ${startTime}
      GROUP BY EXTRACT(HOUR FROM timestamp)
      ORDER BY hour
    `;

    // Get top users
    const topUsers = await prisma.securityLog.groupBy({
      by: ['userId', 'userEmail'],
      where: {
        timestamp: { gte: startTime },
        userId: { not: null },
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

    // Get top IPs
    const topIPs = await prisma.securityLog.groupBy({
      by: ['ipAddress'],
      where: {
        timestamp: { gte: startTime },
        ipAddress: { not: null },
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

    // Get recent alerts
    const recentAlerts = await prisma.securityAlert.findMany({
      where: {
        timestamp: { gte: startTime },
      },
      orderBy: {
        timestamp: 'desc',
      },
      take: 10,
    });

    // Calculate security score (0-100)
    const criticalEvents = eventsBySeverity.find(e => e.severity === 'CRITICAL')?._count.id || 0;
    const highEvents = eventsBySeverity.find(e => e.severity === 'HIGH')?._count.id || 0;
    const mediumEvents = eventsBySeverity.find(e => e.severity === 'MEDIUM')?._count.id || 0;
    
    const securityScore = Math.max(0, 100 - (criticalEvents * 20) - (highEvents * 10) - (mediumEvents * 5));

    return {
      totalEvents,
      eventsByType: eventsByType.reduce((acc, item) => {
        acc[item.action] = item._count.id;
        return acc;
      }, {} as Record<string, number>),
      eventsBySeverity: eventsBySeverity.reduce((acc, item) => {
        acc[item.severity || 'UNKNOWN'] = item._count.id;
        return acc;
      }, {} as Record<string, number>),
      eventsByHour: (eventsByHour as any[]).reduce((acc, item) => {
        acc[item.hour] = item.count;
        return acc;
      }, {} as Record<string, number>),
      topUsers: topUsers.map(user => ({
        userId: user.userId!,
        userEmail: user.userEmail || 'Unknown',
        eventCount: user._count.id,
      })),
      topIPs: topIPs.map(ip => ({
        ipAddress: ip.ipAddress || 'Unknown',
        eventCount: ip._count.id,
        riskLevel: ip._count.id > 10 ? 'HIGH' : ip._count.id > 5 ? 'MEDIUM' : 'LOW',
      })),
      recentAlerts: recentAlerts.map(alert => ({
        id: alert.id,
        type: alert.type,
        severity: (alert as any).severity || 'MEDIUM',
        title: alert.title,
        message: alert.message,
        timestamp: alert.timestamp,
        resolved: alert.resolved,
        details: JSON.parse((alert as any).details || '{}'),
      })),
      securityScore,
    };
  }

  /**
   * Get security events with filtering
   */
  async getSecurityEvents(options: {
    startDate?: Date;
    endDate?: Date;
    severity?: string;
    type?: string;
    userId?: number;
    ipAddress?: string;
    limit?: number;
    offset?: number;
  } = {}) {
    const {
      startDate,
      endDate,
      severity,
      type,
      userId,
      ipAddress,
      limit = 100,
      offset = 0,
    } = options;

    const where: any = {};

    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp.gte = startDate;
      if (endDate) where.timestamp.lte = endDate;
    }

    if (severity) where.severity = severity;
    if (type) where.action = type;
    if (userId) where.userId = userId;
    if (ipAddress) where.ipAddress = ipAddress;

    const events = await prisma.securityLog.findMany({
      where,
      orderBy: {
        timestamp: 'desc',
      },
      take: limit,
      skip: offset,
      include: {
        user: {
          select: {
            userId: true,
            email: true,
            userName: true,
          },
        },
      },
    });

    const total = await prisma.securityLog.count({ where });

    return {
      events,
      total,
      hasMore: offset + limit < total,
    };
  }

  /**
   * Resolve a security alert
   */
  async resolveAlert(alertId: string, resolvedBy: number): Promise<boolean> {
    try {
      await prisma.securityAlert.update({
        where: { id: alertId },
        data: {
          resolved: true,
          resolvedBy,
          resolvedAt: new Date(),
        },
      });
      return true;
    } catch (error) {
      console.error('Failed to resolve security alert:', error);
      return false;
    }
  }

  /**
   * Get security dashboard data
   */
  async getSecurityDashboard(): Promise<{
    metrics: SecurityMetrics;
    recentEvents: any[];
    activeAlerts: SecurityAlert[];
    securityTrends: any[];
  }> {
    const [metrics, recentEvents, activeAlerts, securityTrends] = await Promise.all([
      this.getSecurityMetrics(24),
      this.getSecurityEvents({ limit: 20 }),
      this.getActiveAlerts(),
      this.getSecurityTrends(7), // Last 7 days
    ]);

    return {
      metrics,
      recentEvents: recentEvents.events,
      activeAlerts,
      securityTrends,
    };
  }

  /**
   * Get active security alerts
   */
  private async getActiveAlerts(): Promise<SecurityAlert[]> {
    const alerts = await prisma.securityAlert.findMany({
      where: {
        resolved: false,
      },
      orderBy: {
        timestamp: 'desc',
      },
      take: 10,
    });

    return alerts.map(alert => ({
      id: alert.id,
      type: alert.type,
      severity: (alert as any).severity || 'MEDIUM',
      title: alert.title,
      message: alert.message,
      timestamp: alert.timestamp,
      resolved: alert.resolved,
      details: JSON.parse((alert as any).details || '{}'),
    }));
  }

  /**
   * Get security trends
   */
  private async getSecurityTrends(days: number): Promise<any[]> {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    const trends = await prisma.$queryRaw`
      SELECT 
        DATE(timestamp) as date,
        COUNT(*) as total_events,
        COUNT(CASE WHEN severity = 'CRITICAL' THEN 1 END) as critical_events,
        COUNT(CASE WHEN severity = 'HIGH' THEN 1 END) as high_events,
        COUNT(CASE WHEN severity = 'MEDIUM' THEN 1 END) as medium_events,
        COUNT(CASE WHEN severity = 'LOW' THEN 1 END) as low_events
      FROM "SecurityLog"
      WHERE timestamp >= ${startDate}
      GROUP BY DATE(timestamp)
      ORDER BY date
    `;

    return trends as any[];
  }

  /**
   * Update security metrics cache
   */
  private async updateSecurityMetrics(event: SecurityEvent): Promise<void> {
    // This could be implemented with Redis caching
    // For now, we'll just log the event
    console.log('Security metrics updated for event:', event.type);
  }
}

// Singleton instance
export const securityAuditService = new SecurityAuditService();
