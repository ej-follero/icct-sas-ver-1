import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { ComprehensiveAuditService } from '@/lib/services/comprehensive-audit.service';

// Simple in-memory rate limiter (per tag + student) for kiosk
const attempts = new Map<string, { count: number; firstAt: number }>();
function rateLimit(key: string, limit = 5, windowMs = 5 * 60 * 1000) {
  const now = Date.now();
  const entry = attempts.get(key);
  if (!entry || now - entry.firstAt > windowMs) {
    attempts.set(key, { count: 1, firstAt: now });
    return { allowed: true };
  }
  if (entry.count >= limit) return { allowed: false };
  entry.count += 1;
  return { allowed: true };
}

// POST /api/rfid/assign/kiosk
// Body: { studentIdNum: string; pin: string; tagNumber: string }
export async function POST(request: NextRequest) {
  try {
    // No admin auth here; kiosk is self-service with student PIN verification
    const body = await request.json();
    const studentIdNum = String(body?.studentIdNum || '').trim();
    const pin = String(body?.pin || '').trim();
    const tagNumber = String(body?.tagNumber || '').trim();
    const key = `${studentIdNum}:${tagNumber}`;
    const rl = rateLimit(key);
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Too many attempts, try later' }, { status: 429 });
    }


    if (!studentIdNum || !pin || !tagNumber) {
      return NextResponse.json({ error: 'studentIdNum, pin, and tagNumber are required' }, { status: 400 });
    }

    // Verify student and PIN (assumes Guardian or User has a PIN; falling back to lastName-based PIN is not secure)
    const student = await prisma.student.findUnique({
      where: { studentIdNum },
      include: { User: true }
    });
    if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 });

    // For demo: compare against User.tempPin or similar field if exists
    // Adjust to your actual PIN storage/verification strategy
    const user = student.User;
    const storedHash = user?.twoFactorSecret || null;
    const ok = storedHash ? await bcrypt.compare(pin, storedHash) : false;
    if (!ok) {
      // Audit failed attempt
      const audit = new ComprehensiveAuditService();
      await audit.logEvent({
        userId: student.User?.userId,
        userEmail: student.User?.email,
        action: 'KIOSK_PIN_FAILED',
        category: 'SECURITY',
        resource: 'KIOSK_RFID_BIND',
        severity: 'MEDIUM',
        details: { studentIdNum },
        ipAddress: undefined,
        userAgent: undefined,
      } as any);
      // Send error feedback via MQTT
      try {
        const mqtt = require('mqtt');
        const client = mqtt.connect(process.env.MQTT_BROKER || 'ws://localhost:9001', {
          username: process.env.MQTT_USERNAME,
          password: process.env.MQTT_PASSWORD,
          clientId: `kiosk-error-${Date.now()}`
        });
        
        client.on('connect', () => {
          client.publish('/attendance/feedback', JSON.stringify({
            topic: '/attendance/feedback',
            message: 'Invalid PIN',
            value: studentIdNum
          }));
          client.end();
        });
      } catch (mqttError) {
        console.log('MQTT feedback not available:', mqttError);
      }
      
      return NextResponse.json({ error: 'Invalid PIN' }, { status: 401 });
    }

    // Ensure tag record exists
    const existingTag = await prisma.rFIDTags.findUnique({ where: { tagNumber } });
    if (!existingTag) {
      await prisma.rFIDTags.create({ data: { tagNumber, tagType: 'STUDENT_CARD', status: 'ACTIVE' } });
    }

    // Enforce uniqueness: tag not bound to another student
    const tagInUse = await prisma.rFIDTags.findFirst({ where: { tagNumber, NOT: { studentId: null } } });
    if (tagInUse && tagInUse.studentId !== student.studentId) {
      return NextResponse.json({ error: 'Tag already assigned to another student' }, { status: 409 });
    }

    await prisma.$transaction(async (tx) => {
      // If student already has a tag, require admin replacement outside kiosk
      if (student.rfidTag && student.rfidTag !== tagNumber) {
        throw new Error('Student already has a tag; contact admin for replacement');
      }

      await tx.student.update({ where: { studentId: student.studentId }, data: { rfidTag: tagNumber } });
      await tx.rFIDTags.update({
        where: { tagNumber },
        data: { studentId: student.studentId, status: 'ACTIVE', assignedAt: new Date(), assignmentReason: 'KIOSK_SELF_SERVICE' }
      });
    });
    // Audit success
    const audit = new ComprehensiveAuditService();
    await audit.logEvent({
      userId: student.User?.userId,
      userEmail: student.User?.email,
      action: 'KIOSK_RFID_BIND',
      category: 'RFID',
      resource: 'KIOSK_RFID_BIND',
      severity: 'LOW',
      details: { studentId: student.studentId, tagNumber },
      ipAddress: undefined,
      userAgent: undefined,
    } as any);

    // Send success feedback via MQTT (if available)
    try {
      const mqtt = require('mqtt');
      const client = mqtt.connect(process.env.MQTT_BROKER || 'ws://localhost:9001', {
        username: process.env.MQTT_USERNAME,
        password: process.env.MQTT_PASSWORD,
        clientId: `kiosk-success-${Date.now()}`
      });
      
      client.on('connect', () => {
        client.publish('/attendance/feedback', JSON.stringify({
          topic: '/attendance/feedback',
          message: 'Card bound successfully',
          value: tagNumber,
          studentIdNum,
          timestamp: new Date().toISOString(),
          status: 'SUCCESS'
        }));
        client.end();
      });
    } catch (mqttError) {
      console.log('MQTT feedback not available:', mqttError);
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    const message = e?.message || 'Kiosk assignment failed';
    const status = message.includes('replacement') ? 409 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}


