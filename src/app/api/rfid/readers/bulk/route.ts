import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createNotification } from '@/lib/notifications';

export async function POST(request: NextRequest) {
  try {
    // Auth: admin-only (SUPER_ADMIN, ADMIN)
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
    const records = Array.isArray(body?.records) ? body.records : [];
    
    console.log('Bulk import request received:', { recordCount: records.length });
    
    if (records.length === 0) {
      return NextResponse.json({ error: 'No records provided' }, { status: 400 });
    }

    let success = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const rec of records) {
      try {
        // Validate required fields
        const deviceId = String(rec.deviceId || '').trim();
        if (!deviceId) throw new Error('deviceId is required');
        
        if (!rec.roomId) throw new Error('roomId is required');
        
        // Validate roomId
        const roomIdNum = Number(rec.roomId);
        if (isNaN(roomIdNum) || roomIdNum < 1) {
          throw new Error(`Invalid room ID: ${rec.roomId} - must be a positive number`);
        }
        
        // Check if the room exists
        const room = await prisma.room.findUnique({
          where: { roomId: roomIdNum }
        });
        
        if (!room) {
          throw new Error(`Room with ID ${roomIdNum} not found`);
        }
        
        // Validate status
        const validStatuses = ['ACTIVE', 'INACTIVE', 'TESTING', 'CALIBRATION', 'REPAIR', 'OFFLINE', 'ERROR'];
        const status = rec.status || 'ACTIVE';
        if (!validStatuses.includes(status)) {
          throw new Error(`Invalid status "${status}". Must be one of: ${validStatuses.join(', ')}`);
        }
        
        // Validate IP address if provided
        if (rec.ipAddress && rec.ipAddress.trim()) {
          const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
          if (!ipRegex.test(rec.ipAddress.trim())) {
            throw new Error(`Invalid IP address format: ${rec.ipAddress}`);
          }
        }
        
        const data: any = {
          deviceId,
          deviceName: rec.deviceName?.trim() || null,
          roomId: roomIdNum,
          status,
          ipAddress: rec.ipAddress?.trim() || null,
          notes: rec.notes?.trim() || null,
          components: {},
          assemblyDate: new Date(),
          lastSeen: new Date(),
        };
        
        console.log('Processing record:', { deviceId, data });
        
        await prisma.rFIDReader.upsert({
          where: { deviceId },
          update: data,
          create: data,
        });
        success++;
      } catch (e: any) {
        console.error('Error processing record:', rec, e);
        failed++;
        errors.push(`${rec.deviceId || 'Unknown'}: ${e?.message || 'row failed'}`);
      }
    }

    console.log('Bulk import completed:', { success, failed, errors });
    try {
      await createNotification(userId, {
        title: 'Import completed',
        message: `RFID readers import: ${success} success, ${failed} failed`,
        priority: failed > 0 ? 'NORMAL' : 'NORMAL',
        type: 'DATA',
      });
    } catch {}
    return NextResponse.json({ results: { success, failed, errors } });
  } catch (e: any) {
    console.error('Bulk import error:', e);
    return NextResponse.json({ error: e?.message || 'Bulk import failed' }, { status: 500 });
  }
}


