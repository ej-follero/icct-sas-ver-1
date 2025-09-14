import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const instructorId = searchParams.get('instructorId');
    const departmentId = searchParams.get('departmentId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const subjectName = searchParams.get('subjectName');

    console.log('Received instructor attendance filter parameters:', {
      instructorId,
      departmentId,
      startDate,
      endDate,
      status,
      search
    });

    // First, get all instructors with their basic information
    const instructors = await prisma.instructor.findMany({
      where: {
        ...(instructorId && { instructorId: parseInt(instructorId) }),
        ...(departmentId && { departmentId: parseInt(departmentId) }),
        ...(search && {
          OR: [
            { firstName: { contains: search, mode: 'insensitive' } },
            { lastName: { contains: search, mode: 'insensitive' } },
            { employeeId: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
            { Department: { departmentName: { contains: search, mode: 'insensitive' } } }
          ]
        })
      },
      include: {
        Department: {
          select: {
            departmentId: true,
            departmentName: true,
            departmentCode: true
          }
        },
        Subjects: {
          select: {
            subjectId: true,
            subjectName: true,
            subjectCode: true
          }
        },
        Attendance: {
          where: {
            ...(startDate && endDate && {
              timestamp: {
                gte: new Date(startDate),
                lte: new Date(endDate)
              }
            }),
            ...(status && { status: status as any })
          },
          include: {
            subjectSchedule: {
              include: {
                subject: true,
                room: true
              }
            }
          },
          orderBy: {
            timestamp: 'desc'
          },
          take: 100 // Limit to recent 100 records for performance
        }
      },
      orderBy: {
        firstName: 'asc'
      }
    });

    console.log('Found instructors:', instructors.length);

    // If no instructors found, return empty array instead of error
    if (instructors.length === 0) {
      console.log('No instructors found, returning empty array');
      return NextResponse.json([]);
    }

    // Transform instructor data with attendance metrics
    const transformedInstructors = await Promise.all(instructors.map(async (instructor) => {
      // Optionally filter by subject name if requested
      const attendanceRecords = (instructor.Attendance || []).filter((rec) => {
        if (!subjectName) return true;
        const recSubject = rec.subjectSchedule?.subject?.subjectName || '';
        return recSubject.toLowerCase().includes(subjectName.toLowerCase());
      });
      
      // Safely calculate attendance metrics
      const totalScheduledClasses = attendanceRecords.length || 0;
      const attendedClasses = attendanceRecords.filter(r => r.status === 'PRESENT').length;
      const absentClasses = attendanceRecords.filter(r => r.status === 'ABSENT').length;
      const lateClasses = attendanceRecords.filter(r => r.status === 'LATE').length;
      const onLeaveClasses = attendanceRecords.filter(r => r.status === 'EXCUSED').length;

      const attendanceRate = totalScheduledClasses > 0 
        ? (attendedClasses / totalScheduledClasses) * 100 
        : 100; // Default to 100% if no records (new instructor)

      const punctualityScore = (attendedClasses + lateClasses) > 0
        ? (attendedClasses / (attendedClasses + lateClasses)) * 100
        : 100; // Default to 100% if no attendance records

      // Calculate risk level (aligned thresholds)
      // NONE: >= 90%
      // LOW: 85-89%
      // MEDIUM: 75-84%
      // HIGH: < 75%
      let riskLevel = 'NONE';
      if (totalScheduledClasses === 0) {
        riskLevel = 'NONE'; // New instructor with no records
      } else if (attendanceRate < 75) {
        riskLevel = 'HIGH';
      } else if (attendanceRate < 85) {
        riskLevel = 'MEDIUM';
      } else if (attendanceRate < 90) {
        riskLevel = 'LOW';
      } else {
        riskLevel = 'NONE';
      }

      // Fetch recent activity (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const recentActivity = await prisma.attendance.findMany({
        where: {
          instructorId: instructor.instructorId,
          timestamp: {
            gte: sevenDaysAgo
          }
        },
        orderBy: {
          timestamp: 'desc'
        },
        include: {
          subjectSchedule: {
            include: {
              subject: true,
              room: true
            }
          }
        },
        take: 7
      });

      // Fetch today's schedule
      const today = new Date();
      const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
      
      // Convert JavaScript day number to Prisma DayOfWeek enum
      const dayNames = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
      const dayOfWeekEnum = dayNames[dayOfWeek] as 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';
      
      const todaySchedule = await prisma.subjectSchedule.findMany({
        where: {
          instructorId: instructor.instructorId,
          day: dayOfWeekEnum
        },
        include: {
          subject: true,
          room: true
        },
        orderBy: {
          startTime: 'asc'
        }
      });

      // Calculate weekly pattern from actual attendance data
      const weeklyPattern = {
        monday: 0,
        tuesday: 0,
        wednesday: 0,
        thursday: 0,
        friday: 0,
        saturday: 0,
        sunday: 0
      };

      // Get attendance data for the last 4 weeks to calculate weekly pattern
      const fourWeeksAgo = new Date();
      fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);
      
      const weeklyAttendanceData = await prisma.attendance.findMany({
        where: {
          instructorId: instructor.instructorId,
          timestamp: {
            gte: fourWeeksAgo
          }
        },
        select: {
          timestamp: true,
          status: true
        }
      });

      // Calculate weekly pattern
      const dayNamesForPattern = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      weeklyAttendanceData.forEach(record => {
        const dayName = dayNamesForPattern[record.timestamp.getDay()];
        if (record.status === 'PRESENT') {
          weeklyPattern[dayName as keyof typeof weeklyPattern]++;
        }
      });

      // Convert to percentages (assuming 4 weeks = 4 classes per day)
      Object.keys(weeklyPattern).forEach(day => {
        const key = day as keyof typeof weeklyPattern;
        const totalClasses = 4; // Assuming 4 weeks of data
        weeklyPattern[key] = totalClasses > 0 ? Math.round((weeklyPattern[key] / totalClasses) * 100) : 0;
      });

      // Calculate current streak
      let currentStreak = 0;
      const sortedAttendance = attendanceRecords
        .filter(r => r.status === 'PRESENT')
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      if (sortedAttendance.length > 0) {
        let currentDate = new Date();
        currentDate.setHours(0, 0, 0, 0);
        
        for (const record of sortedAttendance) {
          const recordDate = new Date(record.timestamp);
          recordDate.setHours(0, 0, 0, 0);
          
          const diffDays = Math.floor((currentDate.getTime() - recordDate.getTime()) / (1000 * 60 * 60 * 24));
          
          if (diffDays === currentStreak) {
            currentStreak++;
          } else {
            break;
          }
        }
      }

      // Calculate consistency rating based on attendance variance
      const consistencyRating = attendanceRate >= 95 ? 5 : 
                               attendanceRate >= 90 ? 4 : 
                               attendanceRate >= 80 ? 3 : 
                               attendanceRate >= 70 ? 2 : 1;

      // Calculate trend (comparing last 2 weeks vs previous 2 weeks)
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
      
      const fourWeeksAgoForTrend = new Date();
      fourWeeksAgoForTrend.setDate(fourWeeksAgoForTrend.getDate() - 28);
      
      const recentTwoWeeks = weeklyAttendanceData.filter(r => 
        r.timestamp >= twoWeeksAgo
      );
      
      const previousTwoWeeks = weeklyAttendanceData.filter(r => 
        r.timestamp >= fourWeeksAgoForTrend && r.timestamp < twoWeeksAgo
      );

      const recentRate = recentTwoWeeks.length > 0 ? 
        (recentTwoWeeks.filter(r => r.status === 'PRESENT').length / recentTwoWeeks.length) * 100 : 0;
      
      const previousRate = previousTwoWeeks.length > 0 ? 
        (previousTwoWeeks.filter(r => r.status === 'PRESENT').length / previousTwoWeeks.length) * 100 : 0;

      const trend = parseFloat((recentRate - previousRate).toFixed(1));

      // Safely access department and subjects
      const departmentName = instructor.Department?.departmentName || 'Unknown Department';
      const subjects = instructor.Subjects?.map(subject => subject.subjectName) || [];
      const subjectCodes = instructor.Subjects?.map(subject => subject.subjectCode) || [];

      // Format recent activity for frontend
      const formattedRecentActivity = recentActivity.map(record => {
        const recordDate = new Date(record.timestamp);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        let dayLabel = '';
        if (recordDate.toDateString() === today.toDateString()) {
          dayLabel = 'Today';
        } else if (recordDate.toDateString() === yesterday.toDateString()) {
          dayLabel = 'Yesterday';
        } else {
          const diffDays = Math.floor((today.getTime() - recordDate.getTime()) / (1000 * 60 * 60 * 24));
          dayLabel = `${diffDays} days ago`;
        }

        return {
          day: dayLabel,
          status: record.status.toLowerCase(),
          time: record.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          subject: record.subjectSchedule?.subject?.subjectName || 'Unknown Subject',
          room: record.subjectSchedule?.room?.roomNo || 'Unknown Room'
        };
      });

      // Format today's schedule for frontend
      const formattedTodaySchedule = todaySchedule.map(schedule => {
        const now = new Date();
        const scheduleTime = new Date();
        scheduleTime.setHours(parseInt(schedule.startTime.split(':')[0]), parseInt(schedule.startTime.split(':')[1]), 0);
        
        let status: 'completed' | 'in-progress' | 'upcoming' = 'upcoming';
        if (now > scheduleTime) {
          status = 'completed';
        } else if (Math.abs(now.getTime() - scheduleTime.getTime()) < 60 * 60 * 1000) { // Within 1 hour
          status = 'in-progress';
        }

        return {
          time: schedule.startTime,
          subject: schedule.subject?.subjectName || 'Unknown Subject',
          room: schedule.room?.roomNo || 'Unknown Room',
          status
        };
      });

      // Fetch full teaching schedules with related entities
      const subjectSchedules = await prisma.subjectSchedule.findMany({
        where: { instructorId: instructor.instructorId },
        include: {
          subject: true,
          room: true,
          section: true
        },
        orderBy: { startTime: 'asc' }
      });

      // For each schedule, get recent attendance history and compute per-schedule attendance rate
      const schedules = await Promise.all(subjectSchedules.map(async (sched) => {
        const history = await prisma.attendance.findMany({
          where: { subjectSchedId: sched.subjectSchedId, instructorId: instructor.instructorId },
          orderBy: { timestamp: 'desc' },
          take: 50
        });

        const totalForSchedule = history.length;
        const presentForSchedule = history.filter(h => h.status === 'PRESENT').length;
        const scheduleAttendanceRate = totalForSchedule > 0 ? (presentForSchedule / totalForSchedule) * 100 : 0;

        const attendanceHistory = history.map(h => ({
          date: h.timestamp,
          status: h.status,
          checkInTime: h.timestamp,
          checkOutTime: h.checkOutTime,
          duration: h.duration || undefined,
          verification: h.verification,
          notes: h.notes || undefined,
          location: h.location || undefined
        }));

        return {
          scheduleId: String(sched.subjectSchedId),
          subjectName: sched.subject?.subjectName || 'Unknown Subject',
          subjectCode: sched.subject?.subjectCode || '',
          sectionName: sched.section?.sectionName || '',
          roomNumber: sched.room?.roomNo || '',
          dayOfWeek: sched.day,
          startTime: sched.startTime,
          endTime: sched.endTime,
          attendanceHistory,
          attendanceRate: parseFloat(scheduleAttendanceRate.toFixed(1))
        };
      }));

      // Calculate weekly performance metrics
      const weeklyPerformance = {
        presentDays: recentActivity.filter(r => r.status === 'PRESENT').length,
        totalDays: recentActivity.length,
        onTimeRate: recentActivity.length > 0 ? 
          (recentActivity.filter(r => r.status === 'PRESENT').length / recentActivity.length) * 100 : 0,
        currentStreak: currentStreak
      };

      return {
        instructorId: instructor.instructorId.toString(),
        instructorName: `${instructor.firstName || ''} ${instructor.lastName || ''}`.trim(),
        employeeId: instructor.employeeId || '',
        department: departmentName,
        instructorType: instructor.instructorType || 'FULL_TIME',
        specialization: instructor.specialization || '',
        email: instructor.email || '',
        phoneNumber: instructor.phoneNumber || '',
        officeLocation: instructor.officeLocation || '',
        officeHours: instructor.officeHours || '',
        rfidTag: instructor.rfidTag || '',
        status: instructor.status || 'ACTIVE',
        subjects,
        subjectCodes,
        schedules,
        totalScheduledClasses,
        attendedClasses,
        absentClasses,
        lateClasses,
        onLeaveClasses,
        attendanceRate: parseFloat(attendanceRate.toFixed(1)),
        punctualityScore: parseFloat(punctualityScore.toFixed(1)),
        riskLevel,
        currentStreak,
        consistencyRating,
        trend,
        weeklyPattern,
        lastAttendance: attendanceRecords.length > 0 
          ? attendanceRecords[0].timestamp 
          : new Date(),
        // New database-connected fields for expandable row
        recentActivity: formattedRecentActivity,
        todaySchedule: formattedTodaySchedule,
        weeklyPerformance,
        // avatarUrl is now generated on the client side to prevent re-rendering issues
        attendanceRecords
      };
    }));

    console.log('Transformed instructors:', transformedInstructors.length);

    return NextResponse.json(transformedInstructors);
  } catch (error) {
    console.error('Error fetching instructor attendance records:', error);
    
    // Enhanced error logging
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    
    // Check if it's a Prisma error
    if (error && typeof error === 'object' && 'code' in error) {
      console.error('Prisma error code:', (error as any).code);
      console.error('Prisma error meta:', (error as any).meta);
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch instructor attendance records', 
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
} 