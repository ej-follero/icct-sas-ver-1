import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Map Prisma enums to UI values
function mapScanStatusToUi(status: string): 'success' | 'error' | 'unauthorized' | 'timeout' {
  switch (status) {
    case 'SUCCESS':
      return 'success';
    case 'UNAUTHORIZED':
      return 'unauthorized';
    // There is no TIMEOUT in schema; treat FAILED and others as error
    case 'FAILED':
    default:
      return 'error';
  }
}

function mapScanTypeToUi(type: string): 'entry' | 'exit' | 'attendance' | 'access' {
  switch (type) {
    case 'CHECK_IN':
      return 'entry';
    case 'CHECK_OUT':
      return 'exit';
    case 'VERIFICATION':
      return 'access';
    case 'TEST_SCAN':
    case 'MAINTENANCE':
    default:
      return 'access';
  }
}

function mapUiStatusToPrisma(status: string | null | undefined) {
  if (!status) return undefined;
  const s = status.toLowerCase();
  if (s === 'success') return 'SUCCESS';
  if (s === 'unauthorized') return 'UNAUTHORIZED';
  if (s === 'error') return 'FAILED';
  return undefined;
}

function mapUiScanTypeToPrisma(type: string | null | undefined) {
  if (!type) return undefined;
  const t = type.toLowerCase();
  if (t === 'entry') return 'CHECK_IN';
  if (t === 'exit') return 'CHECK_OUT';
  if (t === 'access') return 'VERIFICATION';
  // no direct mapping for 'attendance' in current enum -> treat as VERIFICATION
  if (t === 'attendance') return 'VERIFICATION';
  return undefined;
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const statusParam = url.searchParams.get('status');
    const scanTypeParam = url.searchParams.get('scanType');
    const locationParam = url.searchParams.get('location');
    const dateParam = url.searchParams.get('date'); // YYYY-MM-DD (UTC day)
    const startIso = url.searchParams.get('start'); // ISO string (client-local day start)
    const endIso = url.searchParams.get('end');     // ISO string (client-local day end)

    const where: any = {};
    const statusPrisma = mapUiStatusToPrisma(statusParam || undefined);
    const typePrisma = mapUiScanTypeToPrisma(scanTypeParam || undefined);
    if (statusPrisma) where.scanStatus = statusPrisma;
    if (typePrisma) where.scanType = typePrisma;
    if (locationParam && locationParam !== 'all') where.location = locationParam;
    if (startIso && endIso) {
      where.timestamp = { gte: new Date(startIso), lte: new Date(endIso) };
    } else if (dateParam) {
      const start = new Date(`${dateParam}T00:00:00.000Z`);
      const end = new Date(`${dateParam}T23:59:59.999Z`);
      where.timestamp = { gte: start, lte: end };
    }

    const logs = await prisma.rFIDLogs.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: 500,
      include: {
        user: true,
        reader: true,
      },
    });

    const data = logs.map((l) => ({
      id: String(l.logsId),
      tagId: l.rfidTag,
      readerId: String(l.readerId),
      studentId: undefined as string | undefined,
      studentName: l.user ? `${l.user.userName}` : undefined,
      location: l.location,
      timestamp: l.timestamp.toISOString(),
      status: mapScanStatusToUi(String(l.scanStatus)),
      scanType: mapScanTypeToUi(String(l.scanType)),
      duration: undefined as number | undefined,
      notes: undefined as string | undefined,
    }));

    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to fetch RFID logs' }, { status: 500 });
  }
}