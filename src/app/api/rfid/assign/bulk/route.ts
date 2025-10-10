import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ComprehensiveAuditService } from '@/lib/services/comprehensive-audit.service';

// POST /api/rfid/assign/bulk
// Body: { records: Array<{ studentId?: number; studentIdNum?: string; tagNumber: string; replace?: boolean; assignedBy?: number; reason?: string }>, options?: { dryRun?: boolean } }
export async function POST(request: NextRequest) {
  try {
    // JWT auth: allow only SUPER_ADMIN / ADMIN
    const token = request.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const actorUserId = Number((decoded as any)?.userId);
    if (!Number.isFinite(actorUserId)) return NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 });
    const actor = await prisma.user.findUnique({ where: { userId: actorUserId }, select: { role: true, status: true, email: true } });
    if (!actor || actor.status !== 'ACTIVE') return NextResponse.json({ error: 'User not found or inactive' }, { status: 404 });
    if (actor.role !== 'SUPER_ADMIN' && actor.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await request.json().catch(() => ({}));
    const records = Array.isArray(body?.records) ? body.records : [];
    const options = body?.options || {};

    if (records.length === 0) {
      return NextResponse.json({ error: 'No records provided' }, { status: 400 });
    }

    const results: Array<{ index: number; ok: boolean; message?: string }> = [];
    let success = 0;
    let failed = 0;

    for (let i = 0; i < records.length; i++) {
      const rec = records[i];
      try {
        const tagNumber = String(rec?.tagNumber || '').trim();
        if (!tagNumber) throw new Error('tagNumber is required');

        // Resolve student by id or studentIdNum
        let student = null as null | { studentId: number; rfidTag: string | null };
        if (rec.studentId) {
          student = await prisma.student.findUnique({
            where: { studentId: Number(rec.studentId) }
          });
        } else if (rec.studentIdNum) {
          student = await prisma.student.findUnique({
            where: { studentIdNum: String(rec.studentIdNum) }
          });
        }

        if (!student) throw new Error('Student not found');

        // Ensure the RFID tag exists or create placeholder in RFIDTags table
        const tag = await prisma.rFIDTags.findUnique({ where: { tagNumber } });
        if (!tag) {
          await prisma.rFIDTags.create({
            data: {
              tagNumber,
              tagType: 'STUDENT_CARD',
              status: 'ACTIVE'
            }
          });
        }

        // Uniqueness: ensure tagNumber is not assigned to another student
        const tagInUse = await prisma.rFIDTags.findFirst({
          where: { tagNumber, NOT: { studentId: null } },
          select: { studentId: true }
        });
        if (tagInUse && tagInUse.studentId !== student.studentId) {
          throw new Error('Tag already assigned to another student');
        }

        if (options.dryRun) {
          results.push({ index: i, ok: true, message: 'Dry run OK' });
          success++;
          continue;
        }

        // Assign inside a transaction
        await prisma.$transaction(async (tx) => {
          // If student has existing card and replace=false, fail
          if (student?.rfidTag && !rec.replace) {
            throw new Error('Student already has a tag; set replace=true to override');
          }

          // If replace, clear previous tag mapping (both Student.rfidTag and RFIDTags.studentId)
          if (student?.rfidTag && rec.replace) {
            await tx.rFIDTags.updateMany({
              where: { tagNumber: student.rfidTag },
              data: { status: 'REPLACED', studentId: null }
            });
          }

          // Update student primary tag field
          await tx.student.update({
            where: { studentId: student!.studentId },
            data: { rfidTag: tagNumber }
          });

          // Bind tag to student in RFIDTags table
          await tx.rFIDTags.update({
            where: { tagNumber },
            data: {
              studentId: student!.studentId,
              status: 'ACTIVE',
              assignedAt: new Date(),
              assignedBy: rec.assignedBy || null,
              assignmentReason: rec.reason || null
            }
          });
        });

        results.push({ index: i, ok: true });
        success++;
      } catch (e: any) {
        results.push({ index: i, ok: false, message: e?.message || 'Unknown error' });
        failed++;
      }
    }

    // Audit summary
    const audit = new ComprehensiveAuditService();
    const actorId = actorUserId;
    const actorEmail = actor.email || undefined;
    await audit.logEvent({
      userId: actorId || undefined,
      userEmail: actorEmail,
      action: 'RFID_BULK_ASSIGN',
      category: 'RFID',
      resource: 'RFID_ASSIGNMENT',
      severity: failed > 0 ? 'MEDIUM' : 'LOW',
      details: { success, failed, total: records.length },
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    } as any);

    return NextResponse.json({ summary: { success, failed, total: records.length }, results });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Bulk assignment failed' }, { status: 500 });
  }
}


