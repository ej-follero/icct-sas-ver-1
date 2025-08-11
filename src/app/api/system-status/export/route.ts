import { NextResponse } from 'next/server';
import { performanceService } from '@/lib/services/performance.service';
import { AttendanceService } from '@/lib/services/attendance.service';

export async function POST(request: Request) {
  try {
    const { format = 'json', includeDetails = true, dateRange } = await request.json();
    
    // Get system health data
    const systemHealth = await performanceService.checkSystemHealth();
    const performanceStats = performanceService.getPerformanceStats();
    const attendanceService = new AttendanceService();
    const cacheStats = attendanceService.getCacheStats();
    
    // Get analytics data
    const hourlyAnalytics = performanceService.getQueryAnalytics('hour');
    const dailyAnalytics = performanceService.getQueryAnalytics('day');
    const topQueries = performanceService.getTopQueries(10);
    const errorQueries = performanceService.getErrorQueries(10);
    
    const exportData = {
      exportInfo: {
        generatedAt: new Date().toISOString(),
        format,
        includeDetails,
        dateRange
      },
      systemStatus: {
        status: systemHealth.database && systemHealth.cache ? 'healthy' : 'degraded',
        timestamp: new Date().toISOString(),
        uptime: `${Math.round(systemHealth.uptime / 1000 / 60)} minutes`,
        services: {
          database: systemHealth.database ? 'healthy' : 'unhealthy',
          cache: systemHealth.cache ? 'healthy' : 'unhealthy',
          websocket: systemHealth.websocket ? 'healthy' : 'unhealthy'
        }
      },
      performance: {
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
        }
      },
      analytics: includeDetails ? {
        hourly: hourlyAnalytics,
        daily: dailyAnalytics,
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
        }))
      } : undefined
    };

    let responseData: any;
    let contentType: string;
    let filename: string;

    switch (format.toLowerCase()) {
      case 'csv':
        responseData = convertToCSV(exportData);
        contentType = 'text/csv';
        filename = `system-status-${new Date().toISOString().split('T')[0]}.csv`;
        break;
      
      case 'pdf':
        responseData = await generatePDF(exportData);
        contentType = 'application/pdf';
        filename = `system-status-${new Date().toISOString().split('T')[0]}.pdf`;
        break;
      
      case 'json':
      default:
        responseData = JSON.stringify(exportData, null, 2);
        contentType = 'application/json';
        filename = `system-status-${new Date().toISOString().split('T')[0]}.json`;
        break;
    }

    const response = new NextResponse(responseData);
    response.headers.set('Content-Type', contentType);
    response.headers.set('Content-Disposition', `attachment; filename="${filename}"`);
    
    return response;

  } catch (error) {
    console.error('Export failed:', error);
    return NextResponse.json(
      { error: 'Export failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

function convertToCSV(data: any): string {
  const lines: string[] = [];
  
  // System Status
  lines.push('System Status Report');
  lines.push(`Generated: ${data.exportInfo.generatedAt}`);
  lines.push('');
  
  lines.push('Overall Status');
  lines.push('Status,Value');
  lines.push(`System Status,${data.systemStatus.status}`);
  lines.push(`Uptime,${data.systemStatus.uptime}`);
  lines.push(`Database,${data.systemStatus.services.database}`);
  lines.push(`Cache,${data.systemStatus.services.cache}`);
  lines.push(`WebSocket,${data.systemStatus.services.websocket}`);
  lines.push('');
  
  // Performance
  lines.push('Performance Metrics');
  lines.push('Metric,Value');
  lines.push(`Total Queries,${data.performance.queryStats.totalQueries}`);
  lines.push(`Average Query Time,${data.performance.queryStats.averageQueryTime}`);
  lines.push(`Error Rate,${data.performance.queryStats.errorRate}`);
  lines.push(`Slow Queries,${data.performance.queryStats.slowQueries}`);
  lines.push(`Memory RSS,${data.performance.memoryUsage.rss}`);
  lines.push(`Memory Heap Used,${data.performance.memoryUsage.heapUsed}`);
  lines.push(`Memory Heap Total,${data.performance.memoryUsage.heapTotal}`);
  lines.push('');
  
  // Analytics (if included)
  if (data.analytics) {
    lines.push('Hourly Analytics');
    lines.push('Metric,Value');
    lines.push(`Total Queries,${data.analytics.hourly.totalQueries}`);
    lines.push(`Average Query Time,${data.analytics.hourly.averageQueryTime}ms`);
    lines.push(`Success Rate,${data.analytics.hourly.successRate}%`);
    lines.push(`Slow Query Count,${data.analytics.hourly.slowQueryCount}`);
    lines.push(`Error Count,${data.analytics.hourly.errorCount}`);
    lines.push('');
    
    lines.push('Daily Analytics');
    lines.push('Metric,Value');
    lines.push(`Total Queries,${data.analytics.daily.totalQueries}`);
    lines.push(`Average Query Time,${data.analytics.daily.averageQueryTime}ms`);
    lines.push(`Success Rate,${data.analytics.daily.successRate}%`);
    lines.push(`Slow Query Count,${data.analytics.daily.slowQueryCount}`);
    lines.push(`Error Count,${data.analytics.daily.errorCount}`);
    lines.push('');
    
    // Top Queries
    if (data.analytics.topQueries.length > 0) {
      lines.push('Top Queries');
      lines.push('Query,Count,Average Duration');
      data.analytics.topQueries.forEach((q: any) => {
        lines.push(`"${q.query}",${q.count},${q.avgDuration}`);
      });
      lines.push('');
    }
    
    // Error Queries
    if (data.analytics.errorQueries.length > 0) {
      lines.push('Error Queries');
      lines.push('Query,Error,Count,Last Occurrence');
      data.analytics.errorQueries.forEach((q: any) => {
        lines.push(`"${q.query}","${q.error}",${q.count},${q.lastOccurrence}`);
      });
    }
  }
  
  return lines.join('\n');
}

async function generatePDF(data: any): Promise<Buffer> {
  // This is a simplified PDF generation
  // In a real implementation, you'd use a library like puppeteer or jsPDF
  
  const pdfContent = `
    System Status Report
    Generated: ${data.exportInfo.generatedAt}
    
    Overall Status:
    - System Status: ${data.systemStatus.status}
    - Uptime: ${data.systemStatus.uptime}
    - Database: ${data.systemStatus.services.database}
    - Cache: ${data.systemStatus.services.cache}
    - WebSocket: ${data.systemStatus.services.websocket}
    
    Performance Metrics:
    - Total Queries: ${data.performance.queryStats.totalQueries}
    - Average Query Time: ${data.performance.queryStats.averageQueryTime}
    - Error Rate: ${data.performance.queryStats.errorRate}
    - Slow Queries: ${data.performance.queryStats.slowQueries}
  `;
  
  // Return a simple text-based PDF (in real implementation, use proper PDF library)
  return Buffer.from(pdfContent, 'utf-8');
}
