import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
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

    // Get total count for pagination
    const total = await prisma.systemLogs.count({ where });

    // Get logs with pagination
    const logs = await prisma.systemLogs.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      skip: (page - 1) * limit,
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

    // Transform logs for frontend
    const transformedLogs = logs.map(log => ({
      id: log.id.toString(),
      timestamp: log.timestamp.toISOString(),
      level: determineLogLevel(log.actionType),
      module: log.module,
      action: log.actionType,
      userId: log.userId.toString(),
      userEmail: log.user?.email || 'Unknown',
      ipAddress: log.ipAddress || 'Unknown',
      userAgent: log.userAgent || 'Unknown',
      details: log.details || '',
    }));

    return NextResponse.json({
      data: transformedLogs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });

  } catch (error) {
    console.error('Error fetching system logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch system logs' },
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
