import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from '@/lib/auth';

// GET /api/notifications
export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession();
    const currentUserId = session?.user?.id ? parseInt(session.user.id, 10) : null;
    if (!currentUserId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const notifications = await prisma.notification.findMany({
      where: { userId: currentUserId },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });

    // Map DB records to UI shape expected by Notifications page/hook
    const items = notifications.map(n => ({
      id: n.id,
      title: n.title,
      message: n.message || '',
      time: n.createdAt.toISOString(),
      unread: !n.isRead,
      type: 'notification' as const,
      priority: ((): 'low' | 'medium' | 'high' => {
        const p = (n.priority || 'NORMAL').toUpperCase();
        if (p === 'HIGH' || p === 'CRITICAL') return 'high';
        if (p === 'MEDIUM' || p === 'NORMAL') return 'medium';
        return 'low';
      })(),
      actionUrl: undefined as string | undefined,
    }));

    return NextResponse.json({ success: true, items });
  } catch (error) {
    console.error('List notifications error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to load notifications', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}


