import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // JWT Authentication - Admin only
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = Number((decoded as any)?.userId);
    if (!Number.isFinite(userId)) {
      return NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { userId }, select: { status: true, role: true } });
    if (!user || user.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'User not found or inactive' }, { status: 401 });
    }
    const adminRoles = ['SUPER_ADMIN', 'ADMIN'];
    if (!adminRoles.includes(user.role)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

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

    // Fetch all logs for export
    const logs = await prisma.systemLog.findMany({
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
          log.timestamp,
          log.level,
          log.module,
          log.action,
          log.userId || '',
          log.userEmail || '',
          log.ipAddress || '',
          log.userAgent || '',
          log.details || '',
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
          'Content-Disposition': `attachment; filename="system-logs-${new Date().toISOString().split('T')[0]}.csv"`
        }
      });
    } else {
      // Return JSON
      return NextResponse.json(logs, {
        headers: {
          'Content-Disposition': `attachment; filename="system-logs-${new Date().toISOString().split('T')[0]}.json"`
        }
      });
    }

  } catch (error) {
    console.error('Error exporting system logs:', error);
    return NextResponse.json(
      { error: 'Failed to export system logs' },
      { status: 500 }
    );
  }
}