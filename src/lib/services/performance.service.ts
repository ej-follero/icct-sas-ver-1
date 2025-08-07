import { prisma } from '@/lib/prisma';

export interface QueryMetrics {
  query: string;
  duration: number;
  timestamp: Date;
  success: boolean;
  error?: string;
}

export interface PerformanceStats {
  totalQueries: number;
  averageQueryTime: number;
  slowQueries: Array<{ query: string; avgDuration: number; count: number }>;
  errorRate: number;
  cacheHitRate: number;
  activeConnections: number;
}

export interface SystemHealth {
  database: boolean;
  cache: boolean;
  websocket: boolean;
  timestamp: Date;
  uptime: number;
  memoryUsage: NodeJS.MemoryUsage;
  cpuUsage: NodeJS.CpuUsage;
}

export class PerformanceService {
  private queryMetrics: QueryMetrics[] = [];
  private readonly MAX_METRICS = 1000; // Keep last 1000 queries
  private readonly SLOW_QUERY_THRESHOLD = 1000; // 1 second
  private startTime = Date.now();

  recordQuery(query: string, duration: number, success: boolean, error?: string) {
    const metric: QueryMetrics = {
      query: this.sanitizeQuery(query),
      duration,
      timestamp: new Date(),
      success,
      error
    };

    this.queryMetrics.push(metric);

    // Keep only the last MAX_METRICS entries
    if (this.queryMetrics.length > this.MAX_METRICS) {
      this.queryMetrics = this.queryMetrics.slice(-this.MAX_METRICS);
    }

    // Log slow queries
    if (duration > this.SLOW_QUERY_THRESHOLD) {
      console.warn(`Slow query detected: ${duration}ms - ${query.substring(0, 100)}...`);
    }
  }

  getPerformanceStats(): PerformanceStats {
    const totalQueries = this.queryMetrics.length;
    if (totalQueries === 0) {
      return {
        totalQueries: 0,
        averageQueryTime: 0,
        slowQueries: [],
        errorRate: 0,
        cacheHitRate: 0,
        activeConnections: 0
      };
    }

    const successfulQueries = this.queryMetrics.filter(q => q.success);
    const failedQueries = this.queryMetrics.filter(q => !q.success);
    
    const averageQueryTime = successfulQueries.reduce((sum, q) => sum + q.duration, 0) / successfulQueries.length;
    const errorRate = (failedQueries.length / totalQueries) * 100;

    // Group slow queries
    const slowQueriesMap = new Map<string, { totalDuration: number; count: number }>();
    this.queryMetrics
      .filter(q => q.duration > this.SLOW_QUERY_THRESHOLD)
      .forEach(q => {
        const existing = slowQueriesMap.get(q.query) || { totalDuration: 0, count: 0 };
        slowQueriesMap.set(q.query, {
          totalDuration: existing.totalDuration + q.duration,
          count: existing.count + 1
        });
      });

    const slowQueries = Array.from(slowQueriesMap.entries()).map(([query, stats]) => ({
      query,
      avgDuration: stats.totalDuration / stats.count,
      count: stats.count
    })).sort((a, b) => b.avgDuration - a.avgDuration);

    return {
      totalQueries,
      averageQueryTime: Math.round(averageQueryTime * 100) / 100,
      slowQueries: slowQueries.slice(0, 10), // Top 10 slowest queries
      errorRate: Math.round(errorRate * 100) / 100,
      cacheHitRate: 0, // Would be calculated from cache service
      activeConnections: 0 // Would be calculated from websocket service
    };
  }

  async checkSystemHealth(): Promise<SystemHealth> {
    const startTime = process.hrtime.bigint();
    
    // Check database health
    let databaseHealth = false;
    try {
      await prisma.$queryRaw`SELECT 1`;
      databaseHealth = true;
    } catch (error) {
      console.error('Database health check failed:', error);
    }

    // Check cache health (placeholder)
    const cacheHealth = true; // Would check Redis connection

    // Check websocket health (placeholder)
    const websocketHealth = true; // Would check WebSocket server

    const endTime = process.hrtime.bigint();
    const healthCheckDuration = Number(endTime - startTime) / 1000000; // Convert to milliseconds

    return {
      database: databaseHealth,
      cache: cacheHealth,
      websocket: websocketHealth,
      timestamp: new Date(),
      uptime: Date.now() - this.startTime,
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage()
    };
  }

  getQueryAnalytics(timeRange: 'hour' | 'day' | 'week' = 'hour') {
    const now = new Date();
    let cutoffTime: Date;

    switch (timeRange) {
      case 'hour':
        cutoffTime = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case 'day':
        cutoffTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'week':
        cutoffTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
    }

    const recentMetrics = this.queryMetrics.filter(q => q.timestamp >= cutoffTime);
    
    if (recentMetrics.length === 0) {
      return {
        totalQueries: 0,
        averageQueryTime: 0,
        successRate: 100,
        slowQueryCount: 0,
        errorCount: 0
      };
    }

    const successfulQueries = recentMetrics.filter(q => q.success);
    const failedQueries = recentMetrics.filter(q => !q.success);
    const slowQueries = recentMetrics.filter(q => q.duration > this.SLOW_QUERY_THRESHOLD);

    return {
      totalQueries: recentMetrics.length,
      averageQueryTime: successfulQueries.reduce((sum, q) => sum + q.duration, 0) / successfulQueries.length,
      successRate: (successfulQueries.length / recentMetrics.length) * 100,
      slowQueryCount: slowQueries.length,
      errorCount: failedQueries.length
    };
  }

  getTopQueries(limit: number = 10): Array<{ query: string; count: number; avgDuration: number }> {
    const queryStats = new Map<string, { count: number; totalDuration: number }>();

    this.queryMetrics.forEach(metric => {
      const existing = queryStats.get(metric.query) || { count: 0, totalDuration: 0 };
      queryStats.set(metric.query, {
        count: existing.count + 1,
        totalDuration: existing.totalDuration + metric.duration
      });
    });

    return Array.from(queryStats.entries())
      .map(([query, stats]) => ({
        query,
        count: stats.count,
        avgDuration: Math.round((stats.totalDuration / stats.count) * 100) / 100
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  getErrorQueries(limit: number = 10): Array<{ query: string; error: string; count: number; lastOccurrence: Date }> {
    const errorStats = new Map<string, { error: string; count: number; lastOccurrence: Date }>();

    this.queryMetrics
      .filter(q => !q.success && q.error)
      .forEach(metric => {
        const key = `${metric.query}:${metric.error}`;
        const existing = errorStats.get(key);
        errorStats.set(key, {
          error: metric.error!,
          count: (existing?.count || 0) + 1,
          lastOccurrence: metric.timestamp > (existing?.lastOccurrence || new Date(0)) ? metric.timestamp : existing?.lastOccurrence || metric.timestamp
        });
      });

    return Array.from(errorStats.entries())
      .map(([key, stats]) => ({
        query: key.split(':')[0],
        error: stats.error,
        count: stats.count,
        lastOccurrence: stats.lastOccurrence
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  clearMetrics(): void {
    this.queryMetrics = [];
  }

  private sanitizeQuery(query: string): string {
    // Remove sensitive data and limit length
    return query
      .replace(/password\s*=\s*['"][^'"]*['"]/gi, 'password=***')
      .replace(/token\s*=\s*['"][^'"]*['"]/gi, 'token=***')
      .substring(0, 200); // Limit query length for storage
  }

  // Performance monitoring decorator
  static withPerformanceMonitoring<T extends any[], R>(
    target: (...args: T) => Promise<R>,
    queryName?: string
  ): (...args: T) => Promise<R> {
    return async (...args: T): Promise<R> => {
      const startTime = Date.now();
      const query = queryName || target.name || 'unknown';
      
      try {
        const result = await target(...args);
        const duration = Date.now() - startTime;
        
        // Record successful query
        const performanceService = new PerformanceService();
        performanceService.recordQuery(query, duration, true);
        
        return result;
      } catch (error) {
        const duration = Date.now() - startTime;
        
        // Record failed query
        const performanceService = new PerformanceService();
        performanceService.recordQuery(query, duration, false, error instanceof Error ? error.message : 'Unknown error');
        
        throw error;
      }
    };
  }
}

// Global performance service instance
export const performanceService = new PerformanceService(); 