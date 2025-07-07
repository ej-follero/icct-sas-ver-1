import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET a single department by ID
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const department = await prisma.department.findUnique({
      where: { id: params.id },
      include: {
        courseOfferings: true,
        // Any other relations you want to include
      },
    });

    if (!department) {
      return NextResponse.json({ error: 'Department not found' }, { status: 404 });
    }

    return NextResponse.json(department);
  } catch (error) {
    console.error('[DEPARTMENT_GET]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH (update) a department by ID
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const { name, code, headOfDepartment, description, status /* any other fields */ } = body;

    const department = await prisma.department.update({
      where: { id: params.id },
      data: {
        name,
        code,
        headOfDepartment,
        description,
        status,
        // update other fields as necessary
      },
    });

    return NextResponse.json(department);
  } catch (error) {
    console.error('[DEPARTMENT_PATCH]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE a department by ID
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    // Optional: Check for related records before deleting
    const department = await prisma.department.findUnique({
      where: { id: params.id },
      include: { courseOfferings: true, instructors: true },
    });

    if (!department) {
      return NextResponse.json({ error: 'Department not found' }, { status: 404 });
    }

    if (department.courseOfferings.length > 0 || department.instructors.length > 0) {
      return NextResponse.json({ error: 'Cannot delete department with associated courses or instructors.' }, { status: 400 });
    }

    await prisma.department.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true, message: 'Department deleted successfully' });
  } catch (error) {
    console.error('[DEPARTMENT_DELETE]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 