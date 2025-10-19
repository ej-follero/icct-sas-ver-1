import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createNotification } from '@/lib/notifications';

// POST /api/rfid/readers/health
// Body: { offlineMinutes?: number, notifyLimit?: number }
// Checks: readers offline beyond threshold, and maintenance/calibration due/overdue
export async function POST(request: NextRequest) {
  try {
    // Auth: admin-only
    const token = request.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = Number((decoded as any)?.userId);
    if (!Number.isFinite(userId)) return NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 });
    const user = await prisma.user.findUnique({ where: { userId }, select: { role: true, status: true } });
    if (!user || user.status !== 'ACTIVE') return NextResponse.json({ error: 'User not found or inactive' }, { status: 404 });
    if (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN') return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });

    const body = await request.json().catch(() => ({}));
    const offlineMinutes = Number(body.offlineMinutes ?? 10); // default: 10 minutes
    const notifyLimit = Number(body.notifyLimit ?? 50); // limit notifications per call

    const now = new Date();
    const offlineCutoff = new Date(now.getTime() - offlineMinutes * 60 * 1000);

    // Readers offline beyond threshold
    const offlineReaders = await prisma.rFIDReader.findMany({
      where: {
        status: 'OFFLINE',
        lastSeen: { lt: offlineCutoff },
      },
      select: { readerId: true, deviceId: true, lastSeen: true }
    });

    // Maintenance/calibration due or overdue
    const dueReaders = await prisma.rFIDReader.findMany({
      where: {
        OR: [
          { nextCalibration: { lte: now } },
          { room: { nextMaintenance: { lte: now } } },
        ],
      },
      include: {
        room: { select: { roomNo: true, nextMaintenance: true } }
      }
    });

    let notificationsSent = 0;

    // Notify about offline-duration
    for (const r of offlineReaders.slice(0, notifyLimit)) {
      await createNotification(userId, {
        title: 'Reader offline threshold exceeded',
        message: `Reader ${r.deviceId} offline since ${r.lastSeen.toISOString()}`,
        priority: 'HIGH',
        type: 'RFID',
      });
      notificationsSent++;
    }

    // Notify about maintenance/calibration due/overdue
    for (const r of dueReaders.slice(0, Math.max(0, notifyLimit - notificationsSent))) {
      const calDue = r.nextCalibration && r.nextCalibration <= now;
      const roomDue = r.room?.nextMaintenance && r.room.nextMaintenance <= now;
      const parts: string[] = [];
      if (calDue) parts.push(`calibration due${r.nextCalibration ? ` (${r.nextCalibration.toISOString().slice(0,10)})` : ''}`);
      if (roomDue) parts.push(`room maintenance due${r.room?.nextMaintenance ? ` (${r.room.nextMaintenance.toISOString().slice(0,10)})` : ''}`);
      if (!parts.length) continue;
      await createNotification(userId, {
        title: 'Reader maintenance due',
        message: `Reader ${r.deviceId} ${parts.join(' and ')}`,
        priority: 'NORMAL',
        type: 'RFID',
      });
      notificationsSent++;
    }

    return NextResponse.json({ success: true, counts: { offline: offlineReaders.length, due: dueReaders.length, notificationsSent } });
  } catch (e: any) {
    console.error('Reader health check error:', e);
    return NextResponse.json({ error: e?.message || 'Failed to run reader health check' }, { status: 500 });
  }
}


