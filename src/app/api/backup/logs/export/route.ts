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
    const format = searchParams.get('format') || 'json';
    const search = searchParams.get('search') || '';
    const level = searchParams.get('level') || 'all';
    const module = searchParams.get('module') || 'all';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

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

    // Fetch all backup logs for export
    const logs = await prisma.backupSystemLog.findMany({
      where,
      orderBy: { timestamp: 'desc' },
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
    });

    if (format === 'csv') {
      // Generate CSV
      const headers = [
        'ID', 'Timestamp', 'Level', 'Module', 'Action', 'User ID', 
        'User Email', 'IP Address', 'User Agent', 'Details', 'Severity', 
        'Event Type', 'Resolved', 'Message'
      ];
      
      const csvRows = [
        headers.join(','),
        ...logs.map(log => [
          log.id,
          log.timestamp.toISOString(),
          log.level,
          log.module,
          log.action,
          log.userId || '',
          log.userEmail || '',
          log.ipAddress || '',
          log.userAgent || '',
          typeof log.details === 'string' ? log.details : JSON.stringify(log.details ?? ''),
          log.severity || '',
          log.eventType || '',
          log.resolved ? 'Yes' : 'No',
          log.message || ''
        ].map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
      ];

      const csv = csvRows.join('\n');
      
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="backup-logs-${new Date().toISOString().split('T')[0]}.csv"`
        }
      });
    } else {
      // Return JSON
      return NextResponse.json(logs, {
        headers: {
          'Content-Disposition': `attachment; filename="backup-logs-${new Date().toISOString().split('T')[0]}.json"`
        }
      });
    }

  } catch (error) {
    console.error('Error exporting backup logs:', error);
    return NextResponse.json(
      { error: 'Failed to export backup logs' },
      { status: 500 }
    );
  }
}
