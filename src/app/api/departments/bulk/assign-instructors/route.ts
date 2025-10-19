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

    // Update instructor department assignments
    // Since instructors can only belong to one department, we'll assign each instructor to the first department
    const results = await Promise.allSettled(
      instructorIds.map(instructorId =>
        prisma.instructor.update({
          where: {
            instructorId: parseInt(instructorId)
          },
          data: {
            departmentId: parseInt(departmentIds[0]) // Assign to first department only
          }
        })
      )
    );

    const successful = results.filter(result => result.status === 'fulfilled').length;
    const failed = results.filter(result => result.status === 'rejected').length;

    return NextResponse.json({
      success: true,
      message: `Successfully assigned ${instructorIds.length} instructors to department ${departmentIds[0]}${departmentIds.length > 1 ? ` (Note: Only first department used as instructors can only belong to one department)` : ''}`,
      details: {
        successful,
        failed,
        totalAssignments: instructorIds.length,
        assignedDepartment: departmentIds[0],
        ignoredDepartments: departmentIds.slice(1)
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
