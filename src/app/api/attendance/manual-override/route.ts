import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createNotification } from '@/lib/notifications';
import { ComprehensiveAuditService } from '@/lib/services/comprehensive-audit.service';

// POST /api/attendance/manual-override
// Allows instructors/admins to manually override attendance status
export async function POST(request: NextRequest) {
  try {
    // JWT Authentication
    const token = request.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const actorUserId = Number((decoded as any)?.userId);
    const actorRole = (decoded as any)?.role;
    
    if (!Number.isFinite(actorUserId)) {
      return NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 });
    }
    
    const actor = await prisma.user.findUnique({ 
      where: { userId: actorUserId }, 
      select: { role: true, status: true, email: true } 
    });
    
    if (!actor || actor.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'User not found or inactive' }, { status: 404 });
    }
    
    // Check permissions - only instructors and admins can override
    if (!['INSTRUCTOR', 'ADMIN', 'SUPER_ADMIN', 'DEPARTMENT_HEAD'].includes(actorRole)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const { 
      studentId, 
      subjectSchedId, 
      status, 
      reason, 
      timestamp,
      notes 
    } = body;

    if (!studentId || !subjectSchedId || !status) {
      return NextResponse.json({ 
        error: 'studentId, subjectSchedId, and status are required' 
      }, { status: 400 });
    }

    // Validate student exists and is enrolled
    const student = await prisma.student.findUnique({
      where: { studentId: parseInt(studentId) },
      include: { User: true }
    });

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // Validate subject schedule
    const subjectSchedule = await prisma.subjectSchedule.findUnique({
      where: { subjectSchedId: parseInt(subjectSchedId) },
      include: { subject: true, section: true }
    });

    if (!subjectSchedule) {
      return NextResponse.json({ error: 'Subject schedule not found' }, { status: 404 });
    }

    // Check if student is enrolled in this schedule
    const enrollment = await prisma.studentSchedule.findFirst({
      where: {
        studentId: parseInt(studentId),
        scheduleId: parseInt(subjectSchedId),
        status: 'ACTIVE'
      }
    });

    if (!enrollment) {
      return NextResponse.json({ 
        error: 'Student is not enrolled in this class' 
      }, { status: 400 });
    }

    // Check for existing attendance record today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const existingAttendance = await prisma.attendance.findFirst({
      where: {
        studentId: parseInt(studentId),
        subjectSchedId: parseInt(subjectSchedId),
        timestamp: {
          gte: today,
          lt: tomorrow
        }
      }
    });

    let attendanceRecord;

    if (existingAttendance) {
      // Update existing record
      attendanceRecord = await prisma.attendance.update({
        where: { attendanceId: existingAttendance.attendanceId },
        data: {
          status: status as any,
          originalStatus: existingAttendance.status,
          overrideBy: actorUserId,
          overrideReason: reason || 'Manual override',
          notes: notes || existingAttendance.notes,
          verification: 'PENDING'
        },
        include: {
          student: {
            include: {
              User: true,
              Department: true,
              CourseOffering: true
            }
          },
          subjectSchedule: {
            include: {
              subject: true,
              section: true,
              instructor: true
            }
          }
        }
      });
    } else {
      // Create new attendance record
      attendanceRecord = await prisma.attendance.create({
        data: {
          userId: student.userId,
          userRole: 'STUDENT',
          studentId: parseInt(studentId),
          subjectSchedId: parseInt(subjectSchedId),
          status: status as any,
          attendanceType: 'MANUAL_ENTRY',
          verification: 'PENDING',
          timestamp: timestamp ? new Date(timestamp) : new Date(),
          notes: notes,
          overrideBy: actorUserId,
          overrideReason: reason || 'Manual override'
        },
        include: {
          student: {
            include: {
              User: true,
              Department: true,
              CourseOffering: true
            }
          },
          subjectSchedule: {
            include: {
              subject: true,
              section: true,
              instructor: true
            }
          }
        }
      });
    }

    // Audit the override
    const audit = new ComprehensiveAuditService();
    await audit.logEvent({
      userId: actorUserId,
      userEmail: actor.email,
      action: 'ATTENDANCE_MANUAL_OVERRIDE',
      category: 'ATTENDANCE',
      resource: 'ATTENDANCE_RECORD',
      severity: 'MEDIUM',
      details: { 
        studentId: parseInt(studentId),
        studentName: `${student.firstName} ${student.lastName}`,
        subjectSchedId: parseInt(subjectSchedId),
        subjectName: subjectSchedule.subject.subjectName,
        newStatus: status,
        originalStatus: existingAttendance?.status || 'NONE',
        reason: reason || 'Manual override',
        attendanceId: attendanceRecord.attendanceId
      },
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    } as any);

    // Notification: manual override applied/updated
    try {
      await createNotification(actorUserId, {
        title: 'Attendance override updated',
        message: `${student.firstName} ${student.lastName}: ${existingAttendance ? 'Updated' : 'Created'} to ${status} – ${subjectSchedule.subject.subjectName}`,
        priority: 'NORMAL',
        type: 'ATTENDANCE',
      });
    } catch (e) {
      console.warn('Notification create failed (attendance override):', e);
    }

    // Emit WebSocket update
    try {
      const { emitAttendanceUpdate } = await import('@/lib/websocket');
      emitAttendanceUpdate({
        attendanceId: attendanceRecord.attendanceId,
        studentId: parseInt(studentId),
        subjectSchedId: parseInt(subjectSchedId),
        status: status,
        timestamp: attendanceRecord.timestamp,
        studentName: `${student.firstName} ${student.lastName}`,
        overrideBy: actorUserId,
        isManualOverride: true
      });
    } catch (wsError) {
      console.log('WebSocket not available:', wsError);
    }

    return NextResponse.json({ 
      success: true,
      message: 'Attendance status updated successfully',
      data: {
        attendanceId: attendanceRecord.attendanceId,
        studentId: parseInt(studentId),
        studentName: `${student.firstName} ${student.lastName}`,
        status: status,
        timestamp: attendanceRecord.timestamp,
        isOverride: true,
        overriddenBy: actorUserId
      }
    });

  } catch (e: any) {
    console.error('Manual override error:', e);
    return NextResponse.json({ 
      error: e?.message || 'Failed to update attendance' 
    }, { status: 500 });
  }
}
