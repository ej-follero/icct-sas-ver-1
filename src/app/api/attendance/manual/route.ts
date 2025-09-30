import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Create manual attendance entry
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    const {
      entityType,
      entityId,
      status,
      subjectSchedId,
      timestamp,
      notes,
    } = body as {
      entityType: 'student' | 'instructor';
      entityId: number;
      status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
      subjectSchedId?: number;
      timestamp?: string;
      notes?: string;
    };

    if (!entityType || !entityId || !status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate entity exists and get userId
    let actualUserId: number;
    let userRole: 'STUDENT' | 'INSTRUCTOR';
    
    if (entityType === 'student') {
      const student = await prisma.student.findUnique({ 
        where: { studentId: Number(entityId) }, 
        select: { studentId: true, userId: true } 
      });
      if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 });
      actualUserId = student.userId;
      userRole = 'STUDENT';
    } else {
      // For instructors, we need to find or create a User record
      const instructor = await prisma.instructor.findUnique({ 
        where: { instructorId: Number(entityId) }, 
        select: { instructorId: true, email: true, firstName: true, lastName: true } 
      });
      if (!instructor) return NextResponse.json({ error: 'Instructor not found' }, { status: 404 });
      
      // Check if instructor has a User record
      let user = await prisma.user.findUnique({ 
        where: { email: instructor.email },
        select: { userId: true }
      });
      
      if (!user) {
        // Create a User record for the instructor
        const newUser = await prisma.user.create({
          data: {
            userName: `${instructor.firstName.toLowerCase()}.${instructor.lastName.toLowerCase()}`,
            email: instructor.email,
            passwordHash: 'temp_password', // This should be set properly in a real system
            role: 'INSTRUCTOR'
          },
          select: { userId: true }
        });
        actualUserId = newUser.userId;
      } else {
        actualUserId = user.userId;
      }
      userRole = 'INSTRUCTOR';
    }

    // Validate subject schedule if provided
    let eventId: number | undefined;
    if (subjectSchedId) {
      const schedule = await prisma.subjectSchedule.findUnique({ 
        where: { subjectSchedId: Number(subjectSchedId) }, 
        select: { subjectSchedId: true } 
      });
      if (!schedule) {
        return NextResponse.json({ error: 'Subject schedule not found' }, { status: 404 });
      }
      // For now, we'll use the schedule ID as eventId, but this should be properly mapped
      eventId = schedule.subjectSchedId;
    }

    // Create attendance record according to schema
    const attendanceData = {
      eventId: eventId || null,
      userId: actualUserId,
      userRole: userRole,
      status: status,
      attendanceType: 'MANUAL_ENTRY' as const,
      verification: 'PENDING' as const,
      timestamp: timestamp ? new Date(timestamp) : new Date(),
      notes: notes || null,
    };

    const created = await prisma.attendance.create({
      data: attendanceData,
      select: { 
        attendanceId: true,
        timestamp: true,
        status: true,
        attendanceType: true
      },
    });

    return NextResponse.json({ 
      success: true, 
      attendanceId: created.attendanceId,
      timestamp: created.timestamp,
      status: created.status,
      attendanceType: created.attendanceType
    }, { status: 201 });
  } catch (e) {
    console.error('Manual attendance POST error', e);
    console.error('Error details:', {
      message: e instanceof Error ? e.message : 'Unknown error',
      stack: e instanceof Error ? e.stack : undefined,
      name: e instanceof Error ? e.name : undefined
    });
    return NextResponse.json({ 
      error: 'Internal Server Error',
      details: e instanceof Error ? e.message : 'Unknown error'
    }, { status: 500 });
  }
}



