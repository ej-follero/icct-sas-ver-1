import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createNotification } from '@/lib/notifications';

export async function POST(request: NextRequest) {
  try {
    // Auth: require valid JWT and admin roles
    const token = request.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = Number((decoded as any)?.userId);
    if (!Number.isFinite(userId)) return NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 });
    const user = await prisma.user.findUnique({ where: { userId }, select: { role: true, status: true } });
    if (!user || user.status !== 'ACTIVE') return NextResponse.json({ error: 'User not found or inactive' }, { status: 404 });
    if (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const body = await request.json().catch(() => ({}));
    const records = Array.isArray(body?.records) ? body.records : [];
    if (records.length === 0) {
      return NextResponse.json({ error: 'No records provided' }, { status: 400 });
    }

    let success = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const rec of records) {
      try {
        // Minimal required fields mapping; adjust as needed
        const created = await prisma.rFIDLogs.create({
          data: {
            rfidTag: String(rec.rfidTag || rec.tagId || rec.tag || ''),
            readerId: Number(rec.readerId || 0),
            scanType: rec.scanType || 'CHECK_IN',
            scanStatus: rec.scanStatus || 'SUCCESS',
            location: String(rec.location || ''),
            userId: Number(rec.userId || 0),
            userRole: rec.userRole || 'STUDENT',
            timestamp: rec.timestamp ? new Date(rec.timestamp) : new Date(),
          },
        });
        if (created) success += 1; else failed += 1;
      } catch (e: any) {
        failed += 1;
        errors.push(e?.message || 'create failed');
      }
    }

    // Optional: notify admin of duplicate scans detection for this bulk window
    try {
      // A simple heuristic: if failures are high or multiple DUPLICATE statuses are present
      const hasDuplicateFlag = records.some((r: any) => String(r.scanStatus || '').toUpperCase() === 'DUPLICATE');
      if (hasDuplicateFlag) {
        await createNotification(userId, {
          title: 'Possible duplicate scans detected',
          message: 'Duplicate scan entries present in bulk import.',
          priority: 'NORMAL',
          type: 'RFID',
        });
      }
    } catch {}

    return NextResponse.json({ results: { success, failed, errors } });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Bulk import failed' }, { status: 500 });
  }
}


