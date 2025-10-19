import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/notifications/unread-count
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = Number((decoded as any)?.userId);
    if (!Number.isFinite(userId)) return NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 });

    const count = await prisma.notification.count({ where: { userId, isRead: false } });
    return NextResponse.json({ count });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to fetch unread count' }, { status: 500 });
  }
}


