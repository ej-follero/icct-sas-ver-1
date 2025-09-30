import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Create CSV template for RFID tags
    const headers = [
      'tagNumber',
      'tagType', 
      'status',
      'notes',
      'studentId',
      'instructorId',
      'assignedBy',
      'assignmentReason',
      'expiresAt'
    ];

    // Sample data row
    const sampleRow = [
      'TAG001',
      'STUDENT_CARD',
      'ACTIVE',
      'Sample tag for student',
      '1',
      '',
      '1',
      'Initial assignment',
      new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // 1 year from now
    ];

    const csvContent = [
      headers.join(','),
      sampleRow.map(field => {
        const str = String(field);
        return str.includes(',') || str.includes('"') || str.includes('\n') 
          ? `"${str.replace(/"/g, '""')}"` 
          : str;
      }).join(',')
    ].join('\n');

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="rfid-tags-template.csv"',
      },
    });
  } catch (error) {
    console.error('Error generating RFID tags template:', error);
    return NextResponse.json(
      { error: 'Failed to generate template' },
      { status: 500 }
    );
  }
}
