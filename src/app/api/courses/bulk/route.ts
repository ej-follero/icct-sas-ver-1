import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createNotification } from '@/lib/notifications';
import { CourseStatus, CourseType } from '@prisma/client';
import { z } from 'zod';

// Validation schema for bulk course creation
const bulkCourseSchema = z.object({
  records: z.array(z.object({
    name: z.string().min(1, "Course name is required"),
    code: z.string()
      .min(2, "Course code must be at least 2 characters")
      .max(10, "Course code must be less than 10 characters")
      .regex(/^[A-Z0-9]+$/, "Course code must contain only uppercase letters and numbers"),
    departmentId: z.number().min(1, "Department ID is required"),
    description: z.string().optional(),
    units: z.number().min(1, "Units must be at least 1").max(10, "Units cannot exceed 10"),
    status: z.enum(["ACTIVE", "INACTIVE", "ARCHIVED", "PENDING_REVIEW"]).default("ACTIVE"),
    courseType: z.enum(["MANDATORY", "ELECTIVE"]).default("MANDATORY"),
    major: z.string().optional(),
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
    console.log('Bulk course import request:', JSON.stringify(body, null, 2));
    
    const { records, options } = bulkCourseSchema.parse(body);
    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
      duplicates: 0,
      updated: 0,
    };

    // Process each course record
    for (const record of records) {
      try {
        // Check if course code already exists
        const existingCourse = await prisma.courseOffering.findFirst({
          where: { courseCode: record.code },
        });

        if (existingCourse) {
          if (options.updateExisting) {
            // Update existing course
            await prisma.courseOffering.update({
              where: { courseId: existingCourse.courseId },
              data: {
                courseName: record.name,
                description: record.description || "",
                totalUnits: record.units,
                courseStatus: record.status as CourseStatus,
                courseType: record.courseType as CourseType,
                major: record.major,
                updatedAt: new Date(),
              },
            });
            results.updated++;
          } else if (options.skipDuplicates) {
            results.duplicates++;
            continue;
          } else {
            results.errors.push(`Course with code ${record.code} already exists`);
            results.failed++;
            continue;
          }
        } else {
          // Verify department exists
          const department = await prisma.department.findUnique({
            where: { departmentId: record.departmentId },
          });

          if (!department) {
            results.errors.push(`Department with ID ${record.departmentId} not found for course ${record.code}`);
            results.failed++;
            continue;
          }

          // Create new course
          await prisma.courseOffering.create({
            data: {
              courseName: record.name,
              courseCode: record.code,
              departmentId: record.departmentId,
              description: record.description || "",
              totalUnits: record.units,
              courseStatus: record.status as CourseStatus,
              courseType: record.courseType as CourseType,
              major: record.major,
            },
          });
          results.success++;
        }
      } catch (error) {
        console.error(`Error processing course ${record.code}:`, error);
        results.errors.push(`Failed to process course ${record.code}: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
            message: `Courses import: ${results.success} success, ${results.failed} failed, ${results.duplicates} duplicates, ${results.updated} updated`,
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

    console.error('Error in bulk course import:', error);
    return NextResponse.json(
      { error: 'Failed to process bulk import' },
      { status: 500 }
    );
  }
}
