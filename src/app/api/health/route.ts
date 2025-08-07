import { NextResponse } from 'next/server';
import { performanceService } from '@/lib/services/performance.service';
import { AttendanceService } from '@/lib/services/attendance.service';

export async function GET() {
  try {
    const startTime = Date.now();
    
    // Get system health
    const systemHealth = await performanceService.checkSystemHealth();
    
    // Get performance stats
    const performanceStats = performanceService.getPerformanceStats();
    
    // Get attendance service cache stats
    const attendanceService = new AttendanceService();
    const cacheStats = attendanceService.getCacheStats();
    
    // Get recent query analytics
    const hourlyAnalytics = performanceService.getQueryAnalytics('hour');
    const dailyAnalytics = performanceService.getQueryAnalytics('day');
    
    // Get top queries and error queries
    const topQueries = performanceService.getTopQueries(5);
    const errorQueries = performanceService.getErrorQueries(5);
    
    const responseTime = Date.now() - startTime;
    
    const health = {
      status: systemHealth.database && systemHealth.cache ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      responseTime: `${responseTime}ms`,
      
      services: {
        database: {
          status: systemHealth.database ? 'healthy' : 'unhealthy',
          responseTime: systemHealth.database ? '< 10ms' : 'timeout'
        },
        cache: {
          status: systemHealth.cache ? 'healthy' : 'unhealthy',
          cacheSize: cacheStats.size,
          cacheKeys: cacheStats.keys.length
        },
        websocket: {
          status: systemHealth.websocket ? 'healthy' : 'unhealthy',
          activeConnections: performanceStats.activeConnections
        }
      },
      
      performance: {
        uptime: `${Math.round(systemHealth.uptime / 1000 / 60)} minutes`,
        memoryUsage: {
          rss: `${Math.round(systemHealth.memoryUsage.rss / 1024 / 1024)} MB`,
          heapTotal: `${Math.round(systemHealth.memoryUsage.heapTotal / 1024 / 1024)} MB`,
          heapUsed: `${Math.round(systemHealth.memoryUsage.heapUsed / 1024 / 1024)} MB`,
          external: `${Math.round(systemHealth.memoryUsage.external / 1024 / 1024)} MB`
        },
        cpuUsage: {
          user: `${Math.round(systemHealth.cpuUsage.user / 1000)}ms`,
          system: `${Math.round(systemHealth.cpuUsage.system / 1000)}ms`
        },
        queryStats: {
          totalQueries: performanceStats.totalQueries,
          averageQueryTime: `${performanceStats.averageQueryTime}ms`,
          errorRate: `${performanceStats.errorRate}%`,
          slowQueries: performanceStats.slowQueries.length
        },
        analytics: {
          hourly: {
            totalQueries: hourlyAnalytics.totalQueries,
            averageQueryTime: `${hourlyAnalytics.averageQueryTime}ms`,
            successRate: `${hourlyAnalytics.successRate}%`,
            slowQueryCount: hourlyAnalytics.slowQueryCount,
            errorCount: hourlyAnalytics.errorCount
          },
          daily: {
            totalQueries: dailyAnalytics.totalQueries,
            averageQueryTime: `${dailyAnalytics.averageQueryTime}ms`,
            successRate: `${dailyAnalytics.successRate}%`,
            slowQueryCount: dailyAnalytics.slowQueryCount,
            errorCount: dailyAnalytics.errorCount
          }
        }
      },
      
      topQueries: topQueries.map(q => ({
        query: q.query.substring(0, 100) + (q.query.length > 100 ? '...' : ''),
        count: q.count,
        avgDuration: `${q.avgDuration}ms`
      })),
      
      errorQueries: errorQueries.map(q => ({
        query: q.query.substring(0, 100) + (q.query.length > 100 ? '...' : ''),
        error: q.error,
        count: q.count,
        lastOccurrence: q.lastOccurrence.toISOString()
      })),
      
      slowQueries: performanceStats.slowQueries.map(q => ({
        query: q.query.substring(0, 100) + (q.query.length > 100 ? '...' : ''),
        avgDuration: `${q.avgDuration}ms`,
        count: q.count
      })),
      
      recommendations: generateRecommendations(performanceStats, hourlyAnalytics, dailyAnalytics)
    };

    const response = NextResponse.json(health);
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    response.headers.set('X-Health-Check', 'true');
    
    return response;

  } catch (error) {
    console.error('Health check failed:', error);
    
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Health check failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 503 }
    );
  }
}

function generateRecommendations(
  performanceStats: any,
  hourlyAnalytics: any,
  dailyAnalytics: any
): string[] {
  const recommendations: string[] = [];
  
  // Check for high error rates
  if (performanceStats.errorRate > 5) {
    recommendations.push('High error rate detected. Review recent error logs and database connectivity.');
  }
  
  // Check for slow queries
  if (performanceStats.slowQueries.length > 0) {
    recommendations.push('Slow queries detected. Consider adding database indexes or optimizing query patterns.');
  }
  
  // Check for memory usage
  const memoryUsage = process.memoryUsage();
  const memoryUsagePercent = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;
  if (memoryUsagePercent > 80) {
    recommendations.push('High memory usage detected. Consider implementing memory optimization or increasing heap size.');
  }
  
  // Check for query volume
  if (hourlyAnalytics.totalQueries > 1000) {
    recommendations.push('High query volume detected. Consider implementing query caching or connection pooling.');
  }
  
  // Check for cache effectiveness
  if (performanceStats.cacheHitRate < 50) {
    recommendations.push('Low cache hit rate. Consider expanding cache coverage or adjusting cache policies.');
  }
  
  if (recommendations.length === 0) {
    recommendations.push('System performance is optimal. No immediate actions required.');
  }
  
  return recommendations;
}

// Simple health check for load balancers
export async function HEAD() {
  try {
    // Quick database check
    const { prisma } = await import('@/lib/prisma');
    await prisma.$queryRaw`SELECT 1`;
    
    const response = new NextResponse(null, { status: 200 });
    response.headers.set('X-Health-Check', 'true');
    response.headers.set('X-Timestamp', new Date().toISOString());
    
    return response;
  } catch (error) {
    return new NextResponse(null, { status: 503 });
  }
} 