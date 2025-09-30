import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Define the template data for section import (compliant with Section schema)
    const templateData = [
      {
        sectionName: 'CS-1A',
        sectionCapacity: 30,
        yearLevel: 1,
        courseId: 1,
        academicYear: '2024-2025',
        semester: 'FIRST_SEMESTER',
        sectionStatus: 'ACTIVE',
        currentEnrollment: 0,
        roomAssignment: 'Room 101',
        scheduleNotes: 'Monday to Friday, 8:00 AM - 5:00 PM'
      },
      {
        sectionName: 'CS-1B',
        sectionCapacity: 25,
        yearLevel: 1,
        courseId: 1,
        academicYear: '2024-2025',
        semester: 'FIRST_SEMESTER',
        sectionStatus: 'ACTIVE',
        currentEnrollment: 0,
        roomAssignment: 'Room 102',
        scheduleNotes: 'Monday to Friday, 8:00 AM - 5:00 PM'
      },
      {
        sectionName: 'IT-2A',
        sectionCapacity: 35,
        yearLevel: 2,
        courseId: 2,
        academicYear: '2024-2025',
        semester: 'SECOND_SEMESTER',
        sectionStatus: 'ACTIVE',
        currentEnrollment: 0,
        roomAssignment: 'Room 201',
        scheduleNotes: 'Monday to Friday, 8:00 AM - 5:00 PM'
      },
      {
        sectionName: 'IT-2B',
        sectionCapacity: 28,
        yearLevel: 2,
        courseId: 2,
        academicYear: '2024-2025',
        semester: 'SECOND_SEMESTER',
        sectionStatus: 'ACTIVE',
        currentEnrollment: 0,
        roomAssignment: 'Room 202',
        scheduleNotes: 'Monday to Friday, 8:00 AM - 5:00 PM'
      },
      {
        sectionName: 'CS-3A',
        sectionCapacity: 20,
        yearLevel: 3,
        courseId: 1,
        academicYear: '2024-2025',
        semester: 'THIRD_SEMESTER',
        sectionStatus: 'ACTIVE',
        currentEnrollment: 0,
        roomAssignment: 'Room 301',
        scheduleNotes: 'Monday to Friday, 8:00 AM - 5:00 PM'
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
        'Content-Disposition': 'attachment; filename="sections_template.csv"',
      },
    });
  } catch (error) {
    console.error('Error generating sections template:', error);
    return NextResponse.json(
      { error: 'Failed to generate template' },
      { status: 500 }
    );
  }
}
