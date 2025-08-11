import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Validation schema for bulk course deletion
const bulkDeleteSchema = z.object({
  ids: z.array(z.string()).min(1, "At least one course ID is required"),
  forceDelete: z.boolean().default(false), // For hard delete vs soft delete
});

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Bulk course delete request:', JSON.stringify(body, null, 2));
    
    const { ids, forceDelete } = bulkDeleteSchema.parse(body);
    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
      archived: 0,
      deleted: 0,
    };

    // Process each course ID
    for (const id of ids) {
      try {
        // Check if course exists
        const course = await prisma.courseOffering.findUnique({
          where: { courseId: parseInt(id) },
          include: {
            _count: {
              select: {
                Student: true,
                Section: true,
              },
            },
          },
        });

        if (!course) {
          results.errors.push(`Course with ID ${id} not found`);
          results.failed++;
          continue;
        }

        // Check if course has dependencies (students or sections)
        const hasStudents = course._count.Student > 0;
        const hasSections = course._count.Section > 0;

        if ((hasStudents || hasSections) && !forceDelete) {
          // Archive instead of delete if there are dependencies
          await prisma.courseOffering.update({
            where: { courseId: parseInt(id) },
            data: {
              courseStatus: 'ARCHIVED',
              updatedAt: new Date(),
            },
          });
          results.archived++;
        } else if (forceDelete) {
          // Hard delete (use with caution)
          await prisma.courseOffering.delete({
            where: { courseId: parseInt(id) },
          });
          results.deleted++;
        } else {
          // Soft delete by setting status to ARCHIVED
          await prisma.courseOffering.update({
            where: { courseId: parseInt(id) },
            data: {
              courseStatus: 'ARCHIVED',
              updatedAt: new Date(),
            },
          });
          results.archived++;
        }

        results.success++;
      } catch (error) {
        console.error(`Error deleting/archiving course ${id}:`, error);
        results.errors.push(`Failed to process course ${id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        results.failed++;
      }
    }

    return NextResponse.json({
      message: `Bulk operation completed. Success: ${results.success}, Failed: ${results.failed}, Archived: ${results.archived}, Deleted: ${results.deleted}`,
      results
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error in bulk course deletion:', error);
    return NextResponse.json(
      { error: 'Failed to process bulk deletion' },
      { status: 500 }
    );
  }
}
