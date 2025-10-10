import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Auth: require valid JWT and allowed roles
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = Number((decoded as any)?.userId);
    if (!Number.isFinite(userId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid authentication token' },
        { status: 401 }
      );
    }
    const user = await prisma.user.findUnique({ where: { userId }, select: { role: true, status: true } });
    if (!user || user.status !== 'ACTIVE') {
      return NextResponse.json(
        { success: false, error: 'User not found or inactive' },
        { status: 404 }
      );
    }
    const allowedRoles = ['SUPER_ADMIN', 'ADMIN', 'DEPARTMENT_HEAD', 'INSTRUCTOR'];
    if (!allowedRoles.includes(user.role)) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Optional filters/pagination
    const { searchParams } = new URL(request.url);
    const days = Math.max(1, Number(searchParams.get('days') || '7'));
    const page = Math.max(1, Number(searchParams.get('page') || '1'));
    const pageSize = Math.min(200, Math.max(1, Number(searchParams.get('pageSize') || '100')));
    const search = searchParams.get('search') || '';

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const where: any = {
      timestamp: { gte: startDate }
    };
    if (search) {
      where.OR = [
        { rfidTag: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
        { user: { is: { userName: { contains: search, mode: 'insensitive' } } } },
      ];
    }

    const [logs, total] = await Promise.all([
      prisma.rFIDLogs.findMany({
        where,
        include: {
          reader: {
            select: { deviceName: true, roomId: true }
          },
          user: {
            select: { email: true, userName: true, role: true }
          }
        },
        orderBy: { timestamp: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize
      }),
      prisma.rFIDLogs.count({ where })
    ]);

    const data = logs.map(log => ({
      id: log.logsId.toString(),
      tagId: log.rfidTag,
      studentName: log.user?.userName || log.user?.email || 'Unknown',
      location: log.location || 'N/A',
      timeIn: new Date(log.timestamp).toTimeString().slice(0, 8),
      timeOut: 'N/A',
      date: log.timestamp.toISOString().split('T')[0],
      status: log.scanStatus
    }));

    return NextResponse.json({
      success: true,
      data,
      meta: {
        count: data.length,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
        days,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('RFID logs API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch RFID logs',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
