import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Simple in-memory cache for analytics data
const analyticsCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'student';
    const timeRange = searchParams.get('timeRange') || 'week';
    const noCache = searchParams.get('noCache') === '1' || searchParams.get('noCache') === 'true';
    const departmentId = searchParams.get('departmentId');
    const riskLevel = searchParams.get('riskLevel');
    const subjectId = searchParams.get('subjectId');
    const courseId = searchParams.get('courseId');
    const sectionId = searchParams.get('sectionId');
    const yearLevel = searchParams.get('yearLevel');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    console.log('Analytics API called with params:', {
      type,
      timeRange,
      departmentId,
      riskLevel,
      subjectId,
      courseId,
      sectionId,
      startDate,
      endDate
    });

    // Create cache key
    const cacheKey = `${type}-${timeRange}-${departmentId || 'all'}-${riskLevel || 'all'}-${subjectId || 'all'}-${courseId || 'all'}-${sectionId || 'all'}-${yearLevel || 'all'}-${startDate || 'default'}-${endDate || 'default'}`;
    
    // Check cache first unless bypassed
    if (!noCache) {
      const cached = analyticsCache.get(cacheKey);
      if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
        console.log('Returning cached analytics data');
        return NextResponse.json(cached.data);
      }
    }

    // Calculate date range based on timeRange or custom range
    let dateStart: Date;
    let dateEnd: Date;

    if (startDate && endDate) {
      // Use custom date range if provided
      dateStart = new Date(startDate);
      dateEnd = new Date(endDate);
      // Set dateEnd to end of the day
      dateEnd.setHours(23, 59, 59, 999);
    } else {
    switch (timeRange) {
      case 'today':
          // Use current date
          const today = new Date();
          dateStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
          dateEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        break;
      case 'week':
          // Use current week
          const now = new Date();
          const weekStart = new Date(now);
          weekStart.setDate(now.getDate() - now.getDay());
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekStart.getDate() + 6);
          dateStart = weekStart;
          dateEnd = weekEnd;
        break;
      case 'month':
          // Use current month
          const currentMonth = new Date();
          dateStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
          dateEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
        break;
      case 'quarter':
          // Use current quarter
          const currentQuarter = new Date();
          const quarterStart = new Date(currentQuarter.getFullYear(), Math.floor(currentQuarter.getMonth() / 3) * 3, 1);
          const quarterEnd = new Date(currentQuarter.getFullYear(), Math.floor(currentQuarter.getMonth() / 3) * 3 + 3, 0);
          dateStart = quarterStart;
          dateEnd = quarterEnd;
        break;
      case 'year':
          // Use current year - this will show data because seeded data is in 2025
          const currentYear = new Date();
          dateStart = new Date(currentYear.getFullYear(), 0, 1);
          dateEnd = new Date(currentYear.getFullYear(), 11, 31);
        break;
      default:
          // Default to current year
          const defaultYear = new Date();
          dateStart = new Date(defaultYear.getFullYear(), 0, 1);
          dateEnd = new Date(defaultYear.getFullYear(), 11, 31);
      }
    }

    console.log('Date range:', { dateStart, dateEnd });

    // Build where clause for attendance records
    const attendanceWhere: any = {
      timestamp: {
        gte: dateStart,
        lte: dateEnd
      }
    };

    // Build a separate student where for total enrolled count (ignores date range)
    const studentWhere: any = {};

    // Add department filter if specified (accepts numeric ID or code)
    if (departmentId && departmentId !== 'all') {
      const deptNum = Number(departmentId);
      if (!Number.isNaN(deptNum) && Number.isFinite(deptNum)) {
        attendanceWhere.student = {
          ...attendanceWhere.student,
          departmentId: deptNum
        };
        studentWhere.departmentId = deptNum;
      } else {
        attendanceWhere.student = {
          ...attendanceWhere.student,
          Department: {
            ...(attendanceWhere.student?.Department || {}),
            is: {
              ...(attendanceWhere.student?.Department?.is || {}),
              departmentCode: departmentId
            }
          }
        };
        studentWhere.Department = { is: { departmentCode: departmentId } };
      }
    }

    // Add course filter for student if specified (accepts numeric ID or courseCode)
    if (courseId && courseId !== 'all') {
      const cNum = Number(courseId);
      if (!Number.isNaN(cNum) && Number.isFinite(cNum)) {
        attendanceWhere.student = {
          ...attendanceWhere.student,
          courseId: cNum
        };
        studentWhere.courseId = cNum;
      } else {
        attendanceWhere.student = {
          ...attendanceWhere.student,
          CourseOffering: {
            ...(attendanceWhere.student?.CourseOffering || {}),
            is: {
              ...(attendanceWhere.student?.CourseOffering?.is || {}),
              courseCode: courseId
            }
          }
        };
        studentWhere.CourseOffering = { is: { courseCode: courseId } };
      }
    }

    // Add year level filter if specified (Student.yearLevel enum)
    if (yearLevel && yearLevel !== 'all') {
      attendanceWhere.student = {
        ...attendanceWhere.student,
        yearLevel: yearLevel as any
      };
      studentWhere.yearLevel = yearLevel as any;
    }

    // Add subject filter if specified
    if (subjectId && subjectId !== 'all') {
      attendanceWhere.subjectSchedule = {
        ...attendanceWhere.subjectSchedule,
        subject: {
          ...(attendanceWhere.subjectSchedule?.subject || {}),
          subjectId: parseInt(subjectId)
        }
      };
    }

    // Add course filter for subject schedule if specified (accepts numeric ID or courseCode)
    if (courseId && courseId !== 'all') {
      const cNum2 = Number(courseId);
      if (!Number.isNaN(cNum2) && Number.isFinite(cNum2)) {
        attendanceWhere.subjectSchedule = {
          ...attendanceWhere.subjectSchedule,
          subject: {
            ...(attendanceWhere.subjectSchedule?.subject || {}),
            CourseOffering: {
              ...(attendanceWhere.subjectSchedule?.subject?.CourseOffering || {}),
              courseId: cNum2
            }
          }
        };
      } else {
        attendanceWhere.subjectSchedule = {
          ...attendanceWhere.subjectSchedule,
          subject: {
            ...(attendanceWhere.subjectSchedule?.subject || {}),
            CourseOffering: {
              ...(attendanceWhere.subjectSchedule?.subject?.CourseOffering || {}),
              is: {
                ...((attendanceWhere.subjectSchedule?.subject?.CourseOffering as any)?.is || {}),
                courseCode: courseId
              }
            }
          }
        };
      }
    }

    // Add section filter if specified
    if (sectionId && sectionId !== 'all') {
      attendanceWhere.subjectSchedule = {
        ...attendanceWhere.subjectSchedule,
        sectionId: parseInt(sectionId)
      };
      studentWhere.StudentSection = {
        some: { sectionId: parseInt(sectionId) }
      };
    }

    // Get attendance records with optimized query
    const attendanceRecords = await prisma.attendance.findMany({
      where: attendanceWhere,
      select: {
        attendanceId: true,
        status: true,
        timestamp: true,
        studentId: true,
        student: {
          select: {
            studentId: true,
            departmentId: true,
            courseId: true,
            Department: {
              select: {
                departmentId: true,
                departmentName: true,
                departmentCode: true
              }
            },
            CourseOffering: {
              select: {
                courseId: true,
                courseCode: true,
                courseName: true
              }
            }
          }
        },
        subjectSchedule: {
          select: {
            subjectSchedId: true,
            subject: {
              select: {
                subjectId: true,
                subjectCode: true,
                subjectName: true,
                CourseOffering: {
                  select: {
                    courseId: true,
                    courseCode: true,
                    courseName: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        timestamp: 'asc'
      }
      // Note: For year view, we need all records to properly aggregate by month
      // Removed the take limit to allow processing all records across months
    });

    console.log(`Found ${attendanceRecords.length} attendance records`);
  console.log('Sample attendance records:', attendanceRecords.slice(0, 5).map(r => ({
    timestamp: r.timestamp,
    month: r.timestamp.getMonth() + 1,
    status: r.status
  })));

    // Compute total enrolled students matching filters (ignoring date range)
    const totalStudents = await prisma.student.count({ where: studentWhere });

    // Process data for charts
    const timeBasedData = processTimeBasedData(attendanceRecords, timeRange, dateStart, dateEnd);
    const departmentStats = processDepartmentStats(attendanceRecords);
    const riskLevelData = processRiskLevelData(attendanceRecords);
    const lateArrivalData = processLateArrivalData(attendanceRecords, timeRange, dateStart, dateEnd);

    // Process pattern and streak analysis data
    const patternData = processPatternAnalysis(attendanceRecords, timeRange, dateStart, dateEnd);
    const streakData = processStreakAnalysis(attendanceRecords, timeRange, dateStart, dateEnd);

    // Build summary for quick cards based on the filtered dataset
    const uniqueStudentIds = new Set<number>();
    let presentCount = 0;
    let lateCount = 0;
    let absentCount = 0;
    let excusedCount = 0;
    for (let i = 0; i < attendanceRecords.length; i++) {
      const r = attendanceRecords[i];
      if (r.studentId != null) uniqueStudentIds.add(r.studentId);
      switch (r.status) {
        case 'PRESENT':
          presentCount++;
          break;
        case 'LATE':
          lateCount++;
          break;
        case 'ABSENT':
          absentCount++;
          break;
        case 'EXCUSED':
          excusedCount++;
          break;
      }
    }
    const totalAttendance = attendanceRecords.length;
    const attendanceRateSummary = totalAttendance > 0 ? ((presentCount + lateCount) / totalAttendance) * 100 : 0;

    const result = {
      success: true,
      data: {
        timeBasedData,
        departmentStats,
        riskLevelData,
        lateArrivalData,
        patternData,
        streakData,
        summary: {
          totalStudents, // enrolled matching filters
          uniqueStudentsWithAttendance: uniqueStudentIds.size,
          presentCount,
          lateCount,
          absentCount,
          excusedCount,
          totalAttendance,
          attendanceRate: attendanceRateSummary
        }
      }
    };

    console.log('Analytics data processed:', {
      timeBasedDataLength: timeBasedData.length,
      departmentStatsLength: departmentStats.length,
      riskLevelDataLength: riskLevelData.length,
      lateArrivalDataLength: lateArrivalData.length,
      patternDataLength: patternData.length,
      streakDataLength: streakData.data.length
    });

    // Cache the result unless bypassed
    if (!noCache) {
      analyticsCache.set(cacheKey, {
        data: result,
        timestamp: Date.now()
      });
    }

    return NextResponse.json(result);

        } catch (error) {
    console.error('Error in analytics API:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch analytics data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

function processTimeBasedData(records: any[], timeRange: string, dateStart: Date, dateEnd: Date) {
  const dataMap = new Map();
  
  // Pre-calculate time range multipliers for performance
  const timeMultipliers = {
    'today': 1,
    'week': 1,
    'month': 1,
    'quarter': 7 * 24 * 60 * 60 * 1000,
    'year': 1
  };
  
  const multiplier = timeMultipliers[timeRange as keyof typeof timeMultipliers] || 1;
  
  for (let i = 0; i < records.length; i++) {
    const record = records[i];
    const timestamp = new Date(record.timestamp);
    let key: string;
    
    switch (timeRange) {
      case 'today':
        key = timestamp.getHours().toString();
        break;
      case 'week':
        // Group by week for better trend visualization
        const weekStart = new Date(timestamp);
        weekStart.setDate(timestamp.getDate() - timestamp.getDay());
        key = weekStart.toISOString().split('T')[0];
        break;
      case 'month':
        // Group by week for month view to show trends
        const monthWeekStart = new Date(timestamp);
        monthWeekStart.setDate(timestamp.getDate() - timestamp.getDay());
        key = monthWeekStart.toISOString().split('T')[0];
        break;
      case 'quarter':
        const weekNumber = Math.ceil((timestamp.getTime() - dateStart.getTime()) / multiplier);
        key = `Week ${weekNumber}`;
        break;
      case 'year':
        // Group by month for year view
        key = (timestamp.getMonth() + 1).toString();
        break;
      default:
        key = timestamp.toISOString().split('T')[0];
    }
    
    if (!dataMap.has(key)) {
      dataMap.set(key, {
        presentCount: 0,
        absentCount: 0,
        lateCount: 0,
        excusedCount: 0,
        totalCount: 0,
        attendanceRate: 0
      });
    }
    
    const data = dataMap.get(key);
    data.totalCount++;
    
    // Use direct property access for better performance
    switch (record.status) {
      case 'PRESENT':
        data.presentCount++;
        break;
      case 'ABSENT':
        data.absentCount++;
        break;
      case 'LATE':
        data.lateCount++;
        break;
      case 'EXCUSED':
        data.excusedCount++;
        break;
    }
  }
  
  // Calculate attendance rates in batch
  for (const [key, data] of dataMap.entries()) {
    data.attendanceRate = data.totalCount > 0 
      ? ((data.presentCount + data.lateCount) / data.totalCount) * 100 
      : 0;
  }
  
  const result = Array.from(dataMap.entries()).map(([key, value]) => ({
    [timeRange === 'today' ? 'hour' : timeRange === 'year' ? 'month' : 'date']: key,
    attendanceRate: value.attendanceRate,
    presentCount: value.presentCount,
    lateCount: value.lateCount,
    absentCount: value.absentCount,
    totalCount: value.totalCount,
    week: timeRange === 'week' ? key : undefined
  }));
  
  console.log(`📊 processTimeBasedData - Generated ${result.length} data points for ${timeRange}:`, result);
  console.log(`📊 processTimeBasedData - DataMap entries:`, Array.from(dataMap.entries()));
  return result;
}

function processDepartmentStats(records: any[]) {
  const deptMap = new Map();
  
  records.forEach(record => {
    const dept = record.student?.Department;
    if (!dept) return;
    
    const deptKey = dept.departmentName;
    if (!deptMap.has(deptKey)) {
      deptMap.set(deptKey, {
        departmentId: dept.departmentId,
        name: dept.departmentName,
        code: dept.departmentCode,
        totalClasses: 0,
        attendedClasses: 0,
        attendanceRate: 0,
        count: 0
      });
    }
    
    const data = deptMap.get(deptKey);
    data.totalClasses++;
    data.count++;
    
    if (record.status === 'PRESENT' || record.status === 'LATE') {
      data.attendedClasses++;
    }
    
    data.attendanceRate = data.totalClasses > 0 
      ? (data.attendedClasses / data.totalClasses) * 100 
      : 0;
  });
  
  return Array.from(deptMap.values());
}

function processRiskLevelData(records: any[]) {
  const riskMap = new Map();
  
  // Group records by entity (student or instructor)
  const entityMap = new Map();
  
  records.forEach(record => {
    const entityId = record.studentId;
    if (!entityId) return;
    
    if (!entityMap.has(entityId)) {
      entityMap.set(entityId, {
        total: 0,
        present: 0,
        absent: 0,
        late: 0,
        excused: 0
      });
    }
    
    const entityData = entityMap.get(entityId);
    entityData.total++;
    
    switch (record.status) {
      case 'PRESENT':
        entityData.present++;
        break;
      case 'ABSENT':
        entityData.absent++;
        break;
      case 'LATE':
        entityData.late++;
        break;
      case 'EXCUSED':
        entityData.excused++;
        break;
    }
  });
  
  // Calculate risk levels for each entity
  entityMap.forEach((entityData, entityId) => {
    const attendanceRate = entityData.total > 0 
      ? ((entityData.present + entityData.late) / entityData.total) * 100 
      : 0;
    
    let riskLevel: string;
    if (attendanceRate >= 90) riskLevel = 'none';
    else if (attendanceRate >= 75) riskLevel = 'low';
    else if (attendanceRate >= 50) riskLevel = 'medium';
    else riskLevel = 'high';
    
    if (!riskMap.has(riskLevel)) {
      riskMap.set(riskLevel, { level: riskLevel, count: 0 });
    }
    
    riskMap.get(riskLevel).count++;
  });
  
  return Array.from(riskMap.values());
}

function processLateArrivalData(records: any[], timeRange: string, dateStart: Date, dateEnd: Date) {
  const dataMap = new Map();
  
  records.forEach(record => {
    if (record.status !== 'LATE') return;
    
    const timestamp = new Date(record.timestamp);
    let key: string;
    
    switch (timeRange) {
      case 'today':
        key = timestamp.getHours().toString();
        break;
      case 'week':
        // Group by week for better trend visualization
        const weekStart = new Date(timestamp);
        weekStart.setDate(timestamp.getDate() - timestamp.getDay());
        key = weekStart.toISOString().split('T')[0];
        break;
      case 'month':
        // Group by week for month view to show trends
        const monthWeekStart = new Date(timestamp);
        monthWeekStart.setDate(timestamp.getDate() - timestamp.getDay());
        key = monthWeekStart.toISOString().split('T')[0];
        break;
      case 'quarter':
        const weekNumber = Math.ceil((timestamp.getTime() - dateStart.getTime()) / (7 * 24 * 60 * 60 * 1000));
        key = `Week ${weekNumber}`;
        break;
      case 'year':
        // Group by month for year view
        key = (timestamp.getMonth() + 1).toString();
        break;
      default:
        key = timestamp.toISOString().split('T')[0];
    }
    
    if (!dataMap.has(key)) {
      dataMap.set(key, { lateCount: 0, totalCount: 0 });
    }
    
    dataMap.get(key).lateCount++;
    dataMap.get(key).totalCount++;
  });
  
  // Calculate late rates as percentages
  for (const [key, data] of dataMap.entries()) {
    data.lateRate = data.totalCount > 0 ? (data.lateCount / data.totalCount) * 100 : 0;
  }
  
  const result = Array.from(dataMap.entries()).map(([key, value]) => ({
    [timeRange === 'today' ? 'hour' : timeRange === 'year' ? 'month' : 'date']: key,
    lateRate: value.lateRate,
    lateCount: value.lateCount,
    totalCount: value.totalCount,
    week: timeRange === 'week' ? key : undefined
  }));
  
  console.log(`📊 processLateArrivalData - Generated ${result.length} data points for ${timeRange}:`, result);
  console.log(`📊 processLateArrivalData - DataMap entries:`, Array.from(dataMap.entries()));
  return result;
}

function processPatternAnalysis(records: any[], timeRange: string, dateStart: Date, dateEnd: Date) {
  const patternMap = new Map();
  
  // Group records by day to analyze patterns
  records.forEach(record => {
    const timestamp = new Date(record.timestamp);
    const dayKey = timestamp.toISOString().split('T')[0];
    
    if (!patternMap.has(dayKey)) {
      patternMap.set(dayKey, {
        date: dayKey,
        presentCount: 0,
        absentCount: 0,
        lateCount: 0,
        totalClasses: 0,
        attendanceRate: 0
      });
    }
    
    const data = patternMap.get(dayKey);
    data.totalClasses++;
    
    switch (record.status) {
      case 'PRESENT':
        data.presentCount++;
        break;
      case 'ABSENT':
        data.absentCount++;
        break;
      case 'LATE':
        data.lateCount++;
        break;
    }
    
    data.attendanceRate = data.totalClasses > 0 
      ? ((data.presentCount + data.lateCount) / data.totalClasses) * 100 
      : 0;
  });
  
  // Convert to array and sort by date
  const patternData = Array.from(patternMap.values()).sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  
  // Add moving average calculation
  const windowSize = Math.min(7, patternData.length);
  for (let i = 0; i < patternData.length; i++) {
    const start = Math.max(0, i - windowSize + 1);
    const end = i + 1;
    const window = patternData.slice(start, end);
    const avgRate = window.reduce((sum, day) => sum + day.attendanceRate, 0) / window.length;
    patternData[i].movingAverage = Math.round(avgRate * 100) / 100;
  }
  
  return patternData;
}

function processStreakAnalysis(records: any[], timeRange: string, dateStart: Date, dateEnd: Date) {
  const streakMap = new Map();
  
  // Group records by student to analyze individual streaks
  records.forEach(record => {
    const studentId = record.studentId || record.instructorId;
    if (!streakMap.has(studentId)) {
      streakMap.set(studentId, {
        studentId,
        currentStreak: 0,
        longestStreak: 0,
        totalDays: 0,
        presentDays: 0,
        streakType: 'present' // or 'absent'
      });
    }
    
    const data = streakMap.get(studentId);
    data.totalDays++;
    
    if (record.status === 'PRESENT' || record.status === 'LATE') {
      data.presentDays++;
      if (data.streakType === 'present') {
        data.currentStreak++;
      } else {
        data.currentStreak = 1;
        data.streakType = 'present';
      }
    } else {
      if (data.streakType === 'absent') {
        data.currentStreak++;
      } else {
        data.currentStreak = 1;
        data.streakType = 'absent';
      }
    }
    
    data.longestStreak = Math.max(data.longestStreak, data.currentStreak);
  });
  
  // Convert to array and calculate streak statistics
  const streakData = Array.from(streakMap.values()).map(data => ({
    studentId: data.studentId,
    currentStreak: data.currentStreak,
    longestStreak: data.longestStreak,
    totalDays: data.totalDays,
    presentDays: data.presentDays,
    attendanceRate: data.totalDays > 0 ? (data.presentDays / data.totalDays) * 100 : 0,
    streakType: data.streakType
  }));
  
  // Calculate overall statistics for the UI
  const goodStreaks = streakData.filter(s => s.streakType === 'present' && s.attendanceRate >= 85);
  const poorStreaks = streakData.filter(s => s.streakType === 'absent' && s.attendanceRate < 85);
  
  const maxGoodStreak = goodStreaks.length > 0 ? Math.max(...goodStreaks.map(s => s.longestStreak)) : 0;
  const maxPoorStreak = poorStreaks.length > 0 ? Math.max(...poorStreaks.map(s => s.longestStreak)) : 0;
  
  // Calculate current streak (average of all current streaks)
  const currentStreak = streakData.length > 0 ? 
    Math.round(streakData.reduce((sum, s) => sum + s.currentStreak, 0) / streakData.length) : 0;
  
  // Determine current streak type based on average attendance
  const avgAttendance = streakData.length > 0 ? 
    streakData.reduce((sum, s) => sum + s.attendanceRate, 0) / streakData.length : 0;
  const currentStreakType = avgAttendance >= 85 ? 'good' : 'poor';
  
  // Calculate total good days
  const totalGoodDays = streakData.reduce((sum, s) => sum + s.presentDays, 0);
  
  const stats = {
    maxGoodStreak,
    maxPoorStreak,
    currentStreak,
    currentStreakType,
    totalGoodDays,
    totalStudents: streakData.length,
    averageStreak: streakData.reduce((sum, s) => sum + s.currentStreak, 0) / streakData.length,
    longestStreak: Math.max(...streakData.map(s => s.longestStreak)),
    presentStreaks: streakData.filter(s => s.streakType === 'present').length,
    absentStreaks: streakData.filter(s => s.streakType === 'absent').length
  };
  
  console.log('Streak analysis stats:', stats);
  
  return {
    data: streakData,
    stats
  };
}