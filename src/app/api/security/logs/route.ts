import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const eventType = searchParams.get('eventType');
    const severity = searchParams.get('severity');
    const resolved = searchParams.get('resolved');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build where clause
    const where: any = {};

    if (eventType) {
      where.eventType = eventType;
    }

    if (severity) {
      where.severity = severity;
    }

    if (resolved !== null && resolved !== undefined) {
      where.resolved = resolved === 'true';
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
    const total = await prisma.securityLog.count({ where });

    // Get logs with pagination
    const logs = await prisma.securityLog.findMany({
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
        },
        resolver: {
          select: {
            userId: true,
            userName: true,
            email: true
          }
        }
      }
    });

    // Get event type statistics
    const eventTypeStats = await prisma.securityLog.groupBy({
      by: ['eventType'],
      where,
      _count: {
        eventType: true
      }
    });

    // Get severity statistics
    const severityStats = await prisma.securityLog.groupBy({
      by: ['severity'],
      where,
      _count: {
        severity: true
      }
    });

    return NextResponse.json({
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      statistics: {
        eventTypes: eventTypeStats,
        severities: severityStats
      }
    });
  } catch (error) {
    console.error('Error fetching security logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch security logs' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    
    const log = await prisma.securityLog.create({
      data: {
        eventType: data.eventType,
        severity: data.severity,
        description: data.description,
        userId: data.userId || null,
        ipAddress: data.ipAddress || null,
        userAgent: data.userAgent || null,
        details: data.details || null
      },
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

    return NextResponse.json(log);
  } catch (error) {
    console.error('Error creating security log:', error);
    return NextResponse.json(
      { error: 'Failed to create security log' },
      { status: 500 }
    );
  }
} 