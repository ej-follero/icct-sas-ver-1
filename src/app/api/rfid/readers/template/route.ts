import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// CSV template aligned with Prisma RFIDReader model
// Based on schema: readerId (auto), roomId (required), deviceId (required), deviceName, status, ipAddress, notes
export async function GET(request: NextRequest) {
  try {
    // JWT Authentication
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = Number((decoded as any)?.userId);
    if (!Number.isFinite(userId)) {
      return NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 });
    }

    // Check user exists and is active
    const user = await prisma.user.findUnique({
      where: { userId },
      select: { status: true, role: true }
    });

    if (!user || user.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'User not found or inactive' }, { status: 401 });
    }

    // Role-based access control
    const allowedRoles = ['SUPER_ADMIN', 'ADMIN', 'DEPARTMENT_HEAD', 'INSTRUCTOR'];
    if (!allowedRoles.includes(user.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }
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
  } catch (error) {
    console.error('Error generating RFID readers template:', error);
    return NextResponse.json({ error: 'Failed to generate template' }, { status: 500 });
  }
}


