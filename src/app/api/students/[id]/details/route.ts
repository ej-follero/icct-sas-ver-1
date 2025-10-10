import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // JWT Authentication (SUPER_ADMIN, ADMIN, DEPARTMENT_HEAD, INSTRUCTOR)
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const reqUserId = Number((decoded as any)?.userId);
    if (!Number.isFinite(reqUserId)) {
      return NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 });
    }

    const reqUser = await prisma.user.findUnique({ where: { userId: reqUserId }, select: { status: true, role: true } });
    if (!reqUser || reqUser.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'User not found or inactive' }, { status: 401 });
    }
    const allowedRoles = ['SUPER_ADMIN', 'ADMIN', 'DEPARTMENT_HEAD', 'INSTRUCTOR'];
    if (!allowedRoles.includes(reqUser.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }
    const studentId = params.id;
    
    if (!studentId) {
      return NextResponse.json({ error: 'Student ID is required' }, { status: 400 });
    }

    // Fetch student with detailed information
    const numericId = Number(studentId);
    if (!Number.isFinite(numericId)) {
      return NextResponse.json({ error: 'Invalid student ID format' }, { status: 400 });
    }

    // Parse optional filters from query string
    const url = new URL(request.url);
    const startParam = url.searchParams.get('startDate');
    const endParam = url.searchParams.get('endDate');
    const statusParam = url.searchParams.get('status'); // PRESENT | ABSENT | LATE | EXCUSED
    const subjectNameParam = url.searchParams.get('subjectName');

    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 7);

    // Normalize date range for attendanceRecords filtering
    let filterStart: Date | undefined = undefined;
    let filterEnd: Date | undefined = undefined;
    if (startParam || endParam) {
      const start = startParam ? new Date(startParam) : undefined;
      const end = endParam ? new Date(endParam) : undefined;
      if (start && end) {
        filterStart = new Date(start);
        filterStart.setHours(0, 0, 0, 0);
        filterEnd = new Date(end);
        filterEnd.setHours(23, 59, 59, 999);
      } else if (start && !end) {
        // single-day selection
        filterStart = new Date(start);
        filterStart.setHours(0, 0, 0, 0);
        filterEnd = new Date(start);
        filterEnd.setHours(23, 59, 59, 999);
      } else if (!start && end) {
        filterStart = new Date(end);
        filterStart.setHours(0, 0, 0, 0);
        filterEnd = new Date(end);
        filterEnd.setHours(23, 59, 59, 999);
      }
    }

    const student = await prisma.student.findUnique({
      where: { studentId: numericId },
      include: {
        StudentSchedules: {
          include: {
            schedule: {
              include: {
                subject: { select: { subjectName: true, subjectCode: true } },
                room: { select: { roomNo: true } },
                section: { select: { sectionName: true } }
              }
            }
          }
        },
        Attendance: {
          where: {
            timestamp: { gte: sevenDaysAgo, lte: now }
          },
          orderBy: { timestamp: 'desc' },
          include: {
            subjectSchedule: {
              include: {
                subject: { select: { subjectName: true, subjectCode: true } },
                room: { select: { roomNo: true } }
              }
            }
          }
        },
        Department: { select: { departmentName: true } },
        CourseOffering: { select: { courseName: true, courseCode: true } }
      }
    });

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // Generate recent activity from actual attendance records (last 7 days only)
    const recentActivity = student.Attendance.map(record => ({
      day: record.timestamp.toLocaleDateString('en-US', { weekday: 'long' }),
      time: record.timestamp.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      }),
      status: record.status.toLowerCase(),
      subject: record.subjectSchedule?.subject?.subjectName || 'Unknown Subject',
      room: record.subjectSchedule?.room?.roomNo || 'TBD'
    }));

    // Calculate weekly performance from actual data
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay()); // Start of current week
    
    const weeklyRecords = student.Attendance.filter(record => 
      record.timestamp >= weekStart
    );
    
    const presentDays = weeklyRecords.filter(record => 
      record.status === 'PRESENT' || record.status === 'LATE'
    ).length;
    
    const lateDays = weeklyRecords.filter(record => 
      record.status === 'LATE'
    ).length;
    
    const absentDays = weeklyRecords.filter(record => 
      record.status === 'ABSENT'
    ).length;
    
    const totalDays = weeklyRecords.length;
    const onTimeRate = totalDays > 0 ? Math.floor(((presentDays - lateDays) / totalDays) * 100) : 0;
    
    // Calculate current streak
    let currentStreak = 0;
    const sortedRecords = student.Attendance.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    
    for (const record of sortedRecords) {
      if (record.status === 'PRESENT' || record.status === 'LATE') {
        currentStreak++;
      } else {
        break;
      }
    }

    const weeklyPerformance = {
      presentDays,
      lateDays,
      absentDays,
      totalDays,
      onTimeRate,
      currentStreak
    };

    // Compute today's schedules strictly from SubjectSchedule (no mock)
    const dayNames: Record<number, any> = { 0: 'SUNDAY', 1: 'MONDAY', 2: 'TUESDAY', 3: 'WEDNESDAY', 4: 'THURSDAY', 5: 'FRIDAY', 6: 'SATURDAY' };
    const todayEnum = dayNames[new Date().getDay()];
    const todaySchedules = (student.StudentSchedules || [])
      .map(ss => ss.schedule)
      .filter(s => s && (s.day === todayEnum))
      .map(s => {
        const now = new Date();
        const currentTime = now.getHours() * 100 + now.getMinutes();
        const startTime = parseInt((s.startTime || '00:00').replace(':', ''));
        const endTime = parseInt((s.endTime || '00:00').replace(':', ''));
        let status: 'completed' | 'in-progress' | 'upcoming' = 'upcoming';
        if (currentTime >= startTime && currentTime <= endTime) status = 'in-progress';
        if (currentTime > endTime) status = 'completed';
        return {
          time: s.startTime || 'TBD',
          subject: s.subject?.subjectName || 'Unknown Subject',
          room: s.room?.roomNo || 'TBD',
          status
        };
      });

    // Fetch full attendance records for the requested custom range (single date or range)
    let attendanceRecords: any[] = [];
    try {
      if (filterStart && filterEnd) {
        attendanceRecords = await prisma.attendance.findMany({
          where: {
            studentId: numericId,
            timestamp: { gte: filterStart, lte: filterEnd },
            ...(statusParam && { status: statusParam as any }),
            ...(subjectNameParam && {
              subjectSchedule: {
                subject: {
                  is: { subjectName: subjectNameParam }
                }
              }
            })
          },
          orderBy: { timestamp: 'desc' },
          include: {
            subjectSchedule: {
              include: {
                subject: { select: { subjectName: true, subjectCode: true } },
                room: { select: { roomNo: true } }
              }
            }
          }
        });
      }
    } catch {}

    return NextResponse.json({
      recentActivity,
      weeklyPerformance,
      todaySchedules,
      attendanceRecords,
      student: {
        studentId: student.studentId,
        studentName: `${student.firstName} ${student.lastName}`.trim(),
        studentIdNum: student.studentIdNum,
        department: student.Department?.departmentName || '',
        course: student.CourseOffering?.courseName || '',
        courseCode: student.CourseOffering?.courseCode || '',
        yearLevel: student.yearLevel,
        status: student.status
      }
    });

  } catch (error) {
    console.error('Error fetching student details:', error);
    
    // Handle specific Prisma errors
    if (error instanceof Error) {
      if (error.message.includes('Record to find does not exist')) {
        return NextResponse.json(
          { error: 'Student not found' },
          { status: 404 }
        );
      }
      
      if (error.message.includes('Invalid')) {
        return NextResponse.json(
          { error: 'Invalid student ID format' },
          { status: 400 }
        );
      }
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch student details',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}