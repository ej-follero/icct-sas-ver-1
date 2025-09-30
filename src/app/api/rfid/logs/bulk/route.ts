import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
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

    return NextResponse.json({ results: { success, failed, errors } });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Bulk import failed' }, { status: 500 });
  }
}


