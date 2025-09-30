import { NextResponse } from 'next/server';

// CSV template aligned with Prisma RFIDReader model
// Based on schema: readerId (auto), roomId (required), deviceId (required), deviceName, status, ipAddress, notes
export async function GET() {
  const headers = [
    'deviceId',           // Required: Unique device identifier
    'deviceName',         // Optional: Human-readable name
    'roomId',             // Required: Must reference existing room
    'status',             // Optional: ACTIVE, INACTIVE, TESTING, CALIBRATION, REPAIR, OFFLINE, ERROR
    'ipAddress',          // Optional: IP address for network communication
    'notes'               // Optional: Additional notes
  ];
  
  const sampleRows = [
    [
      'READER-001',
      'Main Entrance Reader',
      '1',                    // Must be a valid room ID
      'ACTIVE',
      '192.168.1.10',
      'Main entrance RFID reader for building access'
    ],
    [
      'READER-002',
      'Library Reader',
      '2',                    // Must be a valid room ID
      'ACTIVE',
      '192.168.1.11',
      'Library entrance reader'
    ],
    [
      'READER-003',
      'Lab Reader',
      '3',                    // Must be a valid room ID
      'TESTING',
      '192.168.1.12',
      'Computer lab reader - under testing'
    ]
  ];
  
  const csvContent = [
    headers.join(','),
    ...sampleRows.map(row => 
      row.map(field => {
        const str = String(field);
        return str.includes(',') || str.includes('"') || str.includes('\n') 
          ? `"${str.replace(/"/g, '""')}"` 
          : str;
      }).join(',')
    )
  ].join('\n');
  
  return new NextResponse(csvContent, {
    status: 200,
    headers: new Headers({
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="rfid-readers-template.csv"',
    })
  });
}


