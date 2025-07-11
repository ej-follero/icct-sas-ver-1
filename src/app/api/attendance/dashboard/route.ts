import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];
    const groupBy = searchParams.get('groupBy') || 'department';
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
        StudentSection: {
          include: { Section: { include: { Course: true } } }
        },
        StudentSchedules: {
          include: { schedule: { include: { subject: true } } }
        },
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

    // Helper to get attendance status
    const getStatus = (student: any) => {
      const latestAttendance = student.Attendance[0];
      return latestAttendance ? latestAttendance.status : 'ABSENT';
    };

    // Grouping logic
    const groupStats: Record<string, { id: string; name: string; present: number; total: number; rate: number }> = {};
    if (groupBy === 'department') {
      studentsWithAttendance.forEach(student => {
        const key = student.Department?.departmentName || 'Unknown';
        if (!groupStats[key]) {
          groupStats[key] = { id: key, name: key, present: 0, total: 0, rate: 0 };
        }
        groupStats[key].total += 1;
        const status = getStatus(student);
        if (status === 'PRESENT' || status === 'LATE') groupStats[key].present += 1;
      });
    } else if (groupBy === 'year') {
      studentsWithAttendance.forEach(student => {
        const key = student.yearLevel || 'Unknown';
        if (!groupStats[key]) {
          groupStats[key] = { id: key, name: key, present: 0, total: 0, rate: 0 };
        }
        groupStats[key].total += 1;
        const status = getStatus(student);
        if (status === 'PRESENT' || status === 'LATE') groupStats[key].present += 1;
      });
    } else if (groupBy === 'course') {
      studentsWithAttendance.forEach(student => {
        const key = student.CourseOffering?.courseName || 'Unknown';
        if (!groupStats[key]) {
          groupStats[key] = { id: key, name: key, present: 0, total: 0, rate: 0 };
        }
        groupStats[key].total += 1;
        const status = getStatus(student);
        if (status === 'PRESENT' || status === 'LATE') groupStats[key].present += 1;
      });
    } else if (groupBy === 'section') {
      studentsWithAttendance.forEach(student => {
        const section = student.StudentSection?.[0]?.Section;
        const key = section?.sectionName || 'Unknown';
        if (!groupStats[key]) {
          groupStats[key] = { id: key, name: key, present: 0, total: 0, rate: 0 };
        }
        groupStats[key].total += 1;
        const status = getStatus(student);
        if (status === 'PRESENT' || status === 'LATE') groupStats[key].present += 1;
      });
    } else if (groupBy === 'subject') {
      studentsWithAttendance.forEach(student => {
        const subjects = student.StudentSchedules?.map(ss => ss.schedule?.subject?.subjectName).filter(Boolean) || [];
        if (subjects.length === 0) {
          const key = 'Unknown';
          if (!groupStats[key]) {
            groupStats[key] = { id: key, name: key, present: 0, total: 0, rate: 0 };
          }
          groupStats[key].total += 1;
          const status = getStatus(student);
          if (status === 'PRESENT' || status === 'LATE') groupStats[key].present += 1;
        } else {
          subjects.forEach((subject: string) => {
            const key = subject;
            if (!groupStats[key]) {
              groupStats[key] = { id: key, name: key, present: 0, total: 0, rate: 0 };
            }
            groupStats[key].total += 1;
            const status = getStatus(student);
            if (status === 'PRESENT' || status === 'LATE') groupStats[key].present += 1;
          });
        }
      });
    }

    // Calculate rates
    Object.keys(groupStats).forEach(key => {
      const group = groupStats[key];
      group.rate = group.total > 0 ? Math.round((group.present / group.total) * 1000) / 10 : 0;
    });

    // If groupBy is department, preserve old structure for backward compatibility
    if (groupBy === 'department') {
      // Calculate overall stats for summary
      let totalPresent = 0, totalLate = 0, totalAbsent = 0, totalExcused = 0;
      studentsWithAttendance.forEach(student => {
        const status = getStatus(student);
        if (status === 'PRESENT') totalPresent += 1;
        else if (status === 'LATE') totalLate += 1;
        else if (status === 'ABSENT') totalAbsent += 1;
        else if (status === 'EXCUSED') totalExcused += 1;
      });
      const totalStudents = studentsWithAttendance.length;
      const overallAttendanceRate = totalStudents > 0 
        ? Math.round(((totalPresent + totalLate) / totalStudents) * 100)
        : 0;
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
        departments: Object.values(groupStats).sort((a, b) => b.rate - a.rate),
        lastUpdated: new Date().toISOString(),
        date: date
      };
      return NextResponse.json(dashboardData);
    }

    // For other groupings, return stats array
    return NextResponse.json({
      stats: Object.values(groupStats).sort((a, b) => b.rate - a.rate),
      groupBy,
      lastUpdated: new Date().toISOString(),
      date: date
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 