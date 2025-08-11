import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Validation schema for bulk course creation
const bulkCourseSchema = z.object({
  records: z.array(z.object({
    name: z.string().min(1, "Course name is required"),
    code: z.string()
      .min(2, "Course code must be at least 2 characters")
      .max(10, "Course code must be less than 10 characters")
      .regex(/^[A-Z0-9]+$/, "Course code must contain only uppercase letters and numbers"),
    department: z.string().min(1, "Department is required"),
    departmentCode: z.string().optional(),
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

export async function POST(request: NextRequest) {
  try {
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
                courseStatus: record.status,
                courseType: record.courseType,
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
          // Find department by name or code
          let departmentId: number | null = null;
          
          if (record.departmentCode) {
            const dept = await prisma.department.findFirst({
              where: { departmentCode: record.departmentCode },
            });
            departmentId = dept?.departmentId || null;
          }
          
          if (!departmentId) {
            const dept = await prisma.department.findFirst({
              where: { departmentName: { contains: record.department, mode: 'insensitive' } },
            });
            departmentId = dept?.departmentId || null;
          }

          if (!departmentId) {
            results.errors.push(`Department not found for course ${record.code}: ${record.department}`);
            results.failed++;
            continue;
          }

          // Create new course
          await prisma.courseOffering.create({
            data: {
              courseName: record.name,
              courseCode: record.code,
              departmentId: departmentId,
              description: record.description || "",
              totalUnits: record.units,
              courseStatus: record.status,
              courseType: record.courseType,
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
