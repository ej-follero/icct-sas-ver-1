import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { performanceService } from '@/lib/services/performance.service';

export async function GET() {
  try {
    const startTime = Date.now();
    
    // Check database connectivity
    let databaseStatus = 'healthy';
    let databaseResponseTime = 0;
    try {
      const dbStart = Date.now();
      await prisma.$queryRaw`SELECT 1`;
      databaseResponseTime = Date.now() - dbStart;
    } catch (error) {
      databaseStatus = 'unhealthy';
      console.error('Database health check failed:', error);
    }

    // Check cache system (Redis)
    let cacheStatus = 'healthy';
    let cacheSize = 0;
    let cacheKeys = 0;
    try {
      // TODO: Implement real Redis health check
      // const redis = new Redis(process.env.REDIS_URL);
      // await redis.ping();
      // cacheSize = await redis.memory('usage');
      // cacheKeys = await redis.dbsize();
    } catch (error) {
      cacheStatus = 'unhealthy';
      console.error('Cache health check failed:', error);
    }

    // Check WebSocket server
    let websocketStatus = 'healthy';
    let activeConnections = 0;
    try {
      // TODO: Implement real WebSocket health check
      // activeConnections = await getWebSocketConnections();
    } catch (error) {
      websocketStatus = 'unhealthy';
      console.error('WebSocket health check failed:', error);
    }

    // Get system performance metrics
    const memoryUsage = process.memoryUsage();
    const uptime = process.uptime();
    
    // Get query statistics
    const queryStats = await getQueryStatistics();
    
    const responseTime = Date.now() - startTime;
    
    const health = {
      status: databaseStatus === 'healthy' && cacheStatus === 'healthy' ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      responseTime: `${responseTime}ms`,
      
      services: {
        database: {
          status: databaseStatus,
          responseTime: databaseStatus === 'healthy' ? `< ${databaseResponseTime}ms` : 'timeout'
        },
        cache: {
          status: cacheStatus,
          cacheSize: `${Math.round(cacheSize / 1024 / 1024)} MB`,
          cacheKeys: cacheKeys
        },
        websocket: {
          status: websocketStatus,
          activeConnections: activeConnections
        }
      },
      
      performance: {
        uptime: `${Math.round(uptime / 60)} minutes`,
        memoryUsage: {
          rss: `${Math.round(memoryUsage.rss / 1024 / 1024)} MB`,
          heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)} MB`,
          heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)} MB`,
          external: `${Math.round(memoryUsage.external / 1024 / 1024)} MB`
        },
        cpuUsage: {
          user: `${Math.round(process.cpuUsage().user / 1000)}ms`,
          system: `${Math.round(process.cpuUsage().system / 1000)}ms`
        },
        queryStats: {
          totalQueries: queryStats.totalQueries,
          averageQueryTime: `${queryStats.averageQueryTime}ms`,
          errorRate: `${queryStats.errorRate}%`,
          slowQueries: queryStats.slowQueries
        }
      },
      
      recommendations: generateRecommendations(databaseStatus, cacheStatus, queryStats)
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

async function getQueryStatistics() {
  try {
    // Get query statistics from database
    const stats = await prisma.$queryRaw`
      SELECT 
        COUNT(*) as total_queries,
        AVG(EXTRACT(EPOCH FROM (end_time - start_time)) * 1000) as avg_query_time,
        COUNT(CASE WHEN status = 'error' THEN 1 END) * 100.0 / COUNT(*) as error_rate,
        COUNT(CASE WHEN EXTRACT(EPOCH FROM (end_time - start_time)) > 1 THEN 1 END) as slow_queries
      FROM query_logs 
      WHERE created_at > NOW() - INTERVAL '1 hour'
    `;
    
    return {
      totalQueries: stats[0]?.total_queries || 0,
      averageQueryTime: Math.round(stats[0]?.avg_query_time || 0),
      errorRate: Math.round(stats[0]?.error_rate || 0),
      slowQueries: stats[0]?.slow_queries || 0
    };
  } catch (error) {
    console.error('Error getting query statistics:', error);
    return {
      totalQueries: 0,
      averageQueryTime: 0,
      errorRate: 0,
      slowQueries: 0
    };
  }
}

function generateRecommendations(databaseStatus: string, cacheStatus: string, queryStats: any): string[] {
  const recommendations: string[] = [];
  
  if (databaseStatus !== 'healthy') {
    recommendations.push('Database connectivity issues detected. Check database server status.');
  }
  
  if (cacheStatus !== 'healthy') {
    recommendations.push('Cache system issues detected. Check Redis server status.');
  }
  
  if (queryStats.errorRate > 5) {
    recommendations.push('High error rate detected. Review recent error logs and database connectivity.');
  }
  
  if (queryStats.slowQueries > 0) {
    recommendations.push('Slow queries detected. Consider adding database indexes or optimizing query patterns.');
  }
  
  if (queryStats.averageQueryTime > 500) {
    recommendations.push('Average query time is high. Consider query optimization.');
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
    await prisma.$queryRaw`SELECT 1`;
    
    const response = new NextResponse(null, { status: 200 });
    response.headers.set('X-Health-Check', 'true');
    response.headers.set('X-Timestamp', new Date().toISOString());
    
    return response;
  } catch (error) {
    return new NextResponse(null, { status: 503 });
  }
}