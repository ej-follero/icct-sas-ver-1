import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    console.log('Testing database connection...');
    
    // Test basic connection
    await prisma.$connect();
    console.log('Database connection successful');
    
    // Test a simple query
    const instructorCount = await prisma.instructor.count();
    console.log('Instructor count:', instructorCount);
    
    const departmentCount = await prisma.department.count();
    console.log('Department count:', departmentCount);
    
    const attendanceCount = await prisma.attendance.count();
    console.log('Attendance count:', attendanceCount);
    
    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      counts: {
        instructors: instructorCount,
        departments: departmentCount,
        attendance: attendanceCount
      }
    });
  } catch (error) {
    console.error('Database test failed:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Database test failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
} 