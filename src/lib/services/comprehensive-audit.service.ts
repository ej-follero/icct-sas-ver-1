import { prisma } from '@/lib/prisma';

export interface AuditEvent {
  userId?: number;
  userEmail?: string;
  action: string;
  resource: string;
  resourceId?: string | number;
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  category: 'AUTHENTICATION' | 'AUTHORIZATION' | 'DATA_ACCESS' | 'DATA_MODIFICATION' | 'SYSTEM_CHANGE' | 'SECURITY' | 'USER_MANAGEMENT' | 'CONFIGURATION';
}

export interface AuditLog {
  id: string;
  timestamp: Date;
  userId?: number;
  userEmail?: string;
  action: string;
  resource: string;
  resourceId?: string;
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  severity: string;
  category: string;
  success: boolean;
  errorMessage?: string;
}

export interface AuditMetrics {
  totalEvents: number;
  eventsByCategory: Record<string, number>;
  eventsBySeverity: Record<string, number>;
  eventsByUser: Array<{ userId: number; userEmail: string; eventCount: number }>;
  eventsByResource: Record<string, number>;
  successRate: number;
  errorRate: number;
  recentEvents: AuditLog[];
}

export class ComprehensiveAuditService {
  
  /**
   * Log an audit event
   */
  async logEvent(event: AuditEvent): Promise<void> {
    try {
      // Determine if the action was successful based on the event details
      const success = !event.details.error && !event.details.failed;
      
      // Log to system logs
      await prisma.systemLogs.create({
        data: {
          // logLevel: event.severity as any, // Commented out as it's not available in the schema
          module: event.category,
          actionType: event.action,
          userId: event.userId || undefined,
          ipAddress: event.ipAddress || undefined,
          userAgent: event.userAgent || undefined,
          details: JSON.stringify(event.details),
          timestamp: new Date(),
        } as any, // Type assertion for schema compatibility
      });

      // Log to security logs if it's a security-related event
      if (event.category === 'SECURITY' || event.severity === 'HIGH' || event.severity === 'CRITICAL') {
        await prisma.securityLog.create({
          data: {
            level: event.severity,
            module: event.category,
            action: event.action,
            userId: event.userId,
            userEmail: event.userEmail,
            ipAddress: event.ipAddress,
            userAgent: event.userAgent,
            details: JSON.stringify(event.details),
            severity: event.severity,
            eventType: event.action,
            message: `${event.action} on ${event.resource}`,
            timestamp: new Date(),
          } as any, // Type assertion for schema compatibility
        });
      }

      // Log to RFID logs if it's RFID-related
      if (event.resource.includes('RFID') || event.resource.includes('rfid')) {
        await prisma.rFIDLogs.create({
          data: {
            level: event.severity,
            module: event.category,
            action: event.action,
            userId: event.userId,
            userEmail: event.userEmail,
            ipAddress: event.ipAddress,
            userAgent: event.userAgent,
            details: JSON.stringify(event.details),
            severity: event.severity,
            eventType: event.action,
            message: `${event.action} on ${event.resource}`,
            timestamp: new Date(),
          } as any, // Type assertion for schema compatibility
        });
      }

    } catch (error) {
      console.error('Failed to log audit event:', error);
    }
  }

  /**
   * Log authentication event
   */
  async logAuthentication(
    userId: number,
    email: string,
    action: 'LOGIN' | 'LOGOUT' | 'LOGIN_FAILED' | 'PASSWORD_CHANGE' | 'ACCOUNT_LOCKED',
    success: boolean,
    details: Record<string, any> = {},
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.logEvent({
      userId,
      userEmail: email,
      action,
      resource: 'USER_ACCOUNT',
      resourceId: userId.toString(),
      details: {
        ...details,
        success,
        timestamp: new Date().toISOString(),
      },
      ipAddress,
      userAgent,
      severity: success ? 'LOW' : 'MEDIUM',
      category: 'AUTHENTICATION',
    });
  }

  /**
   * Log data access event
   */
  async logDataAccess(
    userId: number,
    email: string,
    resource: string,
    action: 'VIEW' | 'SEARCH' | 'EXPORT' | 'DOWNLOAD',
    resourceId?: string | number,
    details: Record<string, any> = {},
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.logEvent({
      userId,
      userEmail: email,
      action,
      resource,
      resourceId: resourceId?.toString(),
      details: {
        ...details,
        timestamp: new Date().toISOString(),
      },
      ipAddress,
      userAgent,
      severity: 'LOW',
      category: 'DATA_ACCESS',
    });
  }

  /**
   * Log data modification event
   */
  async logDataModification(
    userId: number,
    email: string,
    resource: string,
    action: 'CREATE' | 'UPDATE' | 'DELETE' | 'RESTORE',
    resourceId?: string | number,
    oldValues?: Record<string, any>,
    newValues?: Record<string, any>,
    details: Record<string, any> = {},
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.logEvent({
      userId,
      userEmail: email,
      action,
      resource,
      resourceId: resourceId?.toString(),
      details: {
        ...details,
        oldValues,
        newValues,
        timestamp: new Date().toISOString(),
      },
      ipAddress,
      userAgent,
      severity: 'MEDIUM',
      category: 'DATA_MODIFICATION',
    });
  }

  /**
   * Log system change event
   */
  async logSystemChange(
    userId: number,
    email: string,
    action: string,
    resource: string,
    details: Record<string, any> = {},
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.logEvent({
      userId,
      userEmail: email,
      action,
      resource,
      details: {
        ...details,
        timestamp: new Date().toISOString(),
      },
      ipAddress,
      userAgent,
      severity: 'HIGH',
      category: 'SYSTEM_CHANGE',
    });
  }

  /**
   * Log security event
   */
  async logSecurityEvent(
    userId: number,
    email: string,
    action: string,
    resource: string,
    details: Record<string, any> = {},
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'MEDIUM',
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.logEvent({
      userId,
      userEmail: email,
      action,
      resource,
      details: {
        ...details,
        timestamp: new Date().toISOString(),
      },
      ipAddress,
      userAgent,
      severity,
      category: 'SECURITY',
    });
  }

  /**
   * Get audit logs with filtering
   */
  async getAuditLogs(options: {
    startDate?: Date;
    endDate?: Date;
    userId?: number;
    category?: string;
    severity?: string;
    action?: string;
    resource?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<{ logs: AuditLog[]; total: number; hasMore: boolean }> {
    const {
      startDate,
      endDate,
      userId,
      category,
      severity,
      action,
      resource,
      limit = 100,
      offset = 0,
    } = options;

    const where: any = {};

    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp.gte = startDate;
      if (endDate) where.timestamp.lte = endDate;
    }

    if (userId) where.userId = userId;
    if (category) where.module = category;
    if (severity) where.severity = severity;
    if (action) where.action = action;
    if (resource) where.details = { contains: resource };

    const logs = await prisma.systemLogs.findMany({
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

    const total = await prisma.systemLogs.count({ where });

    const auditLogs: AuditLog[] = logs.map(log => ({
      id: log.id.toString(),
      timestamp: log.timestamp,
      userId: log.userId,
      userEmail: log.user?.email || '',
      action: log.actionType,
      resource: log.module,
      resourceId: log.details ? JSON.parse(log.details).resourceId : undefined,
      details: log.details ? JSON.parse(log.details) : {},
      ipAddress: log.ipAddress || undefined,
      userAgent: log.userAgent || undefined,
      severity: (log as any).logLevel || 'LOW',
      category: log.module,
      success: !log.details || !JSON.parse(log.details).error,
      errorMessage: log.details && JSON.parse(log.details).error ? JSON.parse(log.details).error : undefined,
    }));

    return {
      logs: auditLogs,
      total,
      hasMore: offset + limit < total,
    };
  }

  /**
   * Get audit metrics
   */
  async getAuditMetrics(hours: number = 24): Promise<AuditMetrics> {
    const startTime = new Date(Date.now() - hours * 60 * 60 * 1000);

    // Get total events
    const totalEvents = await prisma.systemLogs.count({
      where: {
        timestamp: { gte: startTime },
      },
    });

    // Get events by category
    const eventsByCategory = await prisma.systemLogs.groupBy({
      by: ['module'],
      where: {
        timestamp: { gte: startTime },
      },
      _count: {
        id: true,
      },
    });

    // Get events by severity - using a different approach since logLevel might not be available
    const eventsBySeverity = await prisma.systemLogs.groupBy({
      by: ['actionType'],
      where: {
        timestamp: { gte: startTime },
      },
      _count: {
        id: true,
      },
    });

    // Get events by user
    const eventsByUser = await prisma.systemLogs.groupBy({
      by: ['userId'],
      where: {
        timestamp: { gte: startTime },
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

    // Get events by resource
    const eventsByResource = await prisma.systemLogs.groupBy({
      by: ['actionType'],
      where: {
        timestamp: { gte: startTime },
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

    // Get recent events
    const recentEvents = await prisma.systemLogs.findMany({
      where: {
        timestamp: { gte: startTime },
      },
      orderBy: {
        timestamp: 'desc',
      },
      take: 20,
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

    // Calculate success rate
    const successfulEvents = await prisma.systemLogs.count({
      where: {
        timestamp: { gte: startTime },
        details: {
          not: {
            contains: '"error"',
          },
        },
      },
    });

    const successRate = totalEvents > 0 ? (successfulEvents / totalEvents) * 100 : 0;
    const errorRate = 100 - successRate;

    return {
      totalEvents,
      eventsByCategory: eventsByCategory.reduce((acc, item) => {
        acc[item.module] = item._count.id;
        return acc;
      }, {} as Record<string, number>),
      eventsBySeverity: eventsBySeverity.reduce((acc, item) => {
        acc[item.actionType] = item._count.id;
        return acc;
      }, {} as Record<string, number>),
      eventsByUser: eventsByUser.map(user => ({
        userId: user.userId!,
        userEmail: 'Unknown', // userEmail not available in groupBy
        eventCount: (user._count as any)?.id || 0,
      })),
      eventsByResource: eventsByResource.reduce((acc, item) => {
        acc[item.actionType] = item._count.id;
        return acc;
      }, {} as Record<string, number>),
      successRate: Math.round(successRate * 100) / 100,
      errorRate: Math.round(errorRate * 100) / 100,
      recentEvents: recentEvents.map(log => ({
        id: log.id.toString(),
        timestamp: log.timestamp,
        userId: log.userId,
        userEmail: log.user?.email || '',
        action: log.actionType,
        resource: log.module,
        resourceId: log.details ? JSON.parse(log.details).resourceId : undefined,
        details: log.details ? JSON.parse(log.details) : {},
        ipAddress: log.ipAddress || undefined,
        userAgent: log.userAgent || undefined,
        severity: (log as any).logLevel || 'LOW',
        category: log.module,
        success: !log.details || !JSON.parse(log.details).error,
        errorMessage: log.details && JSON.parse(log.details).error ? JSON.parse(log.details).error : undefined,
      })),
    };
  }

  /**
   * Export audit logs
   */
  async exportAuditLogs(
    options: {
      startDate?: Date;
      endDate?: Date;
      format: 'CSV' | 'JSON';
      userId?: number;
      category?: string;
    }
  ): Promise<string> {
    const { startDate, endDate, format, userId, category } = options;

    const where: any = {};
    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp.gte = startDate;
      if (endDate) where.timestamp.lte = endDate;
    }
    if (userId) where.userId = userId;
    if (category) where.module = category;

    const logs = await prisma.systemLogs.findMany({
      where,
      orderBy: {
        timestamp: 'desc',
      },
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

    if (format === 'CSV') {
      const csvHeader = 'Timestamp,User ID,User Email,Action,Resource,Severity,Category,IP Address,Details\n';
      const csvRows = logs.map(log => {
        const details = log.details ? JSON.parse(log.details) : {};
        return [
          log.timestamp.toISOString(),
          log.userId || '',
          log.user?.email || '',
          log.actionType,
          log.module,
          (log as any).logLevel || 'LOW',
          log.module,
          log.ipAddress || '',
          JSON.stringify(details),
        ].join(',');
      }).join('\n');
      
      return csvHeader + csvRows;
    } else {
      return JSON.stringify(logs, null, 2);
    }
  }
}

// Singleton instance
export const comprehensiveAuditService = new ComprehensiveAuditService();
