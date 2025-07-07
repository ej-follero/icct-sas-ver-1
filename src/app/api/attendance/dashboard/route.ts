import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];
    
    // Parse the date and set time boundaries
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    // Get all students with their attendance for the specified date
    const studentsWithAttendance = await prisma.student.findMany({
      where: {
        status: 'ACTIVE'
      },
      include: {
        Department: true,
        CourseOffering: true,
        Attendance: {
          where: {
            timestamp: {
              gte: startDate,
              lte: endDate
            }
          },
          orderBy: {
            timestamp: 'desc'
          },
          take: 1 // Get the latest attendance record for the day
        }
      }
    });

    // Calculate attendance statistics
    let totalPresent = 0;
    let totalLate = 0;
    let totalAbsent = 0;
    let totalExcused = 0;
    
    const departmentStats: Record<string, {
      name: string;
      present: number;
      total: number;
      rate: number;
    }> = {};

    studentsWithAttendance.forEach(student => {
      const departmentName = student.Department?.departmentName || 'Unknown';
      
      // Initialize department stats if not exists
      if (!departmentStats[departmentName]) {
        departmentStats[departmentName] = {
          name: departmentName,
          present: 0,
          total: 0,
          rate: 0
        };
      }
      
      departmentStats[departmentName].total += 1;
      
      // Check attendance status
      const latestAttendance = student.Attendance[0];
      if (latestAttendance) {
        switch (latestAttendance.status) {
          case 'PRESENT':
            totalPresent += 1;
            departmentStats[departmentName].present += 1;
            break;
          case 'LATE':
            totalLate += 1;
            departmentStats[departmentName].present += 1; // Late is still present
            break;
          case 'ABSENT':
            totalAbsent += 1;
            break;
          case 'EXCUSED':
            totalExcused += 1;
            break;
        }
      } else {
        // No attendance record = absent
        totalAbsent += 1;
      }
    });

    // Calculate department rates
    Object.keys(departmentStats).forEach(dept => {
      if (departmentStats[dept].total > 0) {
        departmentStats[dept].rate = Math.round(
          (departmentStats[dept].present / departmentStats[dept].total) * 100
        );
      }
    });

    const totalStudents = studentsWithAttendance.length;
    const overallAttendanceRate = totalStudents > 0 
      ? Math.round(((totalPresent + totalLate) / totalStudents) * 100)
      : 0;

    // Prepare response data
    const dashboardData = {
      summary: {
        totalStudents,
        totalPresent,
        totalLate,
        totalAbsent,
        totalExcused,
        overallAttendanceRate,
        presentPercentage: totalStudents > 0 ? Math.round((totalPresent / totalStudents) * 100) : 0,
        latePercentage: totalStudents > 0 ? Math.round((totalLate / totalStudents) * 100) : 0,
        absentPercentage: totalStudents > 0 ? Math.round((totalAbsent / totalStudents) * 100) : 0,
        excusedPercentage: totalStudents > 0 ? Math.round((totalExcused / totalStudents) * 100) : 0,
      },
      departments: Object.values(departmentStats).sort((a, b) => b.rate - a.rate),
      lastUpdated: new Date().toISOString(),
      date: date
    };

    return NextResponse.json(dashboardData);
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 