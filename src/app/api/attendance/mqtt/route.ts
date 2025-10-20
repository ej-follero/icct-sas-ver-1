import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ComprehensiveAuditService } from '@/lib/services/comprehensive-audit.service';

// POST /api/attendance/mqtt
// Body: { rfid: string; readerId?: number; location?: string; deviceInfo?: any }
// This endpoint processes MQTT attendance messages and creates attendance records
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { rfid, readerId, location, deviceInfo } = body;

    if (!rfid) {
      return NextResponse.json({ 
        error: 'RFID tag is required' 
      }, { status: 400 });
    }

    // Find student by RFID tag - check both Student.rfidTag and RFIDTags.tagNumber
    let student = await prisma.student.findUnique({
      where: { rfidTag: rfid },
      include: {
        User: true,
        Department: true,
        CourseOffering: true
      }
    });

    // If not found in Student.rfidTag, check RFIDTags table
    if (!student) {
      const rfidTag = await prisma.rFIDTags.findUnique({
        where: { tagNumber: rfid },
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

      if (rfidTag?.student) {
        student = rfidTag.student;
      }
    }

    if (!student) {
      // Log failed scan for auditability
      try {
        await prisma.rFIDLogs.create({
          data: {
            rfidTag: rfid,
            readerId: readerId || 1,
            scanType: 'CHECK_IN',
            scanStatus: 'FAILED',
            location: location || 'Unknown',
            userId: 0, // unknown user
            userRole: 'STUDENT',
            timestamp: new Date(),
            deviceInfo: deviceInfo || null,
          },
        });
        // Optionally log a reader event of type SCAN_ERROR
        // If readerId provided, we can attach a reader log record in a separate table if desired
      } catch (logErr) {
        console.warn('Failed to log unknown RFID scan', logErr);
      }

      return NextResponse.json({ 
        success: false,
        error: 'Card not found'
      }, { status: 404 });
    }

    // Check if student is active
    if (student.status !== 'ACTIVE') {
      return NextResponse.json({ 
        error: 'Student is not active',
        studentId: student.studentId 
      }, { status: 400 });
    }

    // Get current active semester
    const currentSemester = await prisma.semester.findFirst({
      where: { 
        status: 'CURRENT',
        isActive: true 
      }
    });

    if (!currentSemester) {
      return NextResponse.json({ 
        error: 'No active semester found' 
      }, { status: 400 });
    }

    // Find current subject schedule for the student
    const now = new Date();
    const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
    const currentTime = now.toTimeString().slice(0, 5);

    const currentSchedule = await prisma.subjectSchedule.findFirst({
      where: {
        StudentSchedule: {
          some: {
            studentId: student.studentId,
            status: 'ACTIVE'
          }
        },
        day: currentDay as any,
        startTime: { lte: currentTime },
        endTime: { gte: currentTime },
        status: 'ACTIVE',
        semesterId: currentSemester.semesterId
      },
      include: {
        subject: true,
        section: true,
        instructor: true,
        room: true
      }
    });

    // Optional: if no matching schedule now, treat as not-on-schedule
    if (!currentSchedule) {
      return NextResponse.json({ success: false, error: 'Not on schedule' }, { status: 400 });
    }

    // Determine attendance status based on time
    let attendanceStatus = 'PRESENT';
    const scheduleStart = new Date(`${now.toDateString()} ${currentSchedule.startTime}`);
    const lateThreshold = new Date(scheduleStart.getTime() + 15 * 60 * 1000); // 15 minutes late
    if (now > lateThreshold) {
      attendanceStatus = 'LATE';
    }

    // Create RFID log first
    const rfidLog = await prisma.rFIDLogs.create({
      data: {
        rfidTag: rfid,
        readerId: readerId || 1, // Default reader if not provided
        scanType: 'CHECK_IN',
        scanStatus: 'SUCCESS',
        location: location || 'Unknown',
        userId: student.userId,
        userRole: 'STUDENT',
        timestamp: now,
        deviceInfo: deviceInfo || null
      },
      include: {
        reader: true
      }
    });

    // Idempotency: prevent double taps within 60s for same student+schedule
    const recent = await prisma.attendance.findFirst({
      where: {
        studentId: student.studentId,
        subjectSchedId: currentSchedule.subjectSchedId,
        timestamp: { gte: new Date(now.getTime() - 60 * 1000) },
      },
      orderBy: { timestamp: 'desc' },
    });

    if (recent) {
      return NextResponse.json({ success: true, duplicate: true, attendance: recent });
    }

    // Create attendance record
    const attendance = await prisma.attendance.create({
      data: {
        userId: student.userId,
        userRole: 'STUDENT',
        studentId: student.studentId,
        subjectSchedId: currentSchedule.subjectSchedId,
        semesterId: currentSemester.semesterId,
        status: attendanceStatus as any,
        attendanceType: 'RFID_SCAN',
        verification: 'PENDING',
        timestamp: now,
        rfidLogId: rfidLog.logsId,
        notes: `Attended ${currentSchedule.subject.subjectName}`
      }
    });

    // Audit the attendance creation
    const audit = new ComprehensiveAuditService();
    await audit.logEvent({
      userId: student.userId,
      userEmail: student.User?.email,
      action: 'RFID_ATTENDANCE_SCAN',
      category: 'ATTENDANCE',
      resource: 'ATTENDANCE_RECORD',
      severity: 'LOW',
      details: { 
        studentId: student.studentId,
        rfid,
        attendanceId: attendance.attendanceId,
        status: attendanceStatus,
        subject: currentSchedule?.subject?.subjectName || 'General'
      },
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    } as any);

    // Emit WebSocket update
    try {
      const { emitAttendanceUpdate } = await import('@/lib/websocket');
      emitAttendanceUpdate({
        attendanceId: attendance.attendanceId,
        studentId: student.studentId,
        subjectSchedId: currentSchedule?.subjectSchedId,
        status: attendanceStatus,
        timestamp: attendance.timestamp,
        studentName: `${student.firstName} ${student.lastName}`,
        studentIdNum: student.studentIdNum,
        subject: currentSchedule?.subject?.subjectName || 'General',
        section: currentSchedule?.section?.sectionName || 'N/A',
        room: currentSchedule?.room?.roomNo || 'N/A',
        rfidReader: rfidLog.reader?.deviceName || 'Unknown',
        location: location || 'Unknown'
      });
    } catch (wsError) {
      console.log('WebSocket not available:', wsError);
    }

    return NextResponse.json({ 
      success: true,
      attendance: {
        attendanceId: attendance.attendanceId,
        studentId: student.studentId,
        studentName: `${student.firstName} ${student.lastName}`,
        studentIdNum: student.studentIdNum,
        status: attendanceStatus,
        timestamp: attendance.timestamp,
        subject: currentSchedule?.subject?.subjectName || 'General',
        section: currentSchedule?.section?.sectionName || 'N/A',
        room: currentSchedule?.room?.roomNo || 'N/A'
      }
    });

  } catch (e: any) {
    console.error('MQTT attendance processing error:', e);
    return NextResponse.json({ 
      error: e?.message || 'Failed to process attendance' 
    }, { status: 500 });
  }
}
