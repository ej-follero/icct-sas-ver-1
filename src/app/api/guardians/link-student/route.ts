import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Link student to guardian schema
const linkStudentSchema = z.object({
  guardianId: z.number().int().positive('Guardian ID must be a positive integer'),
  studentId: z.number().int().positive('Student ID must be a positive integer'),
});

// POST /api/guardians/link-student - Link a student to a guardian
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validatedData = linkStudentSchema.parse(body);

    // Check if guardian exists
    const guardian = await prisma.guardian.findUnique({
      where: { guardianId: validatedData.guardianId }
    });

    if (!guardian) {
      return NextResponse.json(
        { success: false, error: 'Guardian not found' },
        { status: 404 }
      );
    }

    // Check if student exists
    const student = await prisma.student.findUnique({
      where: { studentId: validatedData.studentId }
    });

    if (!student) {
      return NextResponse.json(
        { success: false, error: 'Student not found' },
        { status: 404 }
      );
    }

    // Check if student already has a guardian
    if (student.guardianId) {
      return NextResponse.json(
        { success: false, error: 'Student already has a guardian assigned' },
        { status: 400 }
      );
    }

    // Link student to guardian
    const updatedStudent = await prisma.student.update({
      where: { studentId: validatedData.studentId },
      data: { guardianId: validatedData.guardianId }
    });

    // Update guardian's total students count
    await prisma.guardian.update({
      where: { guardianId: validatedData.guardianId },
      data: { 
        totalStudents: {
          increment: 1
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: updatedStudent,
      message: 'Student successfully linked to guardian'
    });
  } catch (error) {
    console.error('Error linking student to guardian:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Validation failed',
          details: error.errors 
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to link student to guardian' },
      { status: 500 }
    );
  }
}

// DELETE /api/guardians/link-student - Unlink a student from a guardian
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');

    if (!studentId) {
      return NextResponse.json(
        { success: false, error: 'Student ID is required' },
        { status: 400 }
      );
    }

    const studentIdNum = parseInt(studentId);
    if (isNaN(studentIdNum)) {
      return NextResponse.json(
        { success: false, error: 'Invalid student ID' },
        { status: 400 }
      );
    }

    // Check if student exists and has a guardian
    const student = await prisma.student.findUnique({
      where: { studentId: studentIdNum },
      include: { Guardian: true }
    });

    if (!student) {
      return NextResponse.json(
        { success: false, error: 'Student not found' },
        { status: 404 }
      );
    }

    if (!student.guardianId) {
      return NextResponse.json(
        { success: false, error: 'Student is not linked to any guardian' },
        { status: 400 }
      );
    }

    const guardianId = student.guardianId;

    // Unlink student from guardian
    const updatedStudent = await prisma.student.update({
      where: { studentId: studentIdNum },
      data: { guardianId: null }
    });

    // Update guardian's total students count
    await prisma.guardian.update({
      where: { guardianId },
      data: { 
        totalStudents: {
          decrement: 1
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: updatedStudent,
      message: 'Student successfully unlinked from guardian'
    });
  } catch (error) {
    console.error('Error unlinking student from guardian:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to unlink student from guardian' },
      { status: 500 }
    );
  }
}
