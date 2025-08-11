import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'json';
    const search = searchParams.get('search') || '';
    const level = searchParams.get('level') || '';
    const moduleFilter = searchParams.get('module') || '';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build where clause
    const where: any = {};

    if (search) {
      where.OR = [
        { actionType: { contains: search, mode: 'insensitive' } },
        { module: { contains: search, mode: 'insensitive' } },
        { details: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (level && level !== 'all') {
      // Map level to actionType patterns
      const levelPatterns = {
        'ERROR': { contains: 'error', mode: 'insensitive' },
        'WARNING': { contains: 'warning', mode: 'insensitive' },
        'INFO': { contains: 'info', mode: 'insensitive' },
        'DEBUG': { contains: 'debug', mode: 'insensitive' }
      };
      if (levelPatterns[level as keyof typeof levelPatterns]) {
        where.actionType = levelPatterns[level as keyof typeof levelPatterns];
      }
    }

    if (moduleFilter && moduleFilter !== 'all') {
      where.module = moduleFilter;
    }

    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) {
        where.timestamp.gte = new Date(startDate);
      }
      if (endDate) {
        where.timestamp.lte = new Date(endDate);
      }
    }

    // Get logs
    const logs = await prisma.systemLogs.findMany({
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

    // Transform logs for export
    const exportLogs = logs.map(log => ({
      id: log.id,
      timestamp: log.timestamp.toISOString(),
      level: determineLogLevel(log.actionType),
      module: log.module,
      action: log.actionType,
      userId: log.userId,
      userEmail: log.user?.email || 'Unknown',
      ipAddress: log.ipAddress || 'Unknown',
      userAgent: log.userAgent || 'Unknown',
      details: log.details || '',
    }));

    let responseData: any;
    let contentType: string;
    let filename: string;

    switch (format.toLowerCase()) {
      case 'csv':
        responseData = convertLogsToCSV(exportLogs);
        contentType = 'text/csv';
        filename = `system-logs-${new Date().toISOString().split('T')[0]}.csv`;
        break;
      
      case 'json':
      default:
        responseData = JSON.stringify(exportLogs, null, 2);
        contentType = 'application/json';
        filename = `system-logs-${new Date().toISOString().split('T')[0]}.json`;
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

function determineLogLevel(actionType: string): string {
  const lowerAction = actionType.toLowerCase();
  if (lowerAction.includes('error') || lowerAction.includes('fail')) return 'ERROR';
  if (lowerAction.includes('warn')) return 'WARNING';
  if (lowerAction.includes('debug')) return 'DEBUG';
  return 'INFO';
}

function convertLogsToCSV(logs: any[]): string {
  const lines: string[] = [];
  
  // Header
  lines.push('ID,Timestamp,Level,Module,Action,User ID,User Email,IP Address,User Agent,Details');
  
  // Data rows
  logs.forEach(log => {
    const row = [
      log.id,
      log.timestamp,
      log.level,
      log.module,
      `"${log.action}"`,
      log.userId,
      `"${log.userEmail}"`,
      log.ipAddress,
      `"${log.userAgent}"`,
      `"${log.details}"`
    ];
    lines.push(row.join(','));
  });
  
  return lines.join('\n');
}
