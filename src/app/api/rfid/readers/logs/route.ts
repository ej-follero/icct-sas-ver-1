import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createNotification } from '@/lib/notifications';

// POST /api/rfid/readers/logs
// Ingest a reader log entry and emit notifications for key events (e.g., firmware update)
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
    const readerId = Number(body.readerId);
    const rawEventType = String(body.eventType || 'SYSTEM_ERROR').toUpperCase();
    const rawSeverity = String(body.severity || 'INFO').toUpperCase();
    const allowedEventTypes = new Set([
      'SCAN_SUCCESS','SCAN_ERROR','CONNECTION_LOST','CONNECTION_RESTORED','BATTERY_LOW','BATTERY_CRITICAL','SIGNAL_WEAK','SIGNAL_LOST','RESTART','CONFIGURATION_CHANGE','FIRMWARE_UPDATE','MAINTENANCE_REQUIRED','SYSTEM_ERROR'
    ]);
    const allowedSeverities = new Set(['DEBUG','INFO','WARNING','ERROR','CRITICAL']);
    const eventType = (allowedEventTypes.has(rawEventType) ? rawEventType : 'SYSTEM_ERROR') as any;
    const severity = (allowedSeverities.has(rawSeverity) ? rawSeverity : 'INFO') as any;
    const message = typeof body.message === 'string' ? body.message : undefined;
    const details = body.details ?? undefined;

    if (!Number.isFinite(readerId)) {
      return NextResponse.json({ error: 'readerId is required' }, { status: 400 });
    }

    // ensure reader exists
    const reader = await prisma.rFIDReader.findUnique({ where: { readerId }, select: { readerId: true, deviceId: true } });
    if (!reader) return NextResponse.json({ error: 'Reader not found' }, { status: 404 });

    const log = await prisma.rFIDReaderLogs.create({
      data: {
        readerId,
        eventType, // coerced to Prisma enum
        severity, // coerced to Prisma enum
        message,
        details: details as any,
      },
    });

    // Notifications for firmware update outcome
    if (eventType === 'FIRMWARE_UPDATE') {
      const success = body.success === true || String(body.status || '').toUpperCase() === 'SUCCESS';
      await createNotification(userId, {
        title: success ? 'Firmware update successful' : 'Firmware update failed',
        message: `Reader ${reader.deviceId} firmware ${success ? 'updated successfully' : 'update failed'}`,
        priority: success ? 'NORMAL' : 'HIGH',
        type: 'RFID',
      });
    }

    // Duplicate scan heuristic: if provided in details, notify
    // Expecting details like { rfidTag, windowMs, count, readerId }
    if (eventType === 'SCAN_ERROR' || eventType === 'SCAN_SUCCESS') {
      const tag = details?.rfidTag || body.rfidTag;
      const windowMs = Number(details?.windowMs ?? 30000); // 30s window
      const countThreshold = Number(details?.countThreshold ?? 3);
      if (tag) {
        const since = new Date(Date.now() - windowMs);
        const recent = await prisma.rFIDLogs.count({
          where: {
            readerId,
            rfidTag: String(tag),
            timestamp: { gte: since },
          }
        });
        if (recent >= countThreshold) {
          await createNotification(userId, {
            title: 'Possible duplicate scans detected',
            message: `Tag ${String(tag)} scanned ${recent} times within ${Math.round(windowMs/1000)}s on reader ${reader.deviceId}`,
            priority: 'NORMAL',
            type: 'RFID',
          });
        }
      }
    }

    return NextResponse.json({ success: true, data: { id: log.id } });
  } catch (e: any) {
    console.error('Reader logs ingest error:', e);
    return NextResponse.json({ error: e?.message || 'Failed to ingest reader log' }, { status: 500 });
  }
}


