import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from '@/lib/auth';

// DELETE /api/notifications/:id
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    const currentUserId = session?.user?.id ? parseInt(session.user.id, 10) : null;
    if (!currentUserId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const notificationId = parseInt(id, 10);
    if (Number.isNaN(notificationId)) {
      return NextResponse.json({ success: false, error: 'Invalid id' }, { status: 400 });
    }

    // Ensure ownership, then delete
    const existing = await prisma.notification.findFirst({ where: { id: notificationId, userId: currentUserId } });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    }
    await prisma.notification.delete({ where: { id: notificationId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete notification error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete notification', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// PUT /api/notifications/:id  { isRead?: boolean }
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    const currentUserId = session?.user?.id ? parseInt(session.user.id, 10) : null;
    if (!currentUserId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const notificationId = parseInt(id, 10);
    if (Number.isNaN(notificationId)) {
      return NextResponse.json({ success: false, error: 'Invalid id' }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const isRead = typeof body?.isRead === 'boolean' ? body.isRead : true;

    // Ensure ownership, then update
    const existing = await prisma.notification.findFirst({ where: { id: notificationId, userId: currentUserId } });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    }
    const updated = await prisma.notification.update({ where: { id: notificationId }, data: { isRead } });

    return NextResponse.json({ success: true, notification: updated });
  } catch (error) {
    console.error('Update notification error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update notification', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

