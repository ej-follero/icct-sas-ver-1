import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AttendanceService } from '@/lib/services/attendance.service';

// Utility function for date validation
function isValidDate(dateString: string): boolean {
  const date = new Date(dateString);
  return !isNaN(date.getTime());
}

// Utility function to safely create Date objects
function safeCreateDate(dateString: string, fallback?: Date): Date {
  const date = new Date(dateString);
  if (!isNaN(date.getTime())) {
    return date;
  }
  console.warn('Invalid date string provided:', dateString, 'using fallback');
  return fallback || new Date();
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'student';
    const timeRange = searchParams.get('timeRange') || 'week';
    const departmentId = searchParams.get('departmentId');
    const riskLevel = searchParams.get('riskLevel');
    const subjectId = searchParams.get('subjectId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    console.log('Analytics API called with type:', type, 'timeRange:', timeRange, 'departmentId:', departmentId, 'riskLevel:', riskLevel);
    console.log('Date filters - startDate:', startDate, 'endDate:', endDate);
    console.log('Department filtering:', departmentId ? `Filtering for department ID: ${departmentId}` : 'No department filter (showing all departments)');
    
    // Debug current date and time range calculations
    const currentDate = new Date();
    console.log('Current date:', currentDate.toISOString());
    console.log('Current month:', currentDate.getMonth(), 'Current quarter:', Math.floor(currentDate.getMonth() / 3));

    // Build proper date filters based on timeRange - always use current dates for flexibility
    let startDateFilter: string | null = startDate;
    let endDateFilter: string | null = endDate;
    
    // Validate and sanitize user-provided dates
    if (startDateFilter) {
      if (!isValidDate(startDateFilter)) {
        console.warn('Invalid startDate provided:', startDateFilter, 'using default');
        startDateFilter = null;
      } else {
        startDateFilter = safeCreateDate(startDateFilter).toISOString();
      }
    }
    
    if (endDateFilter) {
      if (!isValidDate(endDateFilter)) {
        console.warn('Invalid endDate provided:', endDateFilter, 'using default');
        endDateFilter = null;
      } else {
        endDateFilter = safeCreateDate(endDateFilter).toISOString();
      }
    }
    
    if (!startDateFilter && !endDateFilter) {
      const now = new Date();
      
      if (timeRange === 'today') {
        startDateFilter = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
        endDateFilter = now.toISOString();
      } else if (timeRange === 'week') {
        startDateFilter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
        endDateFilter = now.toISOString();
      } else if (timeRange === 'month') {
        startDateFilter = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        endDateFilter = now.toISOString();
      } else if (timeRange === 'quarter') {
        const quarter = Math.floor(now.getMonth() / 3);
        startDateFilter = new Date(now.getFullYear(), quarter * 3, 1).toISOString();
        endDateFilter = now.toISOString();
      } else if (timeRange === 'year') {
        startDateFilter = new Date(now.getFullYear(), 0, 1).toISOString();
        endDateFilter = now.toISOString();
      }
    }
    
    // Debug the calculated date ranges
    console.log('Calculated date ranges for', timeRange, ':', {
      startDateFilter,
      endDateFilter,
      startDate: startDateFilter ? new Date(startDateFilter).toISOString() : 'none',
      endDate: endDateFilter ? new Date(endDateFilter).toISOString() : 'none'
    });
    
    // Get real attendance data from database
    const filters = {
      departmentId: departmentId ? parseInt(departmentId) : undefined,
      riskLevel: riskLevel || undefined,
      subjectId: subjectId ? parseInt(subjectId) : undefined,
      startDate: startDateFilter || undefined,
      endDate: endDateFilter || undefined
    };

    // Check if there's any attendance data in the database
    const totalAttendanceRecords = await prisma.attendance.count();
    console.log('Total attendance records in database:', totalAttendanceRecords);

    // Check instructor attendance records specifically
    const instructorAttendanceRecords = await prisma.attendance.findMany({
      where: {
        instructorId: { not: null }
      },
      take: 5,
      include: {
        instructor: {
          include: {
            Department: true
          }
        }
      }
    });
    console.log('Sample instructor attendance records:', instructorAttendanceRecords.map(r => ({
      id: r.attendanceId,
      instructorId: r.instructorId,
      status: r.status,
      timestamp: r.timestamp,
      department: r.instructor?.Department?.departmentName
    })));

    // Check if there's instructor attendance data
    const instructorAttendanceCount = await prisma.attendance.count({
      where: {
        instructorId: { not: null }
      }
    });
    console.log('Instructor attendance records in database:', instructorAttendanceCount);

    // If no instructor attendance data exists, create some sample data for testing
    if (instructorAttendanceCount === 0 && type === 'instructor') {
      console.log('No instructor attendance data found. Creating sample data for testing...');
      
      // Get some instructors to create sample attendance records
      const instructors = await prisma.instructor.findMany({
        take: 5,
        include: {
          Department: true
        }
      });

      if (instructors.length > 0) {
        const sampleAttendanceRecords = [];
        const now = new Date();
        
        // Create sample attendance records for the last 30 days
        for (let i = 0; i < 30; i++) {
          const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
          
          for (const instructor of instructors) {
            // Randomly determine attendance status
            const statuses = ['PRESENT', 'ABSENT', 'LATE'] as const;
            const status = statuses[Math.floor(Math.random() * statuses.length)];
            
            sampleAttendanceRecords.push({
              userId: 1, // Use a default user ID
              userRole: 'INSTRUCTOR' as const,
              status: status,
              attendanceType: 'MANUAL_ENTRY' as const,
              timestamp: date,
              instructorId: instructor.instructorId,
              subjectSchedId: null,
              studentId: null
            });
          }
        }
        
        // Insert sample data
        await prisma.attendance.createMany({
          data: sampleAttendanceRecords
        });
        
        console.log(`Created ${sampleAttendanceRecords.length} sample instructor attendance records`);
      }
    }

    // For now, use simplified approach that works
    let analytics;
    if (type === 'instructor') {
      analytics = {
        departmentStats: [],
        attendanceTrends: [],
        totalInstructors: await prisma.instructor.count(),
        averageAttendanceRate: 0
      };
    } else {
      const attendanceService = new AttendanceService();
      analytics = await attendanceService.getAttendanceAnalytics(filters);
    }

    // Get time-based data using current date filters
    let timeBasedData = [];
    const now = new Date();
    
    console.log('Fetching time-based data for range:', timeRange, 'with filters:', filters);
    
    switch (timeRange) {
      case 'today':
        timeBasedData = await getHourlyData(now, filters, type);
        break;
      case 'week':
        timeBasedData = await getWeeklyData(now, filters, type);
        break;
      case 'month':
        timeBasedData = await getMonthlyData(now, filters, type);
        break;
      case 'quarter':
        timeBasedData = await getQuarterlyData(now, filters, type);
        break;
      case 'year':
        timeBasedData = await getYearlyData(now, filters, type);
        break;
      default:
        timeBasedData = await getWeeklyData(now, filters, type);
    }
    
    console.log('Time-based data result:', {
      timeRange,
      dataLength: timeBasedData.length,
      totalRecords: timeBasedData.reduce((sum, day) => sum + (day.totalAttendance || 0), 0),
      presentRecords: timeBasedData.reduce((sum, day) => sum + (day.presentCount || 0), 0)
    });

    // Get department statistics using real data
    console.log('Calling getDepartmentStats with filters:', filters);
    const departmentStats = await getDepartmentStats(filters, type);

    // Use real data computations for all charts
    const riskLevelData = await getRiskLevelData(filters, type);
    const lateArrivalData = await getLateArrivalData(filters, type);
    const patternData = await getPatternAnalysisData(filters, type);
    const streakData = await getStreakAnalysisData(filters, type);

    console.log('API Response Data:', {
      timeBasedDataLength: timeBasedData.length,
      departmentStatsLength: departmentStats.length,
      riskLevelData,
      lateArrivalDataLength: lateArrivalData.length,
      patternDataLength: patternData.dailyPatterns?.length || 0,
      streakDataLength: streakData.data?.length || 0,
      filters,
      filterCombination: {
        department: filters.departmentId ? `Department ID: ${filters.departmentId}` : 'All Departments',
        riskLevel: filters.riskLevel ? `Risk Level: ${filters.riskLevel}` : 'All Risk Levels',
        timeRange: filters.startDate && filters.endDate ? `${filters.startDate} to ${filters.endDate}` : 'All Time'
      }
    });

    // Test: Log sample data to verify filtering is working
    if (timeBasedData.length > 0) {
      console.log('Sample time-based data:', timeBasedData.slice(0, 2));
    }
    if (departmentStats.length > 0) {
      console.log('Sample department stats:', departmentStats.slice(0, 2));
    }
    if (riskLevelData.length > 0) {
      console.log('Sample risk level data:', riskLevelData);
    }

    // Ensure consistent data structure even when no data is found
    const responseData = {
      analytics: analytics || {
        departmentStats: [],
        attendanceTrends: [],
        totalInstructors: 0,
        averageAttendanceRate: 0
      },
      timeBasedData: timeBasedData || [],
      departmentStats: departmentStats || [],
      riskLevelData: riskLevelData || [],
      lateArrivalData: lateArrivalData || [],
      patternData: patternData || { dailyPatterns: [], overallStats: {}, hourlyPatterns: [] },
      streakData: streakData || { data: [], stats: { maxGoodStreak: 0, maxPoorStreak: 0, currentStreak: 0, currentStreakType: 'none', totalGoodDays: 0, totalPoorDays: 0 } },
      generatedAt: new Date().toISOString()
    };

    console.log('API Response - Final data structure:', {
      timeBasedDataLength: responseData.timeBasedData.length,
      departmentStatsLength: responseData.departmentStats.length,
      riskLevelDataLength: responseData.riskLevelData.length,
      lateArrivalDataLength: responseData.lateArrivalData.length,
      patternDataLength: responseData.patternData.dailyPatterns?.length || 0,
      streakDataLength: responseData.streakData.data?.length || 0
    });

    return NextResponse.json({
      success: true,
      data: responseData
    });

  } catch (error) {
    console.error('Error in analytics API:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch attendance analytics',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Helper functions to get real database data
async function getHourlyData(date: Date, filters: any, type: string = 'student') {
  console.log('getHourlyData: Processing hourly data for', type, 'with date:', date.toISOString());
  
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const attendanceFilters = buildAttendanceFilters(filters, type);
  
  // Merge timestamp filters properly
  const timestampFilter: any = {
    gte: startOfDay,
    lte: endOfDay
  };
  
  // If user provided date filters, use those instead of the calculated day range
  if (filters.startDate || filters.endDate) {
    if (filters.startDate) {
      const startDate = new Date(filters.startDate);
      if (!isNaN(startDate.getTime())) {
        timestampFilter.gte = startDate;
      } else {
        console.warn('getHourlyData: Invalid startDate in filters:', filters.startDate);
      }
    }
    if (filters.endDate) {
      const endDate = new Date(filters.endDate);
      if (!isNaN(endDate.getTime())) {
        timestampFilter.lte = endDate;
      } else {
        console.warn('getHourlyData: Invalid endDate in filters:', filters.endDate);
      }
    }
  }
  
  console.log('getHourlyData - Timestamp filter:', timestampFilter);

  const attendanceData = await prisma.attendance.findMany({
    where: {
      timestamp: timestampFilter,
      ...(type === 'student' && attendanceFilters.student && { student: attendanceFilters.student }),
      ...(type === 'instructor' && attendanceFilters.instructor && { instructor: attendanceFilters.instructor }),
      ...(attendanceFilters.subjectSchedId && { subjectSchedId: attendanceFilters.subjectSchedId })
    },
    select: {
      timestamp: true,
      status: true
    }
  });

  console.log(`getHourlyData: Found ${attendanceData.length} records`);

  // Group by hour using UTC to avoid timezone issues
  const hourlyStats = new Array(24).fill(0).map((_, hour) => {
    // Use UTC methods to ensure consistent timezone handling
    const hourData = attendanceData.filter(a => {
      const utcHour = a.timestamp.getUTCHours();
      return utcHour === hour;
    });
    const present = hourData.filter(a => a.status === 'PRESENT').length;
    const total = hourData.length;
    
    return {
      hour,
      attendanceRate: total > 0 ? (present / total) * 100 : 0,
      totalAttendance: total,
      presentCount: present,
      label: `${hour.toString().padStart(2, '0')}:00`
    };
  });

  const result = hourlyStats.filter(stat => stat.totalAttendance > 0);
  console.log(`getHourlyData: Returning ${result.length} hours with data`);
  return result;
}

async function getWeeklyData(date: Date, filters: any, type: string = 'student') {
  // Use the actual date filters provided
  const attendanceFilters = buildAttendanceFilters(filters, type);
  
  // Use the filters directly - if no date filters, use current week
  const timestampFilter: any = {};
  
  if (filters.startDate || filters.endDate) {
    if (filters.startDate) {
      timestampFilter.gte = new Date(filters.startDate);
    }
    if (filters.endDate) {
      timestampFilter.lte = new Date(filters.endDate);
    }
  } else {
    // Default to current week if no filters provided
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - date.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);
    
    timestampFilter.gte = startOfWeek;
    timestampFilter.lte = endOfWeek;
  }
  
  // Build the where clause properly for instructor vs student
  const whereClause: any = {
    timestamp: timestampFilter,
    ...(attendanceFilters.subjectSchedId && { subjectSchedId: attendanceFilters.subjectSchedId })
  };

  if (type === 'student') {
    whereClause.studentId = { not: null };
    if (attendanceFilters.student) {
      whereClause.student = attendanceFilters.student;
    }
  } else if (type === 'instructor') {
    whereClause.instructorId = { not: null };
    if (attendanceFilters.instructor) {
      whereClause.instructor = attendanceFilters.instructor;
    }
  }

  console.log('Weekly data query whereClause:', whereClause);
  console.log('Filters applied:', filters);

  const attendanceData = await prisma.attendance.findMany({
    where: whereClause,
    select: {
      timestamp: true,
      status: true,
      instructorId: true,
      studentId: true
    }
  });
  
  console.log('Weekly attendance data length:', attendanceData.length);
  console.log('Sample weekly attendance data:', attendanceData.slice(0, 3));
  console.log(`${type} records:`, {
    instructorRecords: attendanceData.filter(a => a.instructorId).length,
    studentRecords: attendanceData.filter(a => a.studentId).length
  });

  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  console.log(`getWeeklyData: Processing ${attendanceData.length} records for weekly analysis`);
  
  const result = days.map((day, index) => {
    // Use UTC methods to ensure consistent timezone handling
    const dayData = attendanceData.filter(a => {
      const utcDay = a.timestamp.getUTCDay();
      return utcDay === index;
    });
    const present = dayData.filter(a => a.status === 'PRESENT').length;
    const total = dayData.length;
    
    console.log(`${day}: ${present}/${total} records (${total > 0 ? (present / total * 100).toFixed(1) : 0}%)`);
    
    return {
      day: index,
      attendanceRate: total > 0 ? (present / total) * 100 : 0,
      totalAttendance: total,
      presentCount: present,
      label: day
    };
  });
  
  console.log(`getWeeklyData: Returning data for ${result.filter(r => r.totalAttendance > 0).length} days with data`);
  return result;
}

async function getMonthlyData(date: Date, filters: any, type: string = 'student') {
  console.log('getMonthlyData - Month calculation:', {
    currentDate: date.toISOString(),
    currentMonth: date.getMonth(),
    userFilters: { startDate: filters.startDate, endDate: filters.endDate }
  });

  // Use the actual date filters provided
  const attendanceFilters = buildAttendanceFilters(filters, type);
  
  // Use the filters directly - if no date filters, use current month
  const timestampFilter: any = {};
  
  if (filters.startDate || filters.endDate) {
    if (filters.startDate) {
      timestampFilter.gte = new Date(filters.startDate);
    }
    if (filters.endDate) {
      timestampFilter.lte = new Date(filters.endDate);
    }
  } else {
    // Default to current month if no filters provided
    const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    endOfMonth.setHours(23, 59, 59, 999);
    
    timestampFilter.gte = startOfMonth;
    timestampFilter.lte = endOfMonth;
  }
  
  console.log('getMonthlyData - Final timestamp filter:', timestampFilter);
  
  // Build the where clause properly for instructor vs student
  const whereClause: any = {
    timestamp: timestampFilter,
    ...(attendanceFilters.subjectSchedId && { subjectSchedId: attendanceFilters.subjectSchedId })
  };

  if (type === 'student') {
    whereClause.studentId = { not: null };
    if (attendanceFilters.student) {
      whereClause.student = attendanceFilters.student;
    }
  } else if (type === 'instructor') {
    whereClause.instructorId = { not: null };
    if (attendanceFilters.instructor) {
      whereClause.instructor = attendanceFilters.instructor;
    }
  }

  console.log('Monthly data query whereClause:', whereClause);
  console.log('Monthly filters applied:', filters);

  const attendanceData = await prisma.attendance.findMany({
    where: whereClause,
    select: {
      timestamp: true,
      status: true
    }
  });

  console.log(`getMonthlyData: Processing ${attendanceData.length} records for monthly analysis`);
  
  const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const dailyStats = [];

  for (let day = 1; day <= daysInMonth; day++) {
    // Use UTC methods to ensure consistent timezone handling
    const dayData = attendanceData.filter(a => {
      const utcDate = a.timestamp.getUTCDate();
      const utcMonth = a.timestamp.getUTCMonth();
      const utcYear = a.timestamp.getUTCFullYear();
      
      // Check if the record is from the same month and day
      return utcDate === day && utcMonth === date.getMonth() && utcYear === date.getFullYear();
    });
    const present = dayData.filter(a => a.status === 'PRESENT').length;
    const total = dayData.length;
    
    if (total > 0) {
      console.log(`Day ${day}: ${present}/${total} records (${(present / total * 100).toFixed(1)}%)`);
    }
    
    dailyStats.push({
      date: `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`,
      attendanceRate: total > 0 ? (present / total) * 100 : 0,
      totalAttendance: total,
      presentCount: present,
      label: `${date.getMonth() + 1}/${day}`
    });
  }

  const result = dailyStats.filter(stat => stat.totalAttendance > 0);
  console.log(`getMonthlyData: Returning data for ${result.length} days with data`);
  return result;
}

async function getQuarterlyData(date: Date, filters: any, type: string = 'student') {
  const quarter = Math.floor(date.getMonth() / 3);
  const startOfQuarter = new Date(date.getFullYear(), quarter * 3, 1);
  const endOfQuarter = new Date(date.getFullYear(), (quarter + 1) * 3, 0);

  console.log('getQuarterlyData - Quarter calculation:', {
    currentDate: date.toISOString(),
    currentMonth: date.getMonth(),
    quarter,
    startOfQuarter: startOfQuarter.toISOString(),
    endOfQuarter: endOfQuarter.toISOString(),
    userFilters: { startDate: filters.startDate, endDate: filters.endDate }
  });

  const attendanceFilters = buildAttendanceFilters(filters, type);
  
  // Merge timestamp filters properly
  const timestampFilter: any = {
    gte: startOfQuarter,
    lte: endOfQuarter
  };
  
  // If user provided date filters, use those instead of the calculated quarter range
  if (filters.startDate || filters.endDate) {
    if (filters.startDate) {
      timestampFilter.gte = new Date(filters.startDate);
    }
    if (filters.endDate) {
      timestampFilter.lte = new Date(filters.endDate);
    }
  }
  
  console.log('getQuarterlyData - Final timestamp filter:', timestampFilter);
  
  const attendanceData = await prisma.attendance.findMany({
    where: {
      timestamp: timestampFilter,
      ...(type === 'student' && attendanceFilters.student && { student: attendanceFilters.student }),
      ...(type === 'instructor' && attendanceFilters.instructor && { instructor: attendanceFilters.instructor }),
      ...(attendanceFilters.subjectSchedId && { subjectSchedId: attendanceFilters.subjectSchedId })
    },
    select: {
      timestamp: true,
      status: true
    }
  });

  console.log(`getQuarterlyData: Processing ${attendanceData.length} records for quarterly analysis`);
  
  // Group by week
  const weeklyStats = [];
  const weeksInQuarter = Math.ceil((endOfQuarter.getTime() - startOfQuarter.getTime()) / (7 * 24 * 60 * 60 * 1000));

  for (let week = 1; week <= weeksInQuarter; week++) {
    const weekStart = new Date(startOfQuarter.getTime() + (week - 1) * 7 * 24 * 60 * 60 * 1000);
    const weekEnd = new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000);
    
    // Use UTC comparison to ensure consistent timezone handling
    const weekData = attendanceData.filter(a => {
      const recordTime = a.timestamp.getTime();
      return recordTime >= weekStart.getTime() && recordTime <= weekEnd.getTime();
    });
    
    const present = weekData.filter(a => a.status === 'PRESENT').length;
    const total = weekData.length;
    
    if (total > 0) {
      console.log(`Week ${week}: ${present}/${total} records (${(present / total * 100).toFixed(1)}%)`);
    }
    
    weeklyStats.push({
      week,
      attendanceRate: total > 0 ? (present / total) * 100 : 0,
      totalAttendance: total,
      presentCount: present,
      label: `Week ${week}`
    });
  }

  const result = weeklyStats.filter(stat => stat.totalAttendance > 0);
  console.log(`getQuarterlyData: Returning data for ${result.length} weeks with data`);
  return result;
}

async function getYearlyData(date: Date, filters: any, type: string = 'student') {
  const startOfYear = new Date(date.getFullYear(), 0, 1);
  const endOfYear = new Date(date.getFullYear(), 11, 31);

  const attendanceFilters = buildAttendanceFilters(filters, type);
  
  // Merge timestamp filters properly
  const timestampFilter: any = {
    gte: startOfYear,
    lte: endOfYear
  };
  
  // If user provided date filters, use those instead of the calculated year range
  if (filters.startDate || filters.endDate) {
    if (filters.startDate) {
      timestampFilter.gte = new Date(filters.startDate);
    }
    if (filters.endDate) {
      timestampFilter.lte = new Date(filters.endDate);
    }
  }
  
  const attendanceData = await prisma.attendance.findMany({
    where: {
      timestamp: timestampFilter,
      ...(type === 'student' && attendanceFilters.student && { student: attendanceFilters.student }),
      ...(type === 'instructor' && attendanceFilters.instructor && { instructor: attendanceFilters.instructor }),
      ...(attendanceFilters.subjectSchedId && { subjectSchedId: attendanceFilters.subjectSchedId })
    },
    select: {
      timestamp: true,
      status: true
    }
  });

  console.log(`getYearlyData: Processing ${attendanceData.length} records for yearly analysis`);
  
  const monthlyStats = [];

  for (let month = 0; month < 12; month++) {
    // Use UTC methods to ensure consistent timezone handling
    const monthData = attendanceData.filter(a => {
      const utcMonth = a.timestamp.getUTCMonth();
      const utcYear = a.timestamp.getUTCFullYear();
      
      // Check if the record is from the same month and year
      return utcMonth === month && utcYear === date.getFullYear();
    });
    const present = monthData.filter(a => a.status === 'PRESENT').length;
    const total = monthData.length;
    
    if (total > 0) {
      console.log(`Month ${month + 1}: ${present}/${total} records (${(present / total * 100).toFixed(1)}%)`);
    }
    
    monthlyStats.push({
      month: month + 1,
      attendanceRate: total > 0 ? (present / total) * 100 : 0,
      totalAttendance: total,
      presentCount: present,
      label: new Date(date.getFullYear(), month).toLocaleDateString('en-US', { month: 'short' })
    });
  }

  const result = monthlyStats.filter(stat => stat.totalAttendance > 0);
  console.log(`getYearlyData: Returning data for ${result.length} months with data`);
  return result;
}

async function getDepartmentStats(filters: any, type: string = 'student') {
  try {
    // Get department statistics with actual attendance calculations
    console.log(`getDepartmentStats: Processing ${type} data with department filter:`, filters.departmentId || 'all departments');
    
    const departmentStats = type === 'student' 
      ? await prisma.student.groupBy({
          by: ['departmentId'],
          where: buildStudentFilters(filters),
          _count: {
            studentId: true
          }
        })
      : await prisma.instructor.groupBy({
          by: ['departmentId'],
          where: filters.departmentId ? { departmentId: filters.departmentId } : {}, // Filter by specific department if provided
          _count: {
            instructorId: true
          }
        });
    
    console.log(`getDepartmentStats: Found ${departmentStats.length} departments for ${type}s`);

    const departments = await prisma.department.findMany({
      where: {
        departmentId: {
          in: departmentStats.map(s => s.departmentId).filter((id): id is number => id !== null)
        }
      }
    });

    // Calculate actual attendance rates per department
    const departmentAttendanceRates = await Promise.all(
      departmentStats.map(async (stat) => {
        try {
          if (!stat.departmentId) return null;

          // Get attendance records for this specific department
          const attendanceFilters = buildAttendanceFilters(filters);
          
          let attendanceData;
          if (type === 'student') {
            const studentFilters = buildStudentFilters(filters);
            attendanceData = await prisma.attendance.groupBy({
              by: ['status'],
              where: {
                student: {
                  departmentId: stat.departmentId,
                  ...studentFilters
                },
                ...(attendanceFilters.subjectSchedId && { subjectSchedId: attendanceFilters.subjectSchedId })
              },
              _count: {
                status: true
              }
            });
          } else {
            // For instructors
            attendanceData = await prisma.attendance.groupBy({
              by: ['status'],
              where: {
                instructor: {
                  departmentId: stat.departmentId
                },
                ...(attendanceFilters.subjectSchedId && { subjectSchedId: attendanceFilters.subjectSchedId }),
                ...(attendanceFilters.timestamp && { timestamp: attendanceFilters.timestamp })
              },
              _count: {
                status: true
              }
            });
          }

          // Calculate attendance rate for this department
          const totalRecords = attendanceData.reduce((sum, record) => sum + record._count.status, 0);
          const presentRecords = attendanceData.find(record => record.status === 'PRESENT')?._count.status || 0;
          const attendanceRate = totalRecords > 0 ? (presentRecords / totalRecords) * 100 : 0;

          console.log(`Department ${stat.departmentId} attendance: ${presentRecords}/${totalRecords} = ${attendanceRate.toFixed(1)}%`);

          return {
            departmentId: stat.departmentId,
            attendanceRate: Math.round(attendanceRate * 10) / 10, // Round to 1 decimal place
            totalRecords,
            presentRecords
          };
        } catch (error) {
          console.error('getDepartmentStats: Error processing department', stat.departmentId, ':', error);
          return null;
        }
      })
    );

    const result = departmentStats.map(stat => {
      const department = departments.find(d => d.departmentId === stat.departmentId);
      const attendanceData = departmentAttendanceRates.find(a => a?.departmentId === stat.departmentId);
      
      return {
        name: department?.departmentName || 'Unknown',
        code: department?.departmentCode || 'UNK',
        count: type === 'student' 
          ? (stat as any)._count.studentId 
          : (stat as any)._count.instructorId,
        attendanceRate: attendanceData?.attendanceRate || 0,
        trend: 'stable' as const
      };
    });

    return result;
  } catch (error) {
    console.error('getDepartmentStats: Error:', error);
    throw error;
  }
}

async function getRiskLevelData(filters: any, type: string = 'student') {
  // Calculate risk levels based on attendance rates
  const entities = type === 'student' 
    ? await prisma.student.findMany({
        where: buildStudentFilters(filters),
        include: {
          Attendance: {
            where: {
              ...(filters.startDate || filters.endDate ? {
                timestamp: {
                  ...(filters.startDate && { gte: new Date(filters.startDate) }),
                  ...(filters.endDate && { lte: new Date(filters.endDate) })
                }
              } : {})
            }
          }
        }
      })
    : await prisma.instructor.findMany({
        where: filters.departmentId ? { departmentId: filters.departmentId } : {}, // Apply department filter for instructors
        include: {
          Attendance: {
            where: {
              ...(filters.startDate || filters.endDate ? {
                timestamp: {
                  ...(filters.startDate && { gte: new Date(filters.startDate) }),
                  ...(filters.endDate && { lte: new Date(filters.endDate) })
                }
              } : {})
            }
          }
        }
      });

  console.log(`getRiskLevelData: Found ${entities.length} ${type}s with department and date filters applied`);

  const riskLevels = {
    low: 0,
    medium: 0,
    high: 0,
    none: 0
  };

  // Calculate risk levels for all entities first
  const entityRiskLevels: any[] = [];
  entities.forEach((entity: any) => {
    const totalAttendance = entity.Attendance.length;
    const presentAttendance = entity.Attendance.filter((a: any) => a.status === 'PRESENT').length;
    const attendanceRate = totalAttendance > 0 ? (presentAttendance / totalAttendance) * 100 : 0;
    
    // Align with instructor route thresholds
    // none: >= 90%
    // low: 85-89%
    // medium: 75-84%
    // high: < 75% (when > 0 records)
    let entityRiskLevel = 'none';
    if (attendanceRate >= 90) entityRiskLevel = 'none';
    else if (attendanceRate >= 85) entityRiskLevel = 'low';
    else if (attendanceRate >= 75) entityRiskLevel = 'medium';
    else if (attendanceRate > 0) entityRiskLevel = 'high';
    
    entityRiskLevels.push({
      entity,
      riskLevel: entityRiskLevel,
      attendanceRate
    });
  });

  // If a specific risk level is selected, only count entities with that risk level
  let entitiesToCount = entityRiskLevels;
  if (filters.riskLevel && filters.riskLevel !== 'all') {
    entitiesToCount = entityRiskLevels.filter(item => item.riskLevel === filters.riskLevel);
    console.log(`Risk level filtering: ${entityRiskLevels.length} total entities, ${entitiesToCount.length} with risk level '${filters.riskLevel}'`);
  } else {
    console.log(`No risk level filter: ${entityRiskLevels.length} total entities`);
  }

  // Calculate risk level distribution from the entities to count
  entitiesToCount.forEach((item: any) => {
    const riskLevel = item.riskLevel;
    if (riskLevel === 'low') riskLevels.low++;
    else if (riskLevel === 'medium') riskLevels.medium++;
    else if (riskLevel === 'high') riskLevels.high++;
    else riskLevels.none++;
  });

  return Object.entries(riskLevels).map(([level, count]) => ({
    level: level as 'low' | 'medium' | 'high' | 'none',
    count,
    percentage: entitiesToCount.length > 0 ? (count / entitiesToCount.length) * 100 : 0,
    color: level === 'low' ? '#10b981' : level === 'medium' ? '#f59e0b' : level === 'high' ? '#ef4444' : '#6b7280',
    trend: 'stable' as const
  }));
}

async function getLateArrivalData(filters: any, type: string = 'student') {
  const attendanceFilters = buildAttendanceFilters(filters, type);
  
  // Use the actual date filters provided
  const timestampFilter: any = {};
  
  if (filters.startDate || filters.endDate) {
    if (filters.startDate) {
      timestampFilter.gte = new Date(filters.startDate);
    }
    if (filters.endDate) {
      timestampFilter.lte = new Date(filters.endDate);
    }
  }
  
  const lateAttendance = await prisma.attendance.findMany({
    where: {
      status: 'LATE',
      timestamp: timestampFilter,
      ...(type === 'student' && attendanceFilters.student && { student: attendanceFilters.student }),
      ...(type === 'instructor' && attendanceFilters.instructor && { instructor: attendanceFilters.instructor }),
      ...(attendanceFilters.subjectSchedId && { subjectSchedId: attendanceFilters.subjectSchedId })
    },
    select: {
      timestamp: true
    }
  });

  // For instructor analytics, we need to format data for the line chart
  if (type === 'instructor') {
    // Use the same time-based data structure as attendance trends
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days.map((day, index) => {
      const dayData = lateAttendance.filter(a => a.timestamp.getDay() === index);
      const totalAttendance = lateAttendance.filter(a => a.timestamp.getDay() === index).length;
      const lateCount = dayData.length;
      
      return {
        day: index,
        lateRate: totalAttendance > 0 ? (lateCount / totalAttendance) * 100 : 0,
        lateCount: lateCount,
        totalAttendance: totalAttendance,
        label: day
      };
    });
  }

  // For student analytics, group by hour of day
  const hourlyLateStats = new Array(24).fill(0).map((_, hour) => {
    const hourData = lateAttendance.filter(a => a.timestamp.getHours() === hour);
    return {
      hour,
      lateCount: hourData.length,
      label: `${hour.toString().padStart(2, '0')}:00`
    };
  });

  return hourlyLateStats.filter(stat => stat.lateCount > 0);
}

async function getPatternAnalysisData(filters: any, type: string = 'student') {
  console.log('getPatternAnalysisData: Analyzing attendance patterns for', type);
  
  const attendanceFilters = buildAttendanceFilters(filters, type);
  
  // Use the actual date filters provided
  const timestampFilter: any = {};
  
  if (filters.startDate || filters.endDate) {
    if (filters.startDate) {
      timestampFilter.gte = new Date(filters.startDate);
    }
    if (filters.endDate) {
      timestampFilter.lte = new Date(filters.endDate);
    }
  } else {
    // Default to last 30 days if no filters provided
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    timestampFilter.gte = thirtyDaysAgo;
    timestampFilter.lte = new Date();
  }
  
  console.log('Pattern analysis timestamp filter:', timestampFilter);

  // Get detailed attendance data for pattern analysis
  const attendanceData = await prisma.attendance.findMany({
    where: {
      timestamp: timestampFilter,
      ...(type === 'student' && attendanceFilters.student && { student: attendanceFilters.student }),
      ...(type === 'instructor' && attendanceFilters.instructor && { instructor: attendanceFilters.instructor }),
      ...(attendanceFilters.subjectSchedId && { subjectSchedId: attendanceFilters.subjectSchedId })
    },
    select: {
      timestamp: true,
      status: true,
      instructorId: true,
      studentId: true
    },
    orderBy: {
      timestamp: 'asc'
    }
  });

  console.log(`Pattern analysis: Found ${attendanceData.length} attendance records`);

  // Group data by day of week and hour
  const dayHourPatterns = new Map();
  const dayPatterns = new Map();
  const hourPatterns = new Map();
  
  // Initialize patterns
  for (let day = 0; day < 7; day++) {
    dayPatterns.set(day, { present: 0, total: 0, late: 0, absent: 0 });
    for (let hour = 0; hour < 24; hour++) {
      const key = `${day}-${hour}`;
      dayHourPatterns.set(key, { present: 0, total: 0, late: 0, absent: 0 });
    }
  }
  
  for (let hour = 0; hour < 24; hour++) {
    hourPatterns.set(hour, { present: 0, total: 0, late: 0, absent: 0 });
  }

  // Analyze patterns from actual data using UTC to avoid timezone issues
  attendanceData.forEach(record => {
    const dayOfWeek = record.timestamp.getUTCDay();
    const hourOfDay = record.timestamp.getUTCHours();
    const key = `${dayOfWeek}-${hourOfDay}`;
    
    // Update day patterns
    const dayData = dayPatterns.get(dayOfWeek);
    dayData.total++;
    if (record.status === 'PRESENT') dayData.present++;
    else if (record.status === 'LATE') dayData.late++;
    else if (record.status === 'ABSENT') dayData.absent++;
    
    // Update hour patterns
    const hourData = hourPatterns.get(hourOfDay);
    hourData.total++;
    if (record.status === 'PRESENT') hourData.present++;
    else if (record.status === 'LATE') hourData.late++;
    else if (record.status === 'ABSENT') hourData.absent++;
    
    // Update day-hour patterns
    const dayHourData = dayHourPatterns.get(key);
    dayHourData.total++;
    if (record.status === 'PRESENT') dayHourData.present++;
    else if (record.status === 'LATE') dayHourData.late++;
    else if (record.status === 'ABSENT') dayHourData.absent++;
  });

  // Calculate moving averages and identify patterns
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  const patternAnalysis = days.map((dayName, dayIndex) => {
    const dayData = dayPatterns.get(dayIndex);
    const attendanceRate = dayData.total > 0 ? (dayData.present / dayData.total) * 100 : 0;
    const lateRate = dayData.total > 0 ? (dayData.late / dayData.total) * 100 : 0;
    const absentRate = dayData.total > 0 ? (dayData.absent / dayData.total) * 100 : 0;
    
    // Calculate moving average (3-day window)
    let movingAverage = attendanceRate;
    if (dayIndex > 0 && dayIndex < 6) {
      const prevDay = dayPatterns.get(dayIndex - 1);
      const nextDay = dayPatterns.get(dayIndex + 1);
      const prevRate = prevDay.total > 0 ? (prevDay.present / prevDay.total) * 100 : 0;
      const nextRate = nextDay.total > 0 ? (nextDay.present / nextDay.total) * 100 : 0;
      movingAverage = (prevRate + attendanceRate + nextRate) / 3;
    }
    
    // Identify peak and valley days based on actual data
    const allDayRates = Array.from(dayPatterns.values()).map(d => 
      d.total > 0 ? (d.present / d.total) * 100 : 0
    );
    const maxRate = Math.max(...allDayRates);
    const minRate = Math.min(...allDayRates.filter(rate => rate > 0));
    
    const isPeak = attendanceRate >= maxRate * 0.95; // Within 5% of max
    const isValley = attendanceRate <= minRate * 1.05 && attendanceRate > 0; // Within 5% of min
    
    // Analyze hourly patterns for this day
    const hourlyPatterns: Array<{
      hour: number;
      attendanceRate: number;
      totalRecords: number;
      presentRecords: number;
      label: string;
    }> = [];
    for (let hour = 0; hour < 24; hour++) {
      const hourData = dayHourPatterns.get(`${dayIndex}-${hour}`);
      if (hourData.total > 0) {
        const hourRate = (hourData.present / hourData.total) * 100;
        hourlyPatterns.push({
          hour,
          attendanceRate: hourRate,
          totalRecords: hourData.total,
          presentRecords: hourData.present,
          label: `${hour.toString().padStart(2, '0')}:00`
        });
      }
    }
    
    // Find peak hours for this day
    const peakHours = hourlyPatterns.length > 0 
      ? hourlyPatterns
          .filter(h => h.attendanceRate >= Math.max(...hourlyPatterns.map(h => h.attendanceRate)) * 0.9)
          .map(h => h.hour)
      : [];
    
    return {
      day: dayIndex,
      dayName,
      attendanceRate: Math.round(attendanceRate * 10) / 10,
      lateRate: Math.round(lateRate * 10) / 10,
      absentRate: Math.round(absentRate * 10) / 10,
      movingAverage: Math.round(movingAverage * 10) / 10,
      totalAttendance: dayData.total,
      presentCount: dayData.present,
      lateCount: dayData.late,
      absentCount: dayData.absent,
      isPeak,
      isValley,
      peakHours,
      hourlyPatterns: hourlyPatterns.slice(0, 10), // Limit to first 10 hours with data
      label: dayName,
      trend: attendanceRate > movingAverage ? 'up' : attendanceRate < movingAverage ? 'down' : 'stable'
    };
  });

  // Calculate overall patterns
  const overallStats = {
    bestDay: patternAnalysis.reduce((best, day) => 
      day.attendanceRate > best.attendanceRate ? day : best
    ),
    worstDay: patternAnalysis.reduce((worst, day) => 
      day.attendanceRate < worst.attendanceRate && day.attendanceRate > 0 ? day : worst
    ),
    averageAttendanceRate: patternAnalysis.reduce((sum, day) => sum + day.attendanceRate, 0) / patternAnalysis.length,
    totalRecords: attendanceData.length,
    analysisPeriod: {
      start: timestampFilter.gte,
      end: timestampFilter.lte
    }
  };

  console.log('Pattern analysis results:', {
    totalRecords: overallStats.totalRecords,
    averageRate: overallStats.averageAttendanceRate,
    bestDay: overallStats.bestDay?.dayName,
    worstDay: overallStats.worstDay?.dayName
  });

  return {
    dailyPatterns: patternAnalysis,
    overallStats,
    hourlyPatterns: Array.from(hourPatterns.entries()).map(([hour, data]) => ({
      hour,
      attendanceRate: data.total > 0 ? Math.round((data.present / data.total) * 100 * 10) / 10 : 0,
      totalRecords: data.total,
      presentRecords: data.present,
      label: `${hour.toString().padStart(2, '0')}:00`
    })).filter(h => h.totalRecords > 0)
  };
}

async function getStreakAnalysisData(filters: any, type: string = 'student') {
  // Get attendance data for streak analysis
  const attendanceFilters = buildAttendanceFilters(filters, type);
  
  const timestampFilter: any = {};
  
  if (filters.startDate || filters.endDate) {
    if (filters.startDate) {
      timestampFilter.gte = new Date(filters.startDate);
    }
    if (filters.endDate) {
      timestampFilter.lte = new Date(filters.endDate);
    }
  }

  const attendanceData = await prisma.attendance.findMany({
    where: {
      timestamp: timestampFilter,
      ...(type === 'student' && attendanceFilters.student && { student: attendanceFilters.student }),
      ...(type === 'instructor' && attendanceFilters.instructor && { instructor: attendanceFilters.instructor }),
      ...(attendanceFilters.subjectSchedId && { subjectSchedId: attendanceFilters.subjectSchedId })
    },
    select: {
      timestamp: true,
      status: true
    },
    orderBy: {
      timestamp: 'asc'
    }
  });

  // Group by day and calculate daily attendance rates
  const dailyData = new Map();
  attendanceData.forEach(record => {
    const dateKey = record.timestamp.toISOString().split('T')[0];
    if (!dailyData.has(dateKey)) {
      dailyData.set(dateKey, { present: 0, total: 0 });
    }
    const dayData = dailyData.get(dateKey);
    dayData.total++;
    if (record.status === 'PRESENT') {
      dayData.present++;
    }
  });

  // Convert to array and sort by date
  const sortedDays = Array.from(dailyData.entries())
    .map(([date, data]) => ({
      date,
      attendanceRate: data.total > 0 ? (data.present / data.total) * 100 : 0,
      isGood: (data.present / data.total) >= 0.85, // 85% threshold for good attendance
      totalRecords: data.total,
      presentRecords: data.present
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Calculate streaks
  let currentStreak = 0;
  let currentStreakType: 'good' | 'poor' | 'none' = 'none';
  let maxGoodStreak = 0;
  let maxPoorStreak = 0;
  let totalGoodDays = 0;
  let totalPoorDays = 0;

  const streakData = sortedDays.map((day, index) => {
    const isGood = day.isGood;
    
    if (isGood) totalGoodDays++;
    else totalPoorDays++;

    if (isGood && currentStreakType !== 'poor') {
      currentStreak++;
      currentStreakType = 'good';
    } else if (!isGood && currentStreakType !== 'good') {
      currentStreak++;
      currentStreakType = 'poor';
    } else {
      // Streak broken
      if (currentStreakType === 'good' && currentStreak > maxGoodStreak) {
        maxGoodStreak = currentStreak;
      } else if (currentStreakType === 'poor' && currentStreak > maxPoorStreak) {
        maxPoorStreak = currentStreak;
      }
      currentStreak = 1;
      currentStreakType = isGood ? 'good' : 'poor';
    }

    return {
      date: day.date,
      attendanceRate: day.attendanceRate,
      currentStreak: currentStreakType === 'good' ? currentStreak : -currentStreak,
      streakType: currentStreakType,
      isStreakBreak: index > 0 && sortedDays[index - 1].isGood !== isGood,
      totalRecords: day.totalRecords,
      presentRecords: day.presentRecords
    };
  });

  // Update final max streaks
  if (currentStreakType !== 'none' && currentStreak > 0) {
    if (currentStreakType === 'good' && currentStreak > maxGoodStreak) {
      maxGoodStreak = currentStreak;
    } else if (currentStreakType === 'poor' && currentStreak > maxPoorStreak) {
      maxPoorStreak = currentStreak;
    }
  }

  return {
    data: streakData,
    stats: {
      maxGoodStreak,
      maxPoorStreak,
      currentStreak: currentStreakType === 'none' ? 0 : currentStreak,
      currentStreakType: currentStreakType === 'none' ? 'none' as const : currentStreakType,
      totalGoodDays,
      totalPoorDays
    }
  };1
}

function buildAttendanceFilters(filters: any, type: string = 'student') {
  const where: any = {};
  
  if (filters.departmentId) {
    if (type === 'student') {
      where.student = {
        departmentId: filters.departmentId
      };
    } else if (type === 'instructor') {
      where.instructor = {
        departmentId: filters.departmentId
      };
    }
  }
  
  if (filters.subjectId) {
    where.subjectSchedId = filters.subjectId;
  }
  
  // Handle date filters properly with validation
  if (filters.startDate || filters.endDate) {
    where.timestamp = {};
    
    if (filters.startDate) {
      const startDate = new Date(filters.startDate);
      if (!isNaN(startDate.getTime())) {
        where.timestamp.gte = startDate;
      } else {
        console.warn('buildAttendanceFilters: Invalid startDate in filters:', filters.startDate);
      }
    }
    
    if (filters.endDate) {
      const endDate = new Date(filters.endDate);
      if (!isNaN(endDate.getTime())) {
        where.timestamp.lte = endDate;
      } else {
        console.warn('buildAttendanceFilters: Invalid endDate in filters:', filters.endDate);
      }
    }
  }
  
  console.log(`buildAttendanceFilters for ${type}:`, where);
  console.log('Input filters:', filters);
  
  return where;
}

function buildStudentFilters(filters: any) {
  const where: any = {};
  
  if (filters.departmentId) {
    where.departmentId = filters.departmentId;
  }
  
  return where;
}
