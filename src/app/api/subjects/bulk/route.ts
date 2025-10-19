import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createNotification } from '@/lib/notifications';
import { SubjectType, SemesterType, SubjectStatus } from '@prisma/client';
import { z } from 'zod';

// Validation schema for bulk subject creation
const bulkSubjectSchema = z.object({
  records: z.array(z.object({
    subjectName: z.string().min(1, "Subject name is required"),
    subjectCode: z.string().min(1, "Subject code is required"),
    subjectType: z.enum(["LECTURE", "LABORATORY", "HYBRID", "THESIS", "RESEARCH", "INTERNSHIP"]),
    courseId: z.number().min(1, "Course ID is required"),
    departmentId: z.number().min(1, "Department ID is required"),
    academicYear: z.string().min(1, "Academic year is required"),
    semester: z.enum(["FIRST_SEMESTER", "SECOND_SEMESTER", "THIRD_SEMESTER"]),
    totalHours: z.number().min(1, "Total hours must be at least 1"),
    lectureUnits: z.number().min(0).default(0),
    labUnits: z.number().min(0).default(0),
    creditedUnits: z.number().min(1, "Credited units must be at least 1"),
    description: z.string().optional(),
    prerequisites: z.string().optional(),
    maxStudents: z.number().min(1).default(30),
    status: z.enum(["ACTIVE", "INACTIVE", "ARCHIVED", "PENDING_REVIEW"]).default("ACTIVE"),
  })),
  options: z.object({
    skipDuplicates: z.boolean().default(true),
    updateExisting: z.boolean().default(false),
  }).optional().default({}),
});

async function assertAdmin(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  if (!token) return { ok: false, res: NextResponse.json({ error: 'Authentication required' }, { status: 401 }) };
  try {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId as number;
    const user = await prisma.user.findUnique({ where: { userId }, select: { role: true } });
    if (!user || (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN')) {
      return { ok: false, res: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
    }
    return { ok: true } as const;
  } catch {
    return { ok: false, res: NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 }) };
  }
}

export async function POST(request: NextRequest) {
  try {
    const gate = await assertAdmin(request);
    if (!('ok' in gate) || gate.ok !== true) return gate.res;
    const body = await request.json();
    console.log('Bulk subject import request:', JSON.stringify(body, null, 2));
    
    const { records, options } = bulkSubjectSchema.parse(body);
    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
      duplicates: 0,
      updated: 0,
    };

    // Process each subject record
    for (const record of records) {
      try {
        // Check if subject code already exists
        const existingSubject = await prisma.subjects.findFirst({
          where: { subjectCode: record.subjectCode },
        });

        if (existingSubject) {
          if (options.updateExisting) {
            // Update existing subject
            await prisma.subjects.update({
              where: { subjectId: existingSubject.subjectId },
              data: {
                subjectName: record.subjectName,
                subjectType: record.subjectType as SubjectType,
                courseId: record.courseId,
                departmentId: record.departmentId,
                academicYear: record.academicYear,
                semester: record.semester as SemesterType,
                totalHours: record.totalHours,
                lectureUnits: record.lectureUnits,
                labUnits: record.labUnits,
                creditedUnits: record.creditedUnits,
                description: record.description || "",
                prerequisites: record.prerequisites || "",
                maxStudents: record.maxStudents,
                status: record.status as SubjectStatus,
                updatedAt: new Date(),
              },
            });
            results.updated++;
          } else if (options.skipDuplicates) {
            results.duplicates++;
            continue;
          } else {
            results.errors.push(`Subject with code ${record.subjectCode} already exists`);
            results.failed++;
            continue;
          }
        } else {
          // Verify course and department exist
          const [course, department] = await Promise.all([
            prisma.courseOffering.findUnique({ where: { courseId: record.courseId } }),
            prisma.department.findUnique({ where: { departmentId: record.departmentId } })
          ]);

          if (!course) {
            results.errors.push(`Course with ID ${record.courseId} not found for subject ${record.subjectCode}`);
            results.failed++;
            continue;
          }

          if (!department) {
            results.errors.push(`Department with ID ${record.departmentId} not found for subject ${record.subjectCode}`);
            results.failed++;
            continue;
          }

          // Create new subject
          await prisma.subjects.create({
            data: {
              subjectName: record.subjectName,
              subjectCode: record.subjectCode,
              subjectType: record.subjectType as SubjectType,
              courseId: record.courseId,
              departmentId: record.departmentId,
              academicYear: record.academicYear,
              semester: record.semester as SemesterType,
              totalHours: record.totalHours,
              lectureUnits: record.lectureUnits,
              labUnits: record.labUnits,
              creditedUnits: record.creditedUnits,
              description: record.description || "",
              prerequisites: record.prerequisites || "",
              maxStudents: record.maxStudents,
              status: record.status as SubjectStatus,
            },
          });
          results.success++;
        }
      } catch (error) {
        console.error(`Error processing subject ${record.subjectCode}:`, error);
        results.errors.push(`Failed to process subject ${record.subjectCode}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        results.failed++;
      }
    }

    try {
      const token = request.cookies.get('token')?.value;
      if (token) {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = Number((decoded as any)?.userId);
        if (Number.isFinite(userId)) {
          await createNotification(userId, {
            title: 'Import completed',
            message: `Subjects import: ${results.success} success, ${results.failed} failed, ${results.duplicates} duplicates, ${results.updated} updated`,
            priority: results.failed > 0 ? 'NORMAL' : 'NORMAL',
            type: 'DATA',
          });
        }
      }
    } catch {}

    return NextResponse.json({
      message: `Bulk import completed. Success: ${results.success}, Failed: ${results.failed}, Duplicates: ${results.duplicates}, Updated: ${results.updated}`,
      results
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error in bulk subject import:', error);
    return NextResponse.json(
      { error: 'Failed to process bulk import' },
      { status: 500 }
    );
  }
}
