import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Get available departments from database
    const departments = await prisma.department.findMany({
      where: { departmentStatus: 'ACTIVE' },
      select: { departmentId: true, departmentName: true, departmentCode: true },
      orderBy: { departmentName: 'asc' }
    });

    // Define the template data for course import
    const templateData = [
      {
        name: 'Computer Science Fundamentals',
        code: 'CS101',
        departmentId: departments.find(d => d.departmentCode === 'CS')?.departmentId || 1,
        description: 'Introduction to computer science concepts and programming fundamentals',
        units: 3,
        status: 'ACTIVE',
        courseType: 'MANDATORY',
        major: 'Computer Science'
      },
      {
        name: 'Advanced Mathematics',
        code: 'MATH201',
        departmentId: departments.find(d => d.departmentCode === 'MATH')?.departmentId || 2,
        description: 'Advanced calculus and linear algebra for engineering students',
        units: 4,
        status: 'ACTIVE',
        courseType: 'MANDATORY',
        major: 'Mathematics'
      },
      {
        name: 'Creative Writing Workshop',
        code: 'ENG150',
        departmentId: departments.find(d => d.departmentCode === 'ENG')?.departmentId || 3,
        description: 'Developing creative writing skills through various literary forms',
        units: 2,
        status: 'ACTIVE',
        courseType: 'ELECTIVE',
        major: 'English Literature'
      }
    ];

    // Create CSV content with proper headers
    const headers = ['name', 'code', 'departmentId', 'description', 'units', 'status', 'courseType', 'major'];
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
