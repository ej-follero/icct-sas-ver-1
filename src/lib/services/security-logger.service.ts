import { prisma } from '@/lib/prisma';

export interface SecurityEvent {
  eventType: 'LOGIN_ATTEMPT' | 'LOGIN_SUCCESS' | 'LOGIN_FAILED' | 'LOGOUT' | 'PASSWORD_CHANGE' | 'SETTINGS_UPDATE' | 'SUSPICIOUS_ACTIVITY' | 'SECURITY_ALERT' | 'ALERT_RESOLVED' | 'ACCESS_DENIED' | 'USER_CREATED' | 'USER_DELETED' | 'ROLE_CHANGE';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  userId?: number;
  ipAddress?: string;
  userAgent?: string;
  details?: any;
}

export class SecurityLogger {
  static async logEvent(event: SecurityEvent): Promise<boolean> {
    try {
      await prisma.securityLog.create({
        data: {
          eventType: event.eventType,
          severity: event.severity,
          message: event.description,
          level: event.severity,
          module: 'SECURITY',
          action: event.eventType,
          userId: event.userId || null,
          ipAddress: event.ipAddress || null,
          userAgent: event.userAgent || null,
          details: event.details || null,
        } as any, // Type assertion to handle schema differences
      });
      return true;
    } catch (error) {
      console.error('Failed to log security event:', error);
      // Don't throw error to prevent breaking the main application flow
      return false;
    }
  }

  static async logLoginAttempt(userId: number, success: boolean, ipAddress?: string, userAgent?: string): Promise<boolean> {
    const event: SecurityEvent = {
      eventType: success ? 'LOGIN_SUCCESS' : 'LOGIN_FAILED',
      severity: success ? 'LOW' : 'HIGH',
      description: success ? 'User login successful' : 'Failed login attempt',
      userId,
      ipAddress,
      userAgent,
      details: {
        success,
        timestamp: new Date().toISOString(),
      },
    };

    return await this.logEvent(event);
  }

  static async logLogout(userId: number, ipAddress?: string): Promise<boolean> {
    const event: SecurityEvent = {
      eventType: 'LOGOUT',
      severity: 'LOW',
      description: 'User logout',
      userId,
      ipAddress,
      details: {
        timestamp: new Date().toISOString(),
      },
    };

    return await this.logEvent(event);
  }

  static async logPasswordChange(userId: number, ipAddress?: string): Promise<boolean> {
    const event: SecurityEvent = {
      eventType: 'PASSWORD_CHANGE',
      severity: 'MEDIUM',
      description: 'Password changed',
      userId,
      ipAddress,
      details: {
        timestamp: new Date().toISOString(),
      },
    };

    return await this.logEvent(event);
  }

  static async logSettingsUpdate(userId: number, settingsChanged: string[], ipAddress?: string): Promise<boolean> {
    const event: SecurityEvent = {
      eventType: 'SETTINGS_UPDATE',
      severity: 'MEDIUM',
      description: 'Security settings updated',
      userId,
      ipAddress,
      details: {
        settingsChanged,
        timestamp: new Date().toISOString(),
      },
    };

    return await this.logEvent(event);
  }

  static async logSuspiciousActivity(userId: number, activity: string, ipAddress?: string, userAgent?: string): Promise<boolean> {
    const event: SecurityEvent = {
      eventType: 'SUSPICIOUS_ACTIVITY',
      severity: 'HIGH',
      description: `Suspicious activity detected: ${activity}`,
      userId,
      ipAddress,
      userAgent,
      details: {
        activity,
        timestamp: new Date().toISOString(),
      },
    };

    return await this.logEvent(event);
  }

  static async logSecurityAlert(data: {
    alertId: string;
    alertType: string;
    message: string;
    userId?: number;
    ipAddress?: string;
  }): Promise<boolean> {
    const event: SecurityEvent = {
      eventType: 'SECURITY_ALERT',
      severity: 'HIGH',
      description: `Security alert: ${data.message}`,
      userId: data.userId,
      ipAddress: data.ipAddress,
      details: {
        alertId: data.alertId,
        alertType: data.alertType,
        timestamp: new Date().toISOString(),
      },
    };

    return await this.logEvent(event);
  }

  static async logAlertResolved(data: {
    alertId: string;
    resolvedBy: number;
    resolutionNotes?: string;
  }): Promise<boolean> {
    const event: SecurityEvent = {
      eventType: 'ALERT_RESOLVED',
      severity: 'LOW',
      description: `Security alert ${data.alertId} resolved`,
      userId: data.resolvedBy,
      details: {
        alertId: data.alertId,
        resolutionNotes: data.resolutionNotes,
        timestamp: new Date().toISOString(),
      },
    };

    return await this.logEvent(event);
  }

  static async logAccessDenied(userId: number, resource: string, ipAddress?: string): Promise<boolean> {
    const event: SecurityEvent = {
      eventType: 'ACCESS_DENIED',
      severity: 'HIGH',
      description: `Access denied to ${resource}`,
      userId,
      ipAddress,
      details: {
        resource,
        timestamp: new Date().toISOString(),
      },
    };

    return await this.logEvent(event);
  }

  static async logUserCreated(userId: number, createdBy: number, ipAddress?: string): Promise<boolean> {
    const event: SecurityEvent = {
      eventType: 'USER_CREATED',
      severity: 'MEDIUM',
      description: 'New user created',
      userId,
      ipAddress,
      details: {
        createdBy,
        timestamp: new Date().toISOString(),
      },
    };

    return await this.logEvent(event);
  }

  static async logUserDeleted(userId: number, deletedBy: number, ipAddress?: string): Promise<boolean> {
    const event: SecurityEvent = {
      eventType: 'USER_DELETED',
      severity: 'HIGH',
      description: 'User deleted',
      userId,
      ipAddress,
      details: {
        deletedBy,
        timestamp: new Date().toISOString(),
      },
    };

    return await this.logEvent(event);
  }

  static async logRoleChange(userId: number, oldRole: string, newRole: string, changedBy: number, ipAddress?: string): Promise<boolean> {
    const event: SecurityEvent = {
      eventType: 'ROLE_CHANGE',
      severity: 'HIGH',
      description: `User role changed from ${oldRole} to ${newRole}`,
      userId,
      ipAddress,
      details: {
        oldRole,
        newRole,
        changedBy,
        timestamp: new Date().toISOString(),
      },
    };

    return await this.logEvent(event);
  }

  // Get recent security events
  static async getRecentEvents(limit: number = 50): Promise<any[]> {
    try {
      return await prisma.securityLog.findMany({
        orderBy: { timestamp: 'desc' },
        take: limit,
        include: {
          user: {
            select: {
              userId: true,
              userName: true,
              email: true,
            },
          },
        },
      });
    } catch (error) {
      console.error('Failed to get recent security events:', error);
      return [];
    }
  }

  // Get security statistics
  static async getSecurityStats(days: number = 30): Promise<any[]> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const stats = await prisma.securityLog.groupBy({
        by: ['eventType', 'severity'],
        where: {
          timestamp: {
            gte: startDate,
          },
        },
        _count: {
          id: true,
        },
      });

      return stats;
    } catch (error) {
      console.error('Failed to get security statistics:', error);
      return [];
    }
  }
} 