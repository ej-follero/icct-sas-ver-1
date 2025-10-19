import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/attendance/current-class
// Returns current active class schedule and enrolled students with attendance status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const roomId = searchParams.get('roomId');
    const subjectSchedId = searchParams.get('subjectSchedId');

    const now = new Date();
    const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
    const currentTime = now.toTimeString().slice(0, 5);

    // Find current active class schedule
    let currentSchedule;
    
    if (subjectSchedId) {
      // Get specific schedule
      currentSchedule = await prisma.subjectSchedule.findUnique({
        where: { subjectSchedId: parseInt(subjectSchedId) },
        include: {
          subject: true,
          section: true,
          instructor: true,
          room: true,
          semester: true
        }
      });
    } else {
      // Find current schedule based on time and room
      const whereClause: any = {
        day: currentDay as any,
        startTime: { lte: currentTime },
        endTime: { gte: currentTime },
        status: 'ACTIVE',
        semester: {
          status: 'CURRENT',
          isActive: true
        }
      };

      if (roomId) {
        whereClause.roomId = parseInt(roomId);
      }

      currentSchedule = await prisma.subjectSchedule.findFirst({
        where: whereClause,
        include: {
          subject: true,
          section: true,
          instructor: true,
          room: true,
          semester: true
        }
      });
    }

    if (!currentSchedule) {
      return NextResponse.json({
        success: false,
        message: 'No active class found for current time',
        data: null
      });
    }

    // Get enrolled students for this schedule
    const enrolledStudents = await prisma.studentSchedule.findMany({
      where: {
        scheduleId: currentSchedule.subjectSchedId,
        status: 'ACTIVE'
      },
      include: {
        student: {
          include: {
            User: true,
            Department: true,
            CourseOffering: true
          }
        }
      }
    });

    // Get today's attendance records for this schedule
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const attendanceRecords = await prisma.attendance.findMany({
      where: {
        subjectSchedId: currentSchedule.subjectSchedId,
        timestamp: {
          gte: today,
          lt: tomorrow
        }
      },
      include: {
        student: {
          include: {
            User: true,
            Department: true,
            CourseOffering: true
          }
        },
        rfidLog: {
          include: {
            reader: {
              include: {
                room: true
              }
            }
          }
        }
      },
      orderBy: {
        timestamp: 'desc'
      }
    });

    // Create attendance map for quick lookup
    const attendanceMap = new Map();
    attendanceRecords.forEach(record => {
      if (record.studentId) {
        attendanceMap.set(record.studentId, record);
      }
    });

    // Combine student data with attendance status
    const studentsWithAttendance = enrolledStudents.map(studentSchedule => {
      const student = studentSchedule.student;
      const attendance = attendanceMap.get(student.studentId);
      
      return {
        studentId: student.studentId,
        studentIdNum: student.studentIdNum,
        firstName: student.firstName,
        lastName: student.lastName,
        email: student.email,
        rfidTag: student.rfidTag,
        department: student.Department?.departmentName || 'Unknown',
        course: student.CourseOffering?.courseName || 'Unknown',
        attendanceStatus: attendance?.status || 'ABSENT',
        attendanceType: attendance?.attendanceType || null,
        timestamp: attendance?.timestamp || null,
        verification: attendance?.verification || 'PENDING',
        rfidReader: attendance?.rfidLog?.reader?.deviceName || null,
        room: attendance?.rfidLog?.reader?.room?.roomNo || null,
        location: attendance?.rfidLog?.location || null,
        isLate: attendance?.status === 'LATE',
        isPresent: attendance?.status === 'PRESENT'
      };
    });

    // Calculate statistics
    const stats = {
      totalEnrolled: studentsWithAttendance.length,
      present: studentsWithAttendance.filter(s => s.isPresent).length,
      late: studentsWithAttendance.filter(s => s.isLate).length,
      absent: studentsWithAttendance.filter(s => s.attendanceStatus === 'ABSENT').length,
      excused: studentsWithAttendance.filter(s => s.attendanceStatus === 'EXCUSED').length
    };

    return NextResponse.json({
      success: true,
      data: {
        schedule: currentSchedule,
        students: studentsWithAttendance,
        statistics: stats,
        classInfo: {
          startTime: currentSchedule.startTime,
          endTime: currentSchedule.endTime,
          day: currentSchedule.day,
          isCurrentlyActive: true,
          timeRemaining: calculateTimeRemaining(currentSchedule.endTime, currentTime)
        }
      }
    });

  } catch (e: any) {
    console.error('Current class fetch error:', e);
    return NextResponse.json({ 
      error: e?.message || 'Failed to fetch current class data' 
    }, { status: 500 });
  }
}

function calculateTimeRemaining(endTime: string, currentTime: string): string {
  const [endHour, endMin] = endTime.split(':').map(Number);
  const [currentHour, currentMin] = currentTime.split(':').map(Number);
  
  const endMinutes = endHour * 60 + endMin;
  const currentMinutes = currentHour * 60 + currentMin;
  
  const remainingMinutes = endMinutes - currentMinutes;
  
  if (remainingMinutes <= 0) return 'Class ended';
  
  const hours = Math.floor(remainingMinutes / 60);
  const minutes = remainingMinutes % 60;
  
  if (hours > 0) {
    return `${hours}h ${minutes}m remaining`;
  } else {
    return `${minutes}m remaining`;
  }
}
