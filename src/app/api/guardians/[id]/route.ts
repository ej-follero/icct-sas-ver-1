import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { Status } from '@prisma/client';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const guardianId = parseInt(params.id);
    const body = await request.json();

    // Update guardian
    const updatedGuardian = await prisma.guardian.update({
      where: { guardianId },
      data: {
        ...(body.firstName && { firstName: body.firstName }),
        ...(body.middleName !== undefined && { middleName: body.middleName }),
        ...(body.lastName && { lastName: body.lastName }),
        ...(body.suffix !== undefined && { suffix: body.suffix }),
        ...(body.email && { email: body.email }),
        ...(body.phoneNumber && { phoneNumber: body.phoneNumber }),
        ...(body.address && { address: body.address }),
        ...(body.img !== undefined && { img: body.img }),
        ...(body.gender && { gender: body.gender }),
        ...(body.guardianType && { guardianType: body.guardianType }),
        ...(body.status && { status: body.status.toUpperCase() as Status }),
        ...(body.occupation !== undefined && { occupation: body.occupation }),
        ...(body.workplace !== undefined && { workplace: body.workplace }),
        ...(body.emergencyContact !== undefined && { emergencyContact: body.emergencyContact }),
        ...(body.relationshipToStudent && { relationshipToStudent: body.relationshipToStudent }),
        ...(body.totalStudents !== undefined && { totalStudents: body.totalStudents }),
      },
      include: {
        Student: {
          select: {
            studentId: true,
            firstName: true,
            lastName: true,
            studentIdNum: true,
            yearLevel: true,
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

    // Transform the response to match the expected format
    const transformedGuardian = {
      id: updatedGuardian.guardianId.toString(),
      name: `${updatedGuardian.firstName} ${updatedGuardian.middleName || ''} ${updatedGuardian.lastName} ${updatedGuardian.suffix || ''}`.trim(),
      firstName: updatedGuardian.firstName,
      middleName: updatedGuardian.middleName,
      lastName: updatedGuardian.lastName,
      suffix: updatedGuardian.suffix,
      email: updatedGuardian.email,
      phoneNumber: updatedGuardian.phoneNumber,
      address: updatedGuardian.address,
      img: updatedGuardian.img,
      gender: updatedGuardian.gender,
      guardianType: updatedGuardian.guardianType,
      status: updatedGuardian.status.toLowerCase() as 'active' | 'inactive',
      occupation: updatedGuardian.occupation,
      workplace: updatedGuardian.workplace,
      emergencyContact: updatedGuardian.emergencyContact,
      relationshipToStudent: updatedGuardian.relationshipToStudent,
      totalStudents: updatedGuardian.totalStudents,
      lastLogin: updatedGuardian.lastLogin,
      createdAt: updatedGuardian.createdAt,
      updatedAt: updatedGuardian.updatedAt,
      students: updatedGuardian.Student.map(student => ({
        id: student.studentId.toString(),
        name: `${student.firstName} ${student.lastName}`,
        studentIdNum: student.studentIdNum,
        yearLevel: student.yearLevel,
        status: student.status,
        course: student.CourseOffering ? {
          name: student.CourseOffering.courseName,
          code: student.CourseOffering.courseCode,
        } : null,
        department: student.Department ? {
          name: student.Department.departmentName,
          code: student.Department.departmentCode,
        } : null,
      }))
    };

    return NextResponse.json({ 
      data: transformedGuardian,
      message: 'Guardian updated successfully' 
    });
  } catch (error) {
    console.error('Error updating guardian:', error);
    return NextResponse.json(
      { error: 'Failed to update guardian' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const guardianId = parseInt(params.id);

    // Check if guardian has students
    const guardian = await prisma.guardian.findUnique({
      where: { guardianId },
      include: {
        Student: true
      }
    });

    if (!guardian) {
      return NextResponse.json(
        { error: 'Guardian not found' },
        { status: 404 }
      );
    }

    if (guardian.Student.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete guardian with associated students' },
        { status: 400 }
      );
    }

    // Delete guardian (no associated user account)
    await prisma.guardian.delete({
      where: { guardianId }
    });

    return NextResponse.json({ 
      message: 'Guardian deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting guardian:', error);
    return NextResponse.json(
      { error: 'Failed to delete guardian' },
      { status: 500 }
    );
  }
}
