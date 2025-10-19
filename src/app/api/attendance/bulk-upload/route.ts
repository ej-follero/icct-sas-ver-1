import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parse } from 'csv-parse/sync';
import { createNotification } from '@/lib/notifications';
import * as XLSX from 'xlsx';

export async function POST(request: NextRequest) {
  try {
    // Optional: identify actor for notification
    let actorUserId: number | null = null;
    try {
      const token = request.cookies.get('token')?.value;
      if (token) {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const uid = Number((decoded as any)?.userId);
        if (Number.isFinite(uid)) actorUserId = uid;
      }
    } catch {}
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const entityType = formData.get('entityType') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!entityType || !['student', 'instructor'].includes(entityType)) {
      return NextResponse.json({ error: 'Invalid entity type' }, { status: 400 });
    }

    // Read and parse file based on type
    let records: any[] = [];
    const fileName = file.name.toLowerCase();
    
    if (fileName.endsWith('.csv')) {
      // Handle CSV files
      const csvText = await file.text();
      records = parse(csvText, {
        columns: true,
        skip_empty_lines: true,
        trim: true
      });
    } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      // Handle Excel files
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as unknown[];
      
      if (jsonData.length < 2) {
        return NextResponse.json({ error: 'Excel file must have at least a header row and one data row' }, { status: 400 });
      }
      
      // Convert to records format
      const headers = jsonData[0] as unknown as string[];
      records = (jsonData.slice(1) as unknown[]).map((rowUnknown, idx) => {
        const row = rowUnknown as any[];
        const record: any = {};
        headers.forEach((header, index) => {
          record[header] = row[index] || '';
        });
        return record;
      });
    } else {
      return NextResponse.json({ error: 'Unsupported file format. Please upload CSV or Excel files.' }, { status: 400 });
    }

    if (records.length === 0) {
      return NextResponse.json({ error: 'No data found in file' }, { status: 400 });
    }

    const results = {
      success: 0,
      errors: [] as string[]
    };

    // Process each record
    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      const rowNumber = i + 2; // +2 because CSV is 1-indexed and we skip header

      try {
        // Validate required fields
        if (!record['Entity ID']) {
          results.errors.push(`Row ${rowNumber}: Entity ID is required`);
          continue;
        }

        if (!record['Status']) {
          results.errors.push(`Row ${rowNumber}: Status is required`);
          continue;
        }

        // Validate status
        const validStatuses = ['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'];
        if (!validStatuses.includes(record['Status'])) {
          results.errors.push(`Row ${rowNumber}: Invalid status '${record['Status']}'. Must be one of: ${validStatuses.join(', ')}`);
          continue;
        }

        // Parse timestamp
        let timestamp = new Date();
        if (record['Timestamp']) {
          const parsedTimestamp = new Date(record['Timestamp']);
          if (isNaN(parsedTimestamp.getTime())) {
            results.errors.push(`Row ${rowNumber}: Invalid timestamp format '${record['Timestamp']}'`);
            continue;
          }
          timestamp = parsedTimestamp;
        }

        // Check if entity exists
        const entityId = parseInt(record['Entity ID']);
        if (isNaN(entityId)) {
          results.errors.push(`Row ${rowNumber}: Entity ID must be a number`);
          continue;
        }

        // Resolve userId for Attendance (must reference User.userId per schema)
        let userIdForAttendance: number | null = null;
        if (entityType === 'student') {
          const student = await prisma.student.findUnique({
            where: { studentId: entityId },
            select: { userId: true }
          });
          if (!student) {
            results.errors.push(`Row ${rowNumber}: student with ID ${entityId} not found`);
            continue;
          }
          userIdForAttendance = student.userId;
        } else {
          // instructor: find Instructor, then map to User by email
          const instructor = await prisma.instructor.findUnique({
            where: { instructorId: entityId },
            select: { email: true }
          });
          if (!instructor) {
            results.errors.push(`Row ${rowNumber}: instructor with ID ${entityId} not found`);
            continue;
          }
          const user = await prisma.user.findUnique({ where: { email: instructor.email }, select: { userId: true } });
          if (!user) {
            results.errors.push(`Row ${rowNumber}: user account for instructor email ${instructor.email} not found`);
            continue;
          }
          userIdForAttendance = user.userId;
        }

        // Check if subject schedule exists (if provided)
        let subjectScheduleId: number | null = null;
        if (record['Subject Schedule ID']) {
          const schedId = parseInt(record['Subject Schedule ID']);
          if (!isNaN(schedId)) {
            const schedule = await prisma.subjectSchedule.findUnique({
              where: { subjectSchedId: schedId },
              select: { subjectSchedId: true }
            });
            if (!schedule) {
              results.errors.push(`Row ${rowNumber}: Subject schedule with ID ${schedId} not found`);
              continue;
            }
            subjectScheduleId = schedId;
          }
        }

        // Create attendance record
        await prisma.attendance.create({
          data: {
            userId: userIdForAttendance!,
            userRole: entityType === 'student' ? 'STUDENT' : 'INSTRUCTOR',
            status: record['Status'],
            attendanceType: 'MANUAL_ENTRY',
            timestamp,
            subjectSchedId: subjectScheduleId,
            notes: record['Notes'] || null,
            studentId: entityType === 'student' ? entityId : null,
            // No instructorId field in Attendance schema; instructor linked via userId/userRole
            verification: 'PENDING'
          }
        });

        results.success++;

      } catch (error) {
        results.errors.push(`Row ${rowNumber}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Notify actor about import summary
    if (actorUserId) {
      try {
        await createNotification(actorUserId, {
          title: 'Attendance import completed',
          message: `Success: ${results.success}, Failed: ${results.errors.length}`,
          priority: results.errors.length > 0 ? 'NORMAL' : 'LOW',
          type: 'ATTENDANCE',
        });
      } catch {}
    }

    return NextResponse.json(results);

  } catch (error) {
    console.error('Bulk upload error:', error);
    return NextResponse.json(
      { error: 'Failed to process file upload' },
      { status: 500 }
    );
  }
}
