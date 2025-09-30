import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const studentId = params.id;
    
    if (!studentId) {
      return NextResponse.json({ error: 'Student ID is required' }, { status: 400 });
    }

    // Fetch student with detailed information
    const student = await prisma.student.findUnique({
      where: { studentId },
      include: {
        schedules: {
          include: {
            subject: {
              select: {
                subjectName: true,
                subjectCode: true
              }
            },
            room: {
              select: {
                roomName: true,
                roomNumber: true
              }
            }
          }
        },
        attendanceRecords: {
          orderBy: { createdAt: 'desc' },
          take: 7, // Last 7 attendance records
          include: {
            schedule: {
              include: {
                subject: {
                  select: {
                    subjectName: true,
                    subjectCode: true
                  }
                },
                room: {
                  select: {
                    roomName: true,
                    roomNumber: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // Generate recent activity from actual attendance records
    const recentActivity = student.attendanceRecords.map(record => ({
      day: record.createdAt.toLocaleDateString('en-US', { weekday: 'long' }),
      time: record.createdAt.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      }),
      status: record.status.toLowerCase(),
      subject: record.schedule?.subject?.subjectName || 'Unknown Subject',
      room: record.schedule?.room?.roomNumber || 'TBD'
    }));

    // Calculate weekly performance from actual data
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay()); // Start of current week
    
    const weeklyRecords = student.attendanceRecords.filter(record => 
      record.createdAt >= weekStart
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
    const sortedRecords = student.attendanceRecords.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
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

    return NextResponse.json({
      recentActivity,
      weeklyPerformance,
      student: {
        studentId: student.studentId,
        studentName: student.studentName,
        studentIdNum: student.studentIdNum,
        department: student.department,
        course: student.course,
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