import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Define the template data for course import
    const templateData = [
      {
        name: 'Computer Science Fundamentals',
        code: 'CS101',
        department: 'Computer Science',
        departmentCode: 'CS',
        description: 'Introduction to computer science concepts and programming fundamentals',
        units: 3,
        status: 'ACTIVE',
        courseType: 'MANDATORY',
        major: 'Computer Science'
      },
      {
        name: 'Advanced Mathematics',
        code: 'MATH201',
        department: 'Mathematics',
        departmentCode: 'MATH',
        description: 'Advanced calculus and linear algebra for engineering students',
        units: 4,
        status: 'ACTIVE',
        courseType: 'MANDATORY',
        major: 'Mathematics'
      },
      {
        name: 'Creative Writing Workshop',
        code: 'ENG150',
        department: 'English',
        departmentCode: 'ENG',
        description: 'Developing creative writing skills through various literary forms',
        units: 2,
        status: 'ACTIVE',
        courseType: 'ELECTIVE',
        major: 'English Literature'
      }
    ];

    // Create CSV content
    const headers = ['name', 'code', 'department', 'departmentCode', 'description', 'units', 'status', 'courseType', 'major'];
    const csvContent = [
      headers.join(','),
      ...templateData.map(row => 
        headers.map(header => {
          const value = row[header as keyof typeof row];
          // Wrap in quotes if contains comma or quote
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        }).join(',')
      )
    ].join('\n');

    // Return CSV file
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="course_import_template.csv"',
      },
    });
  } catch (error) {
    console.error('Error generating course template:', error);
    return NextResponse.json(
      { error: 'Failed to generate course template' },
      { status: 500 }
    );
  }
}
