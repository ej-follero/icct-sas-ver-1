import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

async function assertAdmin(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  if (!token) return { ok: false, res: NextResponse.json({ error: 'Authentication required' }, { status: 401 }) };
  try {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId as number;
    const user = await prisma.user.findUnique({ where: { userId }, select: { role: true } });
    if (!user || (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN')) {
      return { ok: false, res: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
    }
    return { ok: true } as const;
  } catch {
    return { ok: false, res: NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 }) };
  }
}

export async function GET(request: NextRequest) {
  try {
    const gate = await assertAdmin(request);
    if (!('ok' in gate) || gate.ok !== true) return gate.res;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const level = searchParams.get('level') || 'all';
    const module = searchParams.get('module') || 'all';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const skip = (page - 1) * limit;

    // Build where clause for filtering
    const where: any = {};

    if (search) {
      where.OR = [
        { action: { contains: search, mode: 'insensitive' } },
        { message: { contains: search, mode: 'insensitive' } },
        { userEmail: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (level !== 'all') {
      where.level = level;
    }

    if (module !== 'all') {
      where.module = module;
    }

    if (startDate && endDate) {
      where.timestamp = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    // Fetch backup logs with pagination
    const [logs, total] = await Promise.all([
      prisma.backupSystemLog.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          timestamp: true,
          level: true,
          module: true,
          action: true,
          userId: true,
          userEmail: true,
          ipAddress: true,
          userAgent: true,
          details: true,
          severity: true,
          eventType: true,
          resolved: true,
          message: true
        }
      }),
      prisma.backupSystemLog.count({ where })
    ]);

    return NextResponse.json({
      data: logs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });

  } catch (error) {
    console.error('Error fetching backup logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch backup logs' },
      { status: 500 }
    );
  }
}