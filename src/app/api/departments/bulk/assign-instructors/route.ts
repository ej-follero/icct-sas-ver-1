import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const assignInstructorsSchema = z.object({
  departmentIds: z.array(z.string()).min(1, "At least one department ID is required"),
  instructorIds: z.array(z.string()).min(1, "At least one instructor ID is required"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Assign instructors request body:', JSON.stringify(body, null, 2));
    
    const { departmentIds, instructorIds } = assignInstructorsSchema.parse(body);

    // Verify departments exist
    const departments = await prisma.department.findMany({
      where: {
        departmentId: {
          in: departmentIds.map(id => parseInt(id))
        }
      }
    });

    if (departments.length !== departmentIds.length) {
      return NextResponse.json({
        success: false,
        error: "One or more departments not found"
      }, { status: 404 });
    }

    // Verify instructors exist
    const instructors = await prisma.instructor.findMany({
      where: {
        instructorId: {
          in: instructorIds.map(id => parseInt(id))
        }
      }
    });

    if (instructors.length !== instructorIds.length) {
      return NextResponse.json({
        success: false,
        error: "One or more instructors not found"
      }, { status: 404 });
    }

    // Create instructor-department assignments
    const assignments = [];
    for (const departmentId of departmentIds) {
      for (const instructorId of instructorIds) {
        assignments.push({
          departmentId: parseInt(departmentId),
          instructorId: parseInt(instructorId),
        });
      }
    }

    // Use upsert to avoid duplicate assignments
    const results = await Promise.allSettled(
      assignments.map(assignment =>
        prisma.instructorDepartment.upsert({
          where: {
            instructorId_departmentId: {
              instructorId: assignment.instructorId,
              departmentId: assignment.departmentId
            }
          },
          update: {},
          create: assignment
        })
      )
    );

    const successful = results.filter(result => result.status === 'fulfilled').length;
    const failed = results.filter(result => result.status === 'rejected').length;

    return NextResponse.json({
      success: true,
      message: `Successfully assigned ${instructorIds.length} instructors to ${departmentIds.length} departments`,
      details: {
        successful,
        failed,
        totalAssignments: assignments.length
      }
    });

  } catch (error) {
    console.error('Assign instructors error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: "Validation error",
        details: error.errors.map(err => `${err.path.join('.')}: ${err.message}`)
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      error: "Failed to assign instructors",
      message: error instanceof Error ? error.message : "An unexpected error occurred"
    }, { status: 500 });
  }
}
