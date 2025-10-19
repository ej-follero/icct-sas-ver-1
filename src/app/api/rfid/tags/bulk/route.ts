import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createNotification } from '@/lib/notifications';

export async function POST(request: NextRequest) {
  try {
    // JWT Authentication - Admin only
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = Number((decoded as any)?.userId);
    if (!Number.isFinite(userId)) {
      return NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 });
    }

    // Check user exists and is active
    const user = await prisma.user.findUnique({
      where: { userId },
      select: { status: true, role: true }
    });

    if (!user || user.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'User not found or inactive' }, { status: 401 });
    }

    // Admin-only access control
    const adminRoles = ['SUPER_ADMIN', 'ADMIN'];
    if (!adminRoles.includes(user.role)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    try {
    const body = await request.json().catch(() => ({}));
    const records = Array.isArray(body?.records) ? body.records : [];
    const options = body?.options || {};
    
    console.log('RFID Tags bulk import request received:', { 
      recordCount: records.length,
      options 
    });
    
    if (records.length === 0) {
      return NextResponse.json({ error: 'No records provided' }, { status: 400 });
    }

    let success = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const rec of records) {
      try {
        const tagNumber = String(rec.tagNumber || '').trim();
        if (!tagNumber) {
          throw new Error('Tag number is required');
        }

        // Validate tag type
        const validTagTypes = ['STUDENT_CARD', 'TEMPORARY_PASS', 'VISITOR_PASS', 'MAINTENANCE', 'TEST'];
        const tagType = 'STUDENT_CARD';
        if (!validTagTypes.includes(tagType)) {
          throw new Error(`Invalid tag type: ${tagType}`);
        }

        // Validate status
        const validStatuses = ['ACTIVE', 'INACTIVE', 'LOST', 'DAMAGED', 'EXPIRED', 'REPLACED', 'RESERVED'];
        const status = rec.status || 'ACTIVE';
        if (!validStatuses.includes(status)) {
          throw new Error(`Invalid status: ${status}`);
        }

        // Validate foreign key references before creating the record
        let assignedBy = null;
        if (rec.assignedBy) {
          const assignedByNum = Number(rec.assignedBy);
          if (!isNaN(assignedByNum)) {
            // Check if the assignedBy user exists
            const assignedByUser = await prisma.user.findUnique({
              where: { userId: assignedByNum }
            });
            if (assignedByUser) {
              assignedBy = assignedByNum;
            } else {
              console.warn(`assignedBy user ${assignedByNum} not found, setting to null`);
            }
          }
        }

        let studentId = null;
        if (rec.studentId) {
          const studentIdNum = Number(rec.studentId);
          if (!isNaN(studentIdNum)) {
            // Check if the student exists
            const student = await prisma.student.findUnique({
              where: { studentId: studentIdNum }
            });
            if (student) {
              studentId = studentIdNum;
            } else {
              console.warn(`Student ${studentIdNum} not found, setting to null`);
            }
          }
        }

        // Instructor assignment removed

        // Prepare data for database
        const data: any = {
          tagNumber,
          tagType,
          status,
          notes: rec.notes || null,
          studentId,
          assignedBy,
          assignmentReason: rec.assignmentReason || null,
          expiresAt: rec.expiresAt ? new Date(rec.expiresAt) : null,
        };

        console.log('Processing RFID tag record:', { tagNumber, data });

        // Use upsert to handle duplicates if skipDuplicates is false
        if (options.skipDuplicates) {
          // Check if tag already exists
          const existingTag = await prisma.rFIDTags.findUnique({
            where: { tagNumber }
          });
          
          if (existingTag) {
            console.log('Skipping duplicate tag:', tagNumber);
            continue; // Skip this record
          }
        }

        try {
          const result = await prisma.rFIDTags.upsert({
            where: { tagNumber },
            update: options.updateExisting ? data : undefined,
            create: data,
          });

          if (result) {
            success++;
            console.log('Successfully processed tag:', tagNumber);
          } else {
            failed++;
            errors.push(`Failed to create/update tag: ${tagNumber}`);
          }
        } catch (dbError: any) {
          // Handle specific database errors
          if (dbError.code === 'P2003') {
            // Foreign key constraint violation
            const field = dbError.meta?.field_name || 'unknown field';
            throw new Error(`Foreign key constraint violation: ${field} references a non-existent record`);
          } else if (dbError.code === 'P2002') {
            // Unique constraint violation
            throw new Error(`Tag number ${tagNumber} already exists`);
          } else {
            throw new Error(`Database error: ${dbError.message}`);
          }
        }
      } catch (e: any) {
        console.error('Error processing RFID tag record:', rec, e);
        failed++;
        errors.push(`Tag ${rec.tagNumber || 'unknown'}: ${e?.message || 'Unknown error'}`);
      }
    }

    console.log('RFID Tags bulk import completed:', { success, failed, errors: errors.length });

    try {
      await createNotification(userId, {
        title: 'Import completed',
        message: `RFID tags import: ${success} success, ${failed} failed`,
        priority: failed > 0 ? 'NORMAL' : 'NORMAL',
        type: 'DATA',
      });
    } catch {}
    return NextResponse.json({ 
      results: { 
        success, 
        failed, 
        errors: errors.slice(0, 10) // Limit errors to prevent huge responses
      } 
    });
    } catch (e: any) {
      console.error('RFID Tags bulk import error:', e);
      return NextResponse.json({ 
        error: e?.message || 'RFID Tags bulk import failed' 
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('RFID Tags bulk import error:', error);
    return NextResponse.json({ 
      error: error?.message || 'RFID Tags bulk import failed' 
    }, { status: 500 });
  }
}
