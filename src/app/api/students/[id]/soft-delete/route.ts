import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// PATCH - Soft delete student (deactivate)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const studentId = parseInt(params.id);
    
    if (isNaN(studentId)) {
      return NextResponse.json(
        { error: 'Invalid student ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { reason, deletedAt, action = 'deactivate' } = body;

    // Check if student exists
    const existingStudent = await prisma.student.findUnique({
      where: { studentId }
    });

    if (!existingStudent) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      );
    }

    // Check if student is already deactivated or archived
    if (existingStudent.status === 'INACTIVE' || existingStudent.status === 'ARCHIVED') {
      return NextResponse.json(
        { error: 'Student is already deactivated or archived' },
        { status: 400 }
      );
    }

    // Determine the new status based on action
    const newStatus = action === 'archive' ? 'ARCHIVED' : 'INACTIVE';
    
    // Soft delete the student by updating status and adding deletion info
    const updatedStudent = await prisma.student.update({
      where: { studentId },
      data: {
        status: newStatus,
        deletedAt: deletedAt ? new Date(deletedAt) : new Date(),
        deletionReason: reason || 'No reason provided',
        updatedAt: new Date()
      },
      include: {
        Department: {
          select: {
            departmentId: true,
            departmentName: true,
            departmentCode: true,
          }
        },
        CourseOffering: {
          select: {
            courseId: true,
            courseName: true,
            courseCode: true,
          }
        },
        Guardian: {
          select: {
            guardianId: true,
            firstName: true,
            lastName: true,
            email: true,
          }
        }
      }
    });

    const actionMessage = action === 'archive' ? 'archived' : 'deactivated';
    
    return NextResponse.json({
      success: true,
      data: updatedStudent,
      message: `Student has been successfully ${actionMessage}`
    });

  } catch (error) {
    console.error('Error soft deleting student:', error);
    return NextResponse.json(
      { error: 'Failed to deactivate student' },
      { status: 500 }
    );
  }
}
