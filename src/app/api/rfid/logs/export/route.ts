import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Auth: require valid JWT and allowed roles
    const token = request.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = Number((decoded as any)?.userId);
    if (!Number.isFinite(userId)) return NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 });
    const user = await prisma.user.findUnique({ where: { userId }, select: { role: true, status: true } });
    if (!user || user.status !== 'ACTIVE') return NextResponse.json({ error: 'User not found or inactive' }, { status: 404 });
    const allowedRoles = ['SUPER_ADMIN', 'ADMIN', 'DEPARTMENT_HEAD', 'INSTRUCTOR'];
    if (!allowedRoles.includes(user.role)) return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
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
        { rfidTag: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
        { user: { is: { email: { contains: search, mode: 'insensitive' } } } },
        { user: { is: { userName: { contains: search, mode: 'insensitive' } } } }
      ];
    }

    // level/module do not apply to RFIDLogs; ignore

    if (startDate && endDate) {
      where.timestamp = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    // Fetch all RFID logs for export
    const logs = await prisma.rFIDLogs.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      include: {
        user: { select: { email: true, userName: true } },
        reader: { select: { deviceName: true } }
      }
    });

    if (format === 'csv') {
      // Generate CSV
      const headers = [
        'ID', 'Timestamp', 'RFID Tag', 'Reader ID', 'Reader Name', 'Scan Type', 'Status', 'Location', 'User ID', 'User Email', 'User Name'
      ];
      
      const csvRows = [
        headers.join(','),
        ...logs.map((log: any) => [
          log.logsId,
          log.timestamp?.toISOString?.() || log.timestamp,
          log.rfidTag,
          log.readerId,
          log.reader?.deviceName || '',
          log.scanType,
          log.scanStatus,
          log.location || '',
          log.userId || '',
          log.user?.email || '',
          log.user?.userName || ''
        ].map(field => `"${String(field ?? '').replace(/"/g, '""')}"`).join(','))
      ];

      const csv = csvRows.join('\n');
      
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="rfid-logs-${new Date().toISOString().split('T')[0]}.csv"`
        }
      });
    } else {
      // Return JSON
      const json = logs.map((log: any) => ({
        id: log.logsId,
        timestamp: log.timestamp,
        rfidTag: log.rfidTag,
        readerId: log.readerId,
        readerName: log.reader?.deviceName || null,
        scanType: log.scanType,
        scanStatus: log.scanStatus,
        location: log.location,
        userId: log.userId,
        userEmail: log.user?.email || null,
        userName: log.user?.userName || null
      }));
      return NextResponse.json(json, {
        headers: {
          'Content-Disposition': `attachment; filename="rfid-logs-${new Date().toISOString().split('T')[0]}.json"`
        }
      });
    }

  } catch (error) {
    console.error('Error exporting RFID logs:', error);
    return NextResponse.json(
      { error: 'Failed to export RFID logs' },
      { status: 500 }
    );
  }
}
