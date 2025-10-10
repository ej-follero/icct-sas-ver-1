import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Auth: require valid JWT and allowed roles (SUPER_ADMIN, ADMIN, DEPARTMENT_HEAD, INSTRUCTOR)
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = Number((decoded as any)?.userId);
    if (!Number.isFinite(userId)) {
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      );
    }
    const user = await prisma.user.findUnique({ where: { userId }, select: { role: true, status: true } });
    if (!user || user.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'User not found or inactive' },
        { status: 404 }
      );
    }
    const allowedRoles = ['SUPER_ADMIN', 'ADMIN', 'DEPARTMENT_HEAD', 'INSTRUCTOR'];
    if (!allowedRoles.includes(user.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }
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
        { rfidTag: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
        { user: { is: { email: { contains: search, mode: 'insensitive' } } } },
        { user: { is: { userName: { contains: search, mode: 'insensitive' } } } }
      ];
    }

    // level/module filters are not applicable to RFIDLogs; ignore

    if (startDate && endDate) {
      where.timestamp = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    // Fetch RFID logs with pagination
    const [logs, total] = await Promise.all([
      prisma.rFIDLogs.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        skip,
        take: limit,
        include: {
          user: { select: { email: true, userName: true } },
          reader: { select: { deviceName: true } }
        }
      }),
      prisma.rFIDLogs.count({ where })
    ]);

    const data = logs.map((log: any) => ({
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

    return NextResponse.json({
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });

  } catch (error) {
    console.error('Error fetching RFID logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch RFID logs' },
      { status: 500 }
    );
  }
}