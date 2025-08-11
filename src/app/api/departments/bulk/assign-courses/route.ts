import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const assignCoursesSchema = z.object({
  departmentIds: z.array(z.string()).min(1, "At least one department ID is required"),
  courseIds: z.array(z.string()).min(1, "At least one course ID is required"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Assign courses request body:', JSON.stringify(body, null, 2));
    
    const { departmentIds, courseIds } = assignCoursesSchema.parse(body);

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

    // Verify courses exist
    const courses = await prisma.course.findMany({
      where: {
        courseId: {
          in: courseIds.map(id => parseInt(id))
        }
      }
    });

    if (courses.length !== courseIds.length) {
      return NextResponse.json({
        success: false,
        error: "One or more courses not found"
      }, { status: 404 });
    }

    // Update courses to assign them to departments
    const updatePromises = courseIds.map(courseId =>
      departmentIds.map(departmentId =>
        prisma.courseOffering.create({
          data: {
            courseId: parseInt(courseId),
            departmentId: parseInt(departmentId),
            academicYear: new Date().getFullYear().toString(),
            semester: 'FIRST', // Default semester
            status: 'ACTIVE'
          }
        })
      )
    ).flat();

    const results = await Promise.allSettled(updatePromises);

    const successful = results.filter(result => result.status === 'fulfilled').length;
    const failed = results.filter(result => result.status === 'rejected').length;

    return NextResponse.json({
      success: true,
      message: `Successfully assigned ${courseIds.length} courses to ${departmentIds.length} departments`,
      details: {
        successful,
        failed,
        totalAssignments: updatePromises.length
      }
    });

  } catch (error) {
    console.error('Assign courses error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: "Validation error",
        details: error.errors.map(err => `${err.path.join('.')}: ${err.message}`)
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      error: "Failed to assign courses",
      message: error instanceof Error ? error.message : "An unexpected error occurred"
    }, { status: 500 });
  }
}
