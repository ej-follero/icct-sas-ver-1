import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Guardian update schema
const guardianUpdateSchema = z.object({
  email: z.string().email('Invalid email format').optional(),
  phoneNumber: z.string().min(10, 'Phone number must be at least 10 characters').optional(),
  firstName: z.string().min(1, 'First name is required').optional(),
  middleName: z.string().optional(),
  lastName: z.string().min(1, 'Last name is required').optional(),
  suffix: z.string().optional(),
  address: z.string().min(1, 'Address is required').optional(),
  img: z.string().optional(),
  gender: z.enum(['MALE', 'FEMALE']).optional(),
  guardianType: z.enum(['PARENT', 'GUARDIAN']).optional(),
  occupation: z.string().optional(),
  workplace: z.string().optional(),
  emergencyContact: z.string().optional(),
  relationshipToStudent: z.string().min(1, 'Relationship to student is required').optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
});

// GET /api/guardians/[id] - Fetch single guardian
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const guardianId = parseInt(id);

    if (isNaN(guardianId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid guardian ID' },
        { status: 400 }
      );
    }

    const guardian = await prisma.guardian.findUnique({
      where: { guardianId },
      include: {
        Student: {
          select: {
            studentId: true,
            studentIdNum: true,
            firstName: true,
            lastName: true,
            email: true,
            status: true,
            CourseOffering: {
              select: {
                courseName: true,
                courseCode: true,
              }
            },
            Department: {
              select: {
                departmentName: true,
                departmentCode: true,
              }
            }
          }
        }
      }
    });

    if (!guardian) {
      return NextResponse.json(
        { success: false, error: 'Guardian not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: guardian
    });
  } catch (error) {
    console.error('Error fetching guardian:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch guardian' },
      { status: 500 }
    );
  }
}

// PUT /api/guardians/[id] - Update guardian
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const guardianId = parseInt(id);

    if (isNaN(guardianId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid guardian ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validatedData = guardianUpdateSchema.parse(body);

    // Check if guardian exists
    const existingGuardian = await prisma.guardian.findUnique({
      where: { guardianId }
    });

    if (!existingGuardian) {
      return NextResponse.json(
        { success: false, error: 'Guardian not found' },
        { status: 404 }
      );
    }

    // Check for email/phone conflicts if they're being updated
    if (validatedData.email || validatedData.phoneNumber) {
      const conflictGuardian = await prisma.guardian.findFirst({
        where: {
          AND: [
            { guardianId: { not: guardianId } },
            {
              OR: [
                ...(validatedData.email ? [{ email: validatedData.email }] : []),
                ...(validatedData.phoneNumber ? [{ phoneNumber: validatedData.phoneNumber }] : [])
              ]
            }
          ]
        }
      });

      if (conflictGuardian) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Guardian with this email or phone number already exists' 
          },
          { status: 400 }
        );
      }
    }

    // Update guardian
    const updatedGuardian = await prisma.guardian.update({
      where: { guardianId },
      data: validatedData,
      include: {
        Student: {
          select: {
            studentId: true,
            studentIdNum: true,
            firstName: true,
            lastName: true,
            email: true,
            status: true,
            CourseOffering: {
              select: {
                courseName: true,
                courseCode: true,
              }
            },
            Department: {
              select: {
                departmentName: true,
                departmentCode: true,
              }
            }
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: updatedGuardian,
      message: 'Guardian updated successfully'
    });
  } catch (error) {
    console.error('Error updating guardian:', error);
    
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
      { success: false, error: 'Failed to update guardian' },
      { status: 500 }
    );
  }
}

// DELETE /api/guardians/[id] - Delete guardian
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const guardianId = parseInt(id);

    if (isNaN(guardianId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid guardian ID' },
        { status: 400 }
      );
    }

    // Check if guardian exists
    const existingGuardian = await prisma.guardian.findUnique({
      where: { guardianId },
      include: {
        Student: true
      }
    });

    if (!existingGuardian) {
      return NextResponse.json(
        { success: false, error: 'Guardian not found' },
        { status: 404 }
      );
    }

    // Check if guardian has associated students
    if (existingGuardian.Student.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Cannot delete guardian with associated students. Please reassign students first.' 
        },
        { status: 400 }
      );
    }

    // Delete guardian
    await prisma.guardian.delete({
      where: { guardianId }
    });

    return NextResponse.json({
      success: true,
      message: 'Guardian deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting guardian:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete guardian' },
      { status: 500 }
    );
  }
}