import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Define the template data for room import (compliant with Room schema)
    const templateData = [
      {
        roomNo: '101',
        roomType: 'LECTURE',
        roomCapacity: 30,
        readerId: 'RFID-001',
        roomBuildingLoc: 'BuildingA',
        roomFloorLoc: 'F1',
        status: 'AVAILABLE',
        isActive: true,
        lastMaintenance: '2024-01-15',
        nextMaintenance: '2024-07-15',
        notes: 'Standard lecture room with whiteboard and projector'
      },
      {
        roomNo: '102',
        roomType: 'LECTURE',
        roomCapacity: 25,
        readerId: 'RFID-002',
        roomBuildingLoc: 'BuildingA',
        roomFloorLoc: 'F1',
        status: 'AVAILABLE',
        isActive: true,
        lastMaintenance: '2024-01-20',
        nextMaintenance: '2024-07-20',
        notes: 'Small lecture room for discussion classes'
      },
      {
        roomNo: 'LAB-1',
        roomType: 'LABORATORY',
        roomCapacity: 20,
        readerId: 'RFID-003',
        roomBuildingLoc: 'BuildingB',
        roomFloorLoc: 'F2',
        status: 'AVAILABLE',
        isActive: true,
        lastMaintenance: '2024-02-01',
        nextMaintenance: '2024-08-01',
        notes: 'Computer laboratory with 20 workstations'
      },
      {
        roomNo: 'LAB-2',
        roomType: 'LABORATORY',
        roomCapacity: 15,
        readerId: 'RFID-004',
        roomBuildingLoc: 'BuildingB',
        roomFloorLoc: 'F2',
        status: 'MAINTENANCE',
        isActive: true,
        lastMaintenance: '2024-02-10',
        nextMaintenance: '2024-08-10',
        notes: 'Chemistry laboratory with safety equipment'
      },
      {
        roomNo: 'CONF-A',
        roomType: 'CONFERENCE',
        roomCapacity: 12,
        readerId: 'RFID-005',
        roomBuildingLoc: 'BuildingC',
        roomFloorLoc: 'F3',
        status: 'RESERVED',
        isActive: true,
        lastMaintenance: '2024-01-05',
        nextMaintenance: '2024-07-05',
        notes: 'Conference room with video conferencing equipment'
      },
      {
        roomNo: 'OFF-101',
        roomType: 'OFFICE',
        roomCapacity: 4,
        readerId: 'RFID-006',
        roomBuildingLoc: 'BuildingD',
        roomFloorLoc: 'F1',
        status: 'OCCUPIED',
        isActive: true,
        lastMaintenance: '2024-01-12',
        nextMaintenance: '2024-07-12',
        notes: 'Faculty office with desk and storage'
      }
    ];

    // Convert to CSV format
    const headers = Object.keys(templateData[0]);
    const csvContent = [
      headers.join(','),
      ...templateData.map(row => 
        headers.map(header => {
          const value = row[header as keyof typeof row];
          // Escape commas and quotes in CSV
          if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        }).join(',')
      )
    ].join('\n');

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="rooms_template.csv"',
      },
    });
  } catch (error) {
    console.error('Error generating rooms template:', error);
    return NextResponse.json(
      { error: 'Failed to generate template' },
      { status: 500 }
    );
  }
}




