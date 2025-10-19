import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { DayOfWeek, ScheduleStatus } from '@prisma/client';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const instructorId = parseInt(id);
    
    if (isNaN(instructorId)) {
      return NextResponse.json({ error: 'Invalid instructor ID' }, { status: 400 });
    }

    // Get instructor without attendance records (attendance removed)
    const instructor = await prisma.instructor.findUnique({
      where: { instructorId },
      include: {
        SubjectSchedule: {
          where: { status: ScheduleStatus.ACTIVE },
          include: {
            subject: { select: { subjectName: true } },
            section: { select: { sectionName: true } },
            room: { select: { roomNo: true } }
          }
        }
      }
    });

    if (!instructor) {
      return NextResponse.json({ error: 'Instructor not found' }, { status: 404 });
    }

    // Attendance data removed; return empty analytics placeholders to avoid breaking clients
    const recentActivity: Array<{ day: string; status: 'present' | 'absent' | 'late' | 'excused'; time: string; subject: string; room: string; instructor: string; }> = [];
    const weeklyPerformance = {
      presentDays: 0,
      totalDays: 0,
      onTimeRate: 0,
      currentStreak: 0
    };

    // Get today's schedule
    const today = new Date();
    const weekdayToEnum: Array<DayOfWeek> = [
      DayOfWeek.SUNDAY,
      DayOfWeek.MONDAY,
      DayOfWeek.TUESDAY,
      DayOfWeek.WEDNESDAY,
      DayOfWeek.THURSDAY,
      DayOfWeek.FRIDAY,
      DayOfWeek.SATURDAY,
    ];
    const todayEnum = weekdayToEnum[today.getDay()];
    const todaySchedule = instructor.SubjectSchedule
      .filter(schedule => schedule.day === todayEnum)
      .map(schedule => ({
        time: `${schedule.startTime} - ${schedule.endTime}`,
        subject: schedule.subject.subjectName,
        room: schedule.room?.roomNo || 'TBA',
        status: 'upcoming' as const
      }));

    // Get subjects taught by instructor
    const subjects = instructor.SubjectSchedule.map(schedule => schedule.subject.subjectName);

    // Attendance records removed
    const attendanceRecords: any[] = [];

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
