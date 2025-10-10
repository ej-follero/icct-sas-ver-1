import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from '@/lib/auth';

// POST /api/notifications/bulk-delete { ids: number[] }
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    const currentUserId = session?.user?.id ? parseInt(session.user.id, 10) : null;
    if (!currentUserId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const ids: number[] = Array.isArray(body?.ids) ? body.ids : [];
    if (!ids.length) {
      return NextResponse.json({ success: false, error: 'ids array required' }, { status: 400 });
    }

    // Ensure all belong to the current user
    const owned = await prisma.notification.findMany({ where: { id: { in: ids }, userId: currentUserId }, select: { id: true } });
    const ownedIds = new Set(owned.map(o => o.id));
    const toDelete = ids.filter(id => ownedIds.has(id));
    if (!toDelete.length) {
      return NextResponse.json({ success: false, error: 'No permitted notifications to delete' }, { status: 400 });
    }
    await prisma.notification.deleteMany({ where: { id: { in: toDelete } } });

    return NextResponse.json({ success: true, deleted: toDelete.length });
  } catch (error) {
    console.error('Bulk delete notifications error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to bulk delete notifications', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}


