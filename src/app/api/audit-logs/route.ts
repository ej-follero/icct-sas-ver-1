import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const severity = searchParams.get('severity') || 'all';
    const category = searchParams.get('category') || 'all';
    const action = searchParams.get('action') || 'all';
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    const where: any = {};
    
    if (severity !== 'all') {
      where.severity = severity;
    }
    
    if (category !== 'all') {
      // Map UI 'category' to SecurityLog.module field
      where.module = category;
    }

    if (action !== 'all') {
      where.action = { contains: action, mode: 'insensitive' };
    }

    if (search) {
      where.OR = [
        { action: { contains: search, mode: 'insensitive' } },
        { eventType: { contains: search, mode: 'insensitive' } },
        { module: { contains: search, mode: 'insensitive' } },
        { user: { is: { userName: { contains: search, mode: 'insensitive' } } } },
        { user: { is: { email: { contains: search, mode: 'insensitive' } } } }
      ];
    }

    if (dateFrom) {
      where.timestamp = { ...where.timestamp, gte: new Date(dateFrom) };
    }

    if (dateTo) {
      where.timestamp = { ...where.timestamp, lte: new Date(dateTo) };
    }

    const auditLogs = await prisma.securityLog.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        user: {
          select: {
            userId: true,
            userName: true,
            email: true
          }
        }
      }
    });

    const total = await prisma.securityLog.count({ where });

    // Get statistics
    const stats = await prisma.securityLog.groupBy({
      by: ['severity'],
      _count: true,
      where: {
        timestamp: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      }
    });

    return NextResponse.json({
      data: auditLogs.map(log => ({
        id: log.id.toString(),
        userId: log.userId,
        userName: log.user?.userName || 'System',
        userEmail: log.user?.email || 'system@icct.edu.ph',
        action: log.eventType || log.action || 'UNKNOWN',
        resourceType: log.module || 'Security',
        resourceId: log.id,
        oldValues: null,
        newValues: log.details,
        ipAddress: log.ipAddress || 'unknown',
        userAgent: log.userAgent || 'unknown',
        timestamp: log.timestamp.toISOString(),
        severity: log.severity,
        category: log.module || 'Security'
      })),
      statistics: {
        total: total,
        critical: stats.find(s => s.severity === 'CRITICAL')?._count || 0,
        high: stats.find(s => s.severity === 'HIGH')?._count || 0,
        medium: stats.find(s => s.severity === 'MEDIUM')?._count || 0,
        low: stats.find(s => s.severity === 'LOW')?._count || 0
      },
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch audit logs' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, action, resourceType, resourceId, oldValues, newValues, ipAddress, userAgent, severity, category } = body;

    const auditLog = await prisma.securityLog.create({
      data: {
        userId,
        userEmail: undefined,
        level: (severity || 'LOW').toString(),
        module: (category || 'AUDIT').toString(),
        action: action?.toString() || 'UNKNOWN',
        eventType: action?.toString() || 'UNKNOWN',
        severity: (severity || 'LOW').toString(),
        ipAddress: ipAddress || request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: userAgent || request.headers.get('user-agent') || 'unknown',
        details: JSON.stringify({ resourceType, resourceId, oldValues, newValues, category })
      }
    });

    return NextResponse.json({ data: auditLog });
  } catch (error) {
    console.error('Error creating audit log:', error);
    return NextResponse.json(
      { error: 'Failed to create audit log' },
      { status: 500 }
    );
  }
}
