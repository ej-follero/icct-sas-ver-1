import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface AuditLog {
  userId: number;
  actionType: string;
  module: string;
  entityId?: number;
  details: string;
  ipAddress?: string;
  userAgent?: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  category: 'SECURITY' | 'USER_ACTION' | 'SYSTEM' | 'DATA' | 'AUTHENTICATION';
}

export interface AuditFilter {
  userId?: number;
  actionType?: string;
  module?: string;
  severity?: string;
  category?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

export class AuditService {
  // Log security events
  async logSecurityEvent(
    userId: number,
    actionType: string,
    details: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.createAuditLog({
      userId,
      actionType,
      module: 'SECURITY',
      details,
      ipAddress,
      userAgent,
      severity: 'HIGH',
      category: 'SECURITY',
    });
  }

  // Log authentication events
  async logAuthEvent(
    userId: number,
    actionType: 'LOGIN' | 'LOGOUT' | 'LOGIN_FAILED' | 'PASSWORD_RESET' | 'PASSWORD_CHANGE',
    details: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.createAuditLog({
      userId,
      actionType,
      module: 'AUTHENTICATION',
      details,
      ipAddress,
      userAgent,
      severity: 'MEDIUM',
      category: 'AUTHENTICATION',
    });
  }

  // Log user actions
  async logUserAction(
    userId: number,
    actionType: string,
    module: string,
    details: string,
    entityId?: number,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.createAuditLog({
      userId,
      actionType,
      module,
      details,
      entityId,
      ipAddress,
      userAgent,
      severity: 'LOW',
      category: 'USER_ACTION',
    });
  }

  // Log data access events
  async logDataAccess(
    userId: number,
    actionType: 'READ' | 'WRITE' | 'DELETE' | 'EXPORT' | 'IMPORT',
    module: string,
    details: string,
    entityId?: number,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.createAuditLog({
      userId,
      actionType,
      module,
      details,
      entityId,
      ipAddress,
      userAgent,
      severity: 'MEDIUM',
      category: 'DATA',
    });
  }

  // Log system events
  async logSystemEvent(
    actionType: string,
    module: string,
    details: string,
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'MEDIUM'
  ): Promise<void> {
    await this.createAuditLog({
      userId: 0, // System user
      actionType,
      module,
      details,
      severity,
      category: 'SYSTEM',
    });
  }

  // Create audit log entry
  private async createAuditLog(auditLog: AuditLog): Promise<void> {
    try {
      // Skip audit log if userId is 0 (failed login attempts)
      if (auditLog.userId === 0) {
        console.log(`Audit log skipped for failed login: ${auditLog.details}`);
        return;
      }
      
      await prisma.systemLogs.create({
        data: {
          userId: auditLog.userId,
          actionType: auditLog.actionType,
          module: auditLog.module,
          entityId: auditLog.entityId,
          details: `${auditLog.category}: ${auditLog.details}`,
          ipAddress: auditLog.ipAddress,
          userAgent: auditLog.userAgent,
          timestamp: new Date(),
        },
      });
    } catch (error) {
      console.error('Error creating audit log:', error);
    }
  }

  // Get audit logs with filters
  async getAuditLogs(filter: AuditFilter = {}): Promise<{
    logs: any[];
    total: number;
    page: number;
    limit: number;
  }> {
    try {
      const where: any = {};

      if (filter.userId) where.userId = filter.userId;
      if (filter.actionType) where.actionType = filter.actionType;
      if (filter.module) where.module = filter.module;
      if (filter.startDate || filter.endDate) {
        where.timestamp = {};
        if (filter.startDate) where.timestamp.gte = filter.startDate;
        if (filter.endDate) where.timestamp.lte = filter.endDate;
      }

      const total = await prisma.systemLogs.count({ where });
      const logs = await prisma.systemLogs.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        take: filter.limit || 50,
        skip: filter.offset || 0,
        include: {
          user: {
            select: {
              userName: true,
              email: true,
              role: true,
            },
          },
        },
      });

      return {
        logs,
        total,
        page: Math.floor((filter.offset || 0) / (filter.limit || 50)) + 1,
        limit: filter.limit || 50,
      };
    } catch (error) {
      console.error('Error getting audit logs:', error);
      return { logs: [], total: 0, page: 1, limit: 50 };
    }
  }

  // Get security events
  async getSecurityEvents(limit: number = 100): Promise<any[]> {
    try {
      return await prisma.systemLogs.findMany({
        where: {
          module: 'SECURITY',
        },
        orderBy: { timestamp: 'desc' },
        take: limit,
        include: {
          user: {
            select: {
              userName: true,
              email: true,
              role: true,
            },
          },
        },
      });
    } catch (error) {
      console.error('Error getting security events:', error);
      return [];
    }
  }

  // Get authentication events
  async getAuthEvents(limit: number = 100): Promise<any[]> {
    try {
      return await prisma.systemLogs.findMany({
        where: {
          module: 'AUTHENTICATION',
        },
        orderBy: { timestamp: 'desc' },
        take: limit,
        include: {
          user: {
            select: {
              userName: true,
              email: true,
              role: true,
            },
          },
        },
      });
    } catch (error) {
      console.error('Error getting auth events:', error);
      return [];
    }
  }

  // Get failed login attempts
  async getFailedLoginAttempts(userId?: number, hours: number = 24): Promise<any[]> {
    try {
      const where: any = {
        actionType: 'LOGIN_FAILED',
        timestamp: {
          gte: new Date(Date.now() - hours * 60 * 60 * 1000),
        },
      };

      if (userId) where.userId = userId;

      return await prisma.systemLogs.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        include: {
          user: {
            select: {
              userName: true,
              email: true,
              role: true,
            },
          },
        },
      });
    } catch (error) {
      console.error('Error getting failed login attempts:', error);
      return [];
    }
  }

  // Get user activity summary
  async getUserActivitySummary(userId: number, days: number = 30): Promise<{
    totalActions: number;
    lastActivity: Date | null;
    actionTypes: Record<string, number>;
    modules: Record<string, number>;
  }> {
    try {
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

      const logs = await prisma.systemLogs.findMany({
        where: {
          userId,
          timestamp: {
            gte: startDate,
          },
        },
        select: {
          actionType: true,
          module: true,
          timestamp: true,
        },
      });

      const actionTypes: Record<string, number> = {};
      const modules: Record<string, number> = {};
      let lastActivity: Date | null = null;

      logs.forEach(log => {
        actionTypes[log.actionType] = (actionTypes[log.actionType] || 0) + 1;
        modules[log.module] = (modules[log.module] || 0) + 1;
        
        if (!lastActivity || log.timestamp > lastActivity) {
          lastActivity = log.timestamp;
        }
      });

      return {
        totalActions: logs.length,
        lastActivity,
        actionTypes,
        modules,
      };
    } catch (error) {
      console.error('Error getting user activity summary:', error);
      return {
        totalActions: 0,
        lastActivity: null,
        actionTypes: {},
        modules: {},
      };
    }
  }

  // Get system health metrics
  async getSystemHealthMetrics(): Promise<{
    totalLogs: number;
    securityEvents: number;
    authEvents: number;
    dataAccessEvents: number;
    systemEvents: number;
    recentActivity: any[];
  }> {
    try {
      const [totalLogs, securityEvents, authEvents, dataAccessEvents, systemEvents, recentActivity] = await Promise.all([
        prisma.systemLogs.count(),
        prisma.systemLogs.count({ where: { module: 'SECURITY' } }),
        prisma.systemLogs.count({ where: { module: 'AUTHENTICATION' } }),
        prisma.systemLogs.count({ where: { module: { in: ['USER', 'ATTENDANCE', 'COURSE'] } } }),
        prisma.systemLogs.count({ where: { module: 'SYSTEM' } }),
        prisma.systemLogs.findMany({
          orderBy: { timestamp: 'desc' },
          take: 10,
          include: {
            user: {
              select: {
                userName: true,
                email: true,
                role: true,
              },
            },
          },
        }),
      ]);

      return {
        totalLogs,
        securityEvents,
        authEvents,
        dataAccessEvents,
        systemEvents,
        recentActivity,
      };
    } catch (error) {
      console.error('Error getting system health metrics:', error);
      return {
        totalLogs: 0,
        securityEvents: 0,
        authEvents: 0,
        dataAccessEvents: 0,
        systemEvents: 0,
        recentActivity: [],
      };
    }
  }

  // Clean old audit logs (retention policy)
  async cleanOldLogs(daysToKeep: number = 365): Promise<number> {
    try {
      const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);
      
      const result = await prisma.systemLogs.deleteMany({
        where: {
          timestamp: {
            lt: cutoffDate,
          },
        },
      });

      return result.count;
    } catch (error) {
      console.error('Error cleaning old logs:', error);
      return 0;
    }
  }
}

// Export singleton instance
export const auditService = new AuditService(); 