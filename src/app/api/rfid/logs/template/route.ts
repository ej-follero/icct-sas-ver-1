import { NextResponse } from 'next/server';

// CSV template aligned with prisma RFIDLogs schema required fields
// Columns: rfidTag,readerId,scanType,scanStatus,location,timestamp,userId,userRole
export async function GET() {
  const headers = [
    'rfidTag',
    'readerId',
    'scanType',
    'scanStatus',
    'location',
    'timestamp',
    'userId',
    'userRole',
  ];

  const sampleRow = [
    'TAG-0001',
    '101',
    'CHECK_IN',
    'SUCCESS',
    'Main Hall',
    new Date().toISOString(),
    '123',
    'STUDENT',
  ];

  const csv = [headers.join(','), sampleRow.join(',')].join('\n');

  return new NextResponse(csv, {
    status: 200,
    headers: new Headers({
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="rfid-logs-template.csv"',
    }),
  });
}


