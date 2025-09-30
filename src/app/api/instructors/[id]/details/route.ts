import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const instructorId = parseInt(params.id);
    
    if (isNaN(instructorId)) {
      return NextResponse.json({ error: 'Invalid instructor ID' }, { status: 400 });
    }

    // Get instructor with attendance records
    const instructor = await prisma.instructor.findUnique({
      where: { instructorId },
      include: {
        Attendance: {
          orderBy: { timestamp: 'desc' },
          take: 7, // Last 7 days
          include: {
            subjectSchedule: {
              include: {
                subject: true,
                section: true
              }
            }
          }
        },
        SubjectSchedule: {
          where: { status: 'ACTIVE' },
          include: {
            subject: true,
            section: true
          }
        }
      }
    });

    if (!instructor) {
      return NextResponse.json({ error: 'Instructor not found' }, { status: 404 });
    }

    // Calculate recent activity (last 7 days)
    const recentActivity = instructor.Attendance.map(attendance => ({
      day: attendance.timestamp.toLocaleDateString('en-US', { weekday: 'short' }),
      status: attendance.status.toLowerCase() as 'present' | 'absent' | 'late' | 'excused',
      time: attendance.timestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      subject: attendance.subjectSchedule?.subject?.subjectName || 'N/A',
      room: attendance.subjectSchedule?.roomAssignment || 'N/A',
      instructor: `${instructor.firstName} ${instructor.lastName}`
    }));

    // Calculate weekly performance
    const now = new Date();
    const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    const weeklyAttendance = instructor.Attendance.filter(attendance => 
      attendance.timestamp >= weekStart && attendance.timestamp <= weekEnd
    );

    const presentDays = weeklyAttendance.filter(a => a.status === 'PRESENT').length;
    const totalDays = weeklyAttendance.length;
    const onTimeRate = weeklyAttendance.length > 0 ? 
      (weeklyAttendance.filter(a => a.status === 'PRESENT').length / weeklyAttendance.length) * 100 : 0;

    const weeklyPerformance = {
      presentDays,
      totalDays,
      onTimeRate,
      currentStreak: 0 // This would need more complex calculation
    };

    // Get today's schedule
    const today = new Date();
    const todaySchedule = instructor.SubjectSchedule
      .filter(schedule => {
        const dayOfWeek = today.getDay();
        const scheduleDay = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][dayOfWeek];
        return schedule.dayOfWeek?.toLowerCase() === scheduleDay;
      })
      .map(schedule => ({
        time: `${schedule.startTime} - ${schedule.endTime}`,
        subject: schedule.subject.subjectName,
        room: schedule.roomAssignment || 'TBA',
        status: 'upcoming' as const // This would need more complex logic
      }));

    // Get subjects taught by instructor
    const subjects = instructor.SubjectSchedule.map(schedule => schedule.subject.subjectName);

    // Get attendance records for the last 30 days
    const attendanceRecords = instructor.Attendance
      .slice(0, 30)
      .map(attendance => ({
        id: attendance.attendanceId.toString(),
        date: attendance.timestamp.toISOString().split('T')[0],
        timeIn: attendance.timestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        timeOut: attendance.checkOutTime?.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        status: attendance.status as 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED',
        subject: attendance.subjectSchedule?.subject?.subjectName || 'N/A',
        room: attendance.subjectSchedule?.roomAssignment || 'N/A',
        instructor: `${instructor.firstName} ${instructor.lastName}`,
        notes: attendance.notes || undefined,
        isManualEntry: attendance.attendanceType === 'MANUAL_ENTRY',
        createdAt: attendance.timestamp.toISOString(),
        updatedAt: attendance.timestamp.toISOString()
      }));

    return NextResponse.json({
      recentActivity,
      weeklyPerformance,
      todaySchedule,
      subjects,
      attendanceRecords
    });

  } catch (error) {
    console.error('Error fetching instructor details:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
