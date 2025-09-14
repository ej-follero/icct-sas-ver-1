import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    const departmentId = searchParams.get('departmentId');
    const courseId = searchParams.get('courseId');
    const yearLevel = searchParams.get('yearLevel');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const subjectName = searchParams.get('subjectName');

    console.log('Received student attendance filter parameters:', {
      studentId,
      departmentId,
      courseId,
      yearLevel,
      startDate,
      endDate,
      status,
      search
    });

    // Optional pagination params to limit load (defaults chosen conservatively)
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = Math.min(parseInt(searchParams.get('pageSize') || '50'), 100); // hard cap at 100
    const skip = (page - 1) * pageSize;

    // First, get a limited set of students with their basic information
    const students = await prisma.student.findMany({
      where: {
        ...(studentId && { studentId: parseInt(studentId) }),
        ...(departmentId && { departmentId: parseInt(departmentId) }),
        ...(courseId && { courseId: parseInt(courseId) }),
        ...(yearLevel && { yearLevel: yearLevel as any }),
        ...(search && {
          OR: [
            { firstName: { contains: search, mode: 'insensitive' } },
            { lastName: { contains: search, mode: 'insensitive' } },
            { studentIdNum: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
            { Department: { departmentName: { contains: search, mode: 'insensitive' } } },
            { CourseOffering: { courseName: { contains: search, mode: 'insensitive' } } }
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
        CourseOffering: {
          select: {
            courseId: true,
            courseName: true,
            courseCode: true
          }
        },
        Guardian: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phoneNumber: true,
            guardianType: true
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
                room: true,
                instructor: {
                  select: {
                    firstName: true,
                    lastName: true,
                    employeeId: true
                  }
                }
              }
            }
          },
          orderBy: {
            timestamp: 'desc'
          },
          take: 20 // keep a small window to derive recent metrics and reduce load
        }
      },
      orderBy: {
        firstName: 'asc'
      },
      skip,
      take: pageSize
    });

    console.log('Found students:', students.length);

    // If no students found, return empty array instead of error
    if (students.length === 0) {
      console.log('No students found, returning empty array');
      return NextResponse.json([]);
    }

    // Transform student data with attendance metrics
    const transformedStudents = students.map((student) => {
      // Filter attendance by subject if requested (from included records only)
      const includedAttendance = (student.Attendance || []);
      const attendanceRecords = includedAttendance.filter((rec) => {
        if (!subjectName) return true;
        const recSubject = rec.subjectSchedule?.subject?.subjectName || '';
        return recSubject.toLowerCase().includes(subjectName.toLowerCase());
      });

      // Safely calculate attendance metrics based on included window
      const totalScheduledClasses = attendanceRecords.length || 0;
      const attendedClasses = attendanceRecords.filter(r => r.status === 'PRESENT').length;
      const absentClasses = attendanceRecords.filter(r => r.status === 'ABSENT').length;
      const lateClasses = attendanceRecords.filter(r => r.status === 'LATE').length;
      const excusedClasses = attendanceRecords.filter(r => r.status === 'EXCUSED').length;

      const attendanceRate = totalScheduledClasses > 0 
        ? (attendedClasses / totalScheduledClasses) * 100 
        : 0;

      const punctualityScore = (attendedClasses + lateClasses) > 0
        ? (attendedClasses / (attendedClasses + lateClasses)) * 100
        : 0;

      // Risk level based on rate
      let riskLevel = 'NONE';
      if (totalScheduledClasses === 0) {
        riskLevel = 'NONE';
      } else if (attendanceRate < 75) {
        riskLevel = 'HIGH';
      } else if (attendanceRate < 85) {
        riskLevel = 'MEDIUM';
      } else if (attendanceRate < 90) {
        riskLevel = 'LOW';
      }

      // Recent activity from included attendance (up to 7)
      const recentActivity = attendanceRecords.slice(0, 7).map(record => {
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
          room: record.subjectSchedule?.room?.roomNo || 'Unknown Room',
          instructor: record.subjectSchedule?.instructor ? 
            `${record.subjectSchedule.instructor.firstName} ${record.subjectSchedule.instructor.lastName}` : 
            'Unknown Instructor'
        };
      });

      // Weekly performance derived from included window
      const weeklyPerformance = {
        presentDays: attendanceRecords.filter(r => r.status === 'PRESENT').length,
        totalDays: attendanceRecords.length,
        onTimeRate: attendanceRecords.length > 0 ? 
          (attendanceRecords.filter(r => r.status === 'PRESENT').length / attendanceRecords.length) * 100 : 0,
        currentStreak: 0
      };

      // Derive a lightweight weekly pattern from included window
      const weeklyPattern = {
        monday: 0,
        tuesday: 0,
        wednesday: 0,
        thursday: 0,
        friday: 0,
        saturday: 0,
        sunday: 0
      } as Record<'monday'|'tuesday'|'wednesday'|'thursday'|'friday'|'saturday'|'sunday', number>;

      attendanceRecords.forEach(r => {
        const d = new Date(r.timestamp).getDay();
        const names = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'] as const;
        if (r.status === 'PRESENT') {
          weeklyPattern[names[d]]++;
        }
      });

      // Lightweight trend placeholder from included window
      const trend = 0;

      // Safely access department, course, and guardian information
      const departmentName = student.Department?.departmentName || 'Unknown Department';
      const courseName = student.CourseOffering?.courseName || 'Unknown Course';
      const courseCode = student.CourseOffering?.courseCode || '';
      const guardianName = student.Guardian ? 
        `${student.Guardian.firstName} ${student.Guardian.lastName}` : 'No Guardian';

      // No heavy per-student schedule expansion in summary list response
      const schedules: any[] = [];

      // Keep weeklyPerformance from included window defined above

      return {
        studentId: student.studentId.toString(),
        studentName: `${student.firstName || ''} ${student.lastName || ''}`.trim(),
        studentIdNum: student.studentIdNum || '',
        department: departmentName,
        course: courseName,
        courseCode: courseCode,
        yearLevel: student.yearLevel || 'FIRST_YEAR',
        studentType: student.studentType || 'REGULAR',
        email: student.email || '',
        phoneNumber: student.phoneNumber || '',
        address: student.address || '',
        gender: student.gender || 'MALE',
        birthDate: student.birthDate || null,
        nationality: student.nationality || '',
        rfidTag: student.rfidTag || '',
        status: student.status || 'ACTIVE',
        guardianName: guardianName,
        guardianEmail: student.Guardian?.email || '',
        guardianPhone: student.Guardian?.phoneNumber || '',
        guardianType: student.Guardian?.guardianType || 'PARENT',
        schedules,
        totalScheduledClasses,
        attendedClasses,
        absentClasses,
        lateClasses,
        excusedClasses,
        attendanceRate: parseFloat(attendanceRate.toFixed(1)),
        punctualityScore: parseFloat(punctualityScore.toFixed(1)),
        riskLevel,
        currentStreak: 0,
        consistencyRating: attendanceRate >= 95 ? 5 : attendanceRate >= 90 ? 4 : attendanceRate >= 80 ? 3 : attendanceRate >= 70 ? 2 : 1,
        trend,
        weeklyPattern,
        lastAttendance: attendanceRecords.length > 0 
          ? attendanceRecords[0].timestamp 
          : null,
        // New database-connected fields for expandable row
        recentActivity,
        todaySchedule: [],
        weeklyPerformance,
        // avatarUrl is now generated on the client side to prevent re-rendering issues
        attendanceRecords
      };
    });

    console.log('Transformed students:', transformedStudents.length);

    return NextResponse.json(transformedStudents);
  } catch (error) {
    console.error('Error fetching student attendance records:', error);
    
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
        error: 'Failed to fetch student attendance records', 
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
