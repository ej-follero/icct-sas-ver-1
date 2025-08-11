import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Test database connection
    await prisma.$connect();
    
    // Test a simple query
    const departmentCount = await prisma.department.count();
    const instructorCount = await prisma.instructor.count();
    
    return NextResponse.json({
      status: 'success',
      message: 'Database connection successful',
      data: {
        departmentCount,
        instructorCount,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Database test failed:', error);
    
    return NextResponse.json({
      status: 'error',
      message: 'Database connection failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  } finally {
    try {
      await prisma.$disconnect();
    } catch (disconnectError) {
      console.error('Error disconnecting from database:', disconnectError);
    }
  }
} 