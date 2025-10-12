import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ComprehensiveAuditService } from '@/lib/services/comprehensive-audit.service';

// POST /api/rfid/assign/mqtt
// Body: { studentIdNum: string; tagNumber: string; replace?: boolean; assignedBy?: number; reason?: string }
// This endpoint is designed to work with MQTT-triggered assignments
export async function POST(request: NextRequest) {
  try {
    // JWT auth: allow only SUPER_ADMIN / ADMIN
    const token = request.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const actorUserId = Number((decoded as any)?.userId);
    
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
    
    if (actor.role !== 'SUPER_ADMIN' && actor.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { studentIdNum, tagNumber, replace = false, assignedBy, reason } = body;

    if (!studentIdNum || !tagNumber) {
      return NextResponse.json({ 
        error: 'studentIdNum and tagNumber are required' 
      }, { status: 400 });
    }

    // Find student
    const student = await prisma.student.findUnique({
      where: { studentIdNum: String(studentIdNum) },
      include: { User: true }
    });

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // Ensure the RFID tag exists or create it
    const existingTag = await prisma.rFIDTags.findUnique({ where: { tagNumber } });
    if (!existingTag) {
      await prisma.rFIDTags.create({
        data: {
          tagNumber,
          tagType: 'STUDENT_CARD',
          status: 'ACTIVE'
        }
      });
    }

    // Check if tag is already assigned to another student
    const tagInUse = await prisma.rFIDTags.findFirst({
      where: { tagNumber, NOT: { studentId: null } }
    });

    if (tagInUse && tagInUse.studentId !== student.studentId) {
      return NextResponse.json({ 
        error: 'Tag already assigned to another student' 
      }, { status: 409 });
    }

    // Handle assignment in transaction
    await prisma.$transaction(async (tx) => {
      // If student already has a tag and replace is false, fail
      if (student.rfidTag && !replace) {
        throw new Error('Student already has a tag; set replace=true to override');
      }

      // If replace, clear previous tag mapping
      if (student.rfidTag && replace) {
        await tx.rFIDTags.updateMany({
          where: { tagNumber: student.rfidTag },
          data: { status: 'REPLACED', studentId: null }
        });
      }

      // Update student's RFID tag
      await tx.student.update({
        where: { studentId: student.studentId },
        data: { rfidTag: tagNumber }
      });

      // Bind tag to student in RFIDTags table
      await tx.rFIDTags.update({
        where: { tagNumber },
        data: {
          studentId: student.studentId,
          status: 'ACTIVE',
          assignedAt: new Date(),
          assignedBy: assignedBy || actorUserId,
          assignmentReason: reason || 'MQTT_ASSIGNMENT'
        }
      });
    });

    // Audit the assignment
    const audit = new ComprehensiveAuditService();
    await audit.logEvent({
      userId: actorUserId,
      userEmail: actor.email,
      action: 'RFID_MQTT_ASSIGN',
      category: 'RFID',
      resource: 'RFID_ASSIGNMENT',
      severity: 'LOW',
      details: { 
        studentId: student.studentId, 
        studentIdNum, 
        tagNumber,
        replace,
        source: 'MQTT'
      },
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    } as any);

    return NextResponse.json({ 
      success: true, 
      message: 'RFID tag assigned successfully',
      data: {
        studentId: student.studentId,
        studentIdNum,
        tagNumber,
        assignedAt: new Date().toISOString()
      }
    });

  } catch (e: any) {
    console.error('MQTT RFID assignment error:', e);
    return NextResponse.json({ 
      error: e?.message || 'MQTT assignment failed' 
    }, { status: 500 });
  }
}
