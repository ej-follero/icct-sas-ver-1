import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Validation schema for import records
const importRecordSchema = z.object({
  departmentName: z.string().min(2, "Department name must be at least 2 characters").max(100, "Department name must be less than 100 characters"),
  departmentCode: z.string().min(2, "Code must be at least 2 characters").max(10, "Code must be less than 10 characters").regex(/^[A-Z0-9]+$/, "Code must contain only uppercase letters and numbers"),
  departmentDescription: z.string().optional(),
  departmentStatus: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
});

const bulkImportSchema = z.object({
  records: z.array(importRecordSchema).min(1, "At least one record is required"),
  options: z.object({
    skipDuplicates: z.boolean().default(true),
    updateExisting: z.boolean().default(false),
  }).optional().default({
    skipDuplicates: true,
    updateExisting: false,
  }),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Bulk import request body:', JSON.stringify(body, null, 2));
    
    const { records, options } = bulkImportSchema.parse(body);
    console.log('Parsed records:', records.length, 'records');

    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
      details: [] as Array<{
        index: number;
        success: boolean;
        error?: string;
        departmentId?: string;
      }>,
    };

    // Process each record
    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      
      try {
        // Check if department already exists
        const existingDepartment = await prisma.department.findFirst({
          where: {
            OR: [
              { departmentCode: record.departmentCode },
              { departmentName: record.departmentName }
            ]
          }
        });

        if (existingDepartment) {
          if (options.skipDuplicates) {
            results.details.push({
              index: i,
              success: false,
              error: `Department with code "${record.departmentCode}" or name "${record.departmentName}" already exists`
            });
            results.failed++;
            continue;
          } else if (options.updateExisting) {
            // Update existing department
            await prisma.department.update({
              where: { departmentId: existingDepartment.departmentId },
              data: {
                departmentName: record.departmentName,
                departmentCode: record.departmentCode,
                departmentDescription: record.departmentDescription || '', // Provide default empty string
                departmentStatus: record.departmentStatus,
              }
            });
            
            results.details.push({
              index: i,
              success: true,
              departmentId: existingDepartment.departmentId.toString()
            });
            results.success++;
            continue;
          }
        }

        // Create new department
        const newDepartment = await prisma.department.create({
          data: {
            departmentName: record.departmentName,
            departmentCode: record.departmentCode,
            departmentDescription: record.departmentDescription || '', // Provide default empty string
            departmentStatus: record.departmentStatus,
            // Set default values for required fields
            departmentType: 'ACADEMIC',
          }
        });

        results.details.push({
          index: i,
          success: true,
          departmentId: newDepartment.departmentId.toString() // Use departmentId instead of id
        });
        results.success++;

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
        results.details.push({
          index: i,
          success: false,
          error: errorMessage
        });
        results.failed++;
        results.errors.push(`Row ${i + 1}: ${errorMessage}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Import completed. ${results.success} records imported successfully, ${results.failed} failed.`,
      results
    });

  } catch (error) {
    console.error('Bulk import error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: "Validation error",
        details: error.errors.map(err => `${err.path.join('.')}: ${err.message}`)
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      error: "Failed to process import",
      message: error instanceof Error ? error.message : "An unexpected error occurred"
    }, { status: 500 });
  }
} 