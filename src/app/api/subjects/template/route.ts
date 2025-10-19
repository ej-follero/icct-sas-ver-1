import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Get available departments and courses from database
    const [departments, courses] = await Promise.all([
      prisma.department.findMany({
        where: { departmentStatus: 'ACTIVE' },
        select: { departmentId: true, departmentName: true, departmentCode: true },
        orderBy: { departmentName: 'asc' }
      }),
      prisma.courseOffering.findMany({
        where: { courseStatus: 'ACTIVE' },
        select: { courseId: true, courseName: true, courseCode: true },
        orderBy: { courseName: 'asc' }
      })
    ]);

    // Define the template data for subject import
    const templateData = [
      {
        subjectName: 'Introduction to Programming',
        subjectCode: 'CS101',
        subjectType: 'LECTURE',
        courseId: courses.find(c => c.courseCode === 'CS')?.courseId || 1,
        departmentId: departments.find(d => d.departmentCode === 'CS')?.departmentId || 1,
        academicYear: '2024-2025',
        semester: 'FIRST_SEMESTER',
        totalHours: 54,
        lectureUnits: 3,
        labUnits: 0,
        creditedUnits: 3,
        description: 'Introduction to computer programming concepts',
        prerequisites: '',
        maxStudents: 30,
        status: 'ACTIVE'
      },
      {
        subjectName: 'Programming Laboratory',
        subjectCode: 'CS101L',
        subjectType: 'LABORATORY',
        courseId: courses.find(c => c.courseCode === 'CS')?.courseId || 1,
        departmentId: departments.find(d => d.departmentCode === 'CS')?.departmentId || 1,
        academicYear: '2024-2025',
        semester: 'FIRST_SEMESTER',
        totalHours: 54,
        lectureUnits: 0,
        labUnits: 3,
        creditedUnits: 3,
        description: 'Hands-on programming laboratory',
        prerequisites: 'CS101',
        maxStudents: 25,
        status: 'ACTIVE'
      },
      {
        subjectName: 'Data Structures and Algorithms',
        subjectCode: 'CS201',
        subjectType: 'HYBRID',
        courseId: courses.find(c => c.courseCode === 'CS')?.courseId || 1,
        departmentId: departments.find(d => d.departmentCode === 'CS')?.departmentId || 1,
        academicYear: '2024-2025',
        semester: 'SECOND_SEMESTER',
        totalHours: 72,
        lectureUnits: 2,
        labUnits: 2,
        creditedUnits: 4,
        description: 'Advanced data structures and algorithm design',
        prerequisites: 'CS101,CS101L',
        maxStudents: 30,
        status: 'ACTIVE'
      }
    ];

    // Create CSV content with proper headers
    const headers = [
      'subjectName', 'subjectCode', 'subjectType', 'courseId', 'departmentId', 
      'academicYear', 'semester', 'totalHours', 'lectureUnits', 'labUnits', 
      'creditedUnits', 'description', 'prerequisites', 'maxStudents', 'status'
    ];
    
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
        'Content-Disposition': 'attachment; filename="subjects_import_template.csv"',
      },
    });
  } catch (error) {
    console.error('Error generating subjects template:', error);
    return NextResponse.json(
      { error: 'Failed to generate subjects template' },
      { status: 500 }
    );
  }
}
