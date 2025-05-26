import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET single department
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const department = await prisma.department.findUnique({
      where: {
        departmentId: parseInt(params.id),
      },
      include: {
        _count: {
          select: {
            Instructor: true,
          },
        },
      },
    });

    if (!department) {
      return NextResponse.json(
        { error: 'Department not found' },
        { status: 404 }
      );
    }

    const formattedDepartment = {
      id: department.departmentId.toString(),
      name: department.departmentName,
      code: department.departmentCode,
      description: department.departmentDescription,
      totalInstructors: department._count.Instructor,
      status: department.departmentStatus || 'active', // Use the actual status from the database
    };

    return NextResponse.json(formattedDepartment);
  } catch (error) {
    console.error('Error fetching department:', error);
    return NextResponse.json(
      { error: 'Failed to fetch department' },
      { status: 500 }
    );
  }
}

// PUT (update) department
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { name, code, description, status } = body;

    // First check if the department exists
    const existingDepartment = await prisma.department.findUnique({
      where: {
        departmentId: parseInt(params.id),
      },
    });

    if (!existingDepartment) {
      return NextResponse.json(
        { error: 'Department not found' },
        { status: 404 }
      );
    }

    // Update the department
    const updatedDepartment = await prisma.department.update({
      where: {
        departmentId: parseInt(params.id),
      },
      data: {
        departmentName: name,
        departmentCode: code,
        departmentDescription: description,
        departmentStatus: status === 'active', // Convert string to boolean
      },
      include: {
        _count: {
          select: {
            Instructor: true,
          },
        },
      },
    });

    // Format the response
    const formattedDepartment = {
      id: updatedDepartment.departmentId.toString(),
      name: updatedDepartment.departmentName,
      code: updatedDepartment.departmentCode,
      description: updatedDepartment.departmentDescription,
      status: updatedDepartment.departmentStatus ? 'active' : 'inactive', // Convert boolean to string
      totalInstructors: updatedDepartment._count.Instructor,
    };

    return NextResponse.json(formattedDepartment);
  } catch (error) {
    console.error('Error updating department:', error);
    return NextResponse.json(
      { error: 'Failed to update department' },
      { status: 500 }
    );
  }
}

// DELETE department
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.department.delete({
      where: {
        departmentId: parseInt(params.id),
      },
    });

    return NextResponse.json({ message: 'Department deleted successfully' });
  } catch (error) {
    console.error('Error deleting department:', error);
    return NextResponse.json(
      { error: 'Failed to delete department' },
      { status: 500 }
    );
  }
} 