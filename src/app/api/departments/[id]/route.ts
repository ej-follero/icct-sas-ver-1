import { NextRequest, NextResponse } from 'next/server';
import { Status } from '@prisma/client';
import { prisma } from '@/lib/prisma';

async function assertAdmin(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  if (!token) return { ok: false, res: NextResponse.json({ error: 'Authentication required' }, { status: 401 }) };
  try {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId as number;
    const user = await prisma.user.findUnique({ where: { userId }, select: { role: true } });
    if (!user || (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN')) {
      return { ok: false, res: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
    }
    return { ok: true } as const;
  } catch {
    return { ok: false, res: NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 }) };
  }
}

// GET a single department by ID
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const department = await prisma.department.findUnique({
      where: { departmentId: parseInt(id) },
      include: {
        CourseOffering: true,
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
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const gate = await assertAdmin(request);
  if (!('ok' in gate) || gate.ok !== true) return gate.res;
  const { id } = await params;
  try {
    const body = await request.json();
    const { name, code, headOfDepartment, description, status, courseOfferings, logo } = body;

    // Normalize status to enum
    const normalized = typeof status === 'string' ? status.toUpperCase() : status;
    const statusEnum = normalized && normalized in Status ? (normalized as Status) : undefined;

    const department = await prisma.department.update({
      where: { departmentId: parseInt(id) },
      data: {
        departmentName: name,
        departmentCode: code,
        departmentDescription: description,
        departmentStatus: statusEnum ?? undefined,
        headOfDepartment: headOfDepartment ? parseInt(headOfDepartment) : null,
        departmentLogo: logo || null,
      },
    });

    // Handle course assignments if provided
    if (courseOfferings && Array.isArray(courseOfferings)) {
      const courseIds = courseOfferings.map((course: any) => parseInt(course.id));
      
      // Get all courses currently assigned to this department
      const currentCourses = await prisma.courseOffering.findMany({
        where: {
          departmentId: parseInt(id)
        },
        select: {
          courseId: true
        }
      });
      
      const currentCourseIds = currentCourses.map(c => c.courseId);
      
      // Remove courses that are no longer selected
      const coursesToRemove = currentCourseIds.filter(id => !courseIds.includes(id));
      if (coursesToRemove.length > 0) {
        // Since departmentId is required, we'll need to assign them to a default department
        // For now, we'll assign them to department 1 (you may want to create a "Unassigned" department)
        await prisma.courseOffering.updateMany({
          where: {
            courseId: { in: coursesToRemove }
          },
          data: {
            departmentId: 1 // Default department - you may want to handle this differently
          }
        });
      }
      
      // Assign the selected courses to this department
      if (courseIds.length > 0) {
        await prisma.courseOffering.updateMany({
          where: {
            courseId: { in: courseIds }
          },
          data: {
            departmentId: parseInt(id)
          }
        });
      }
    }

    return NextResponse.json({ success: true, data: department });
  } catch (error) {
    console.error('[DEPARTMENT_PATCH]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE a department by ID
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const gate = await assertAdmin(request);
  if (!('ok' in gate) || gate.ok !== true) return gate.res;
  const { id } = await params;
  try {
    // Optional: Check for related records before deleting
    const department = await prisma.department.findUnique({
      where: { departmentId: parseInt(id) },
      include: { 
        CourseOffering: true, 
        Instructor: true 
      },
    });

    if (!department) {
      return NextResponse.json({ error: 'Department not found' }, { status: 404 });
    }

    if (department.CourseOffering.length > 0 || department.Instructor.length > 0) {
      return NextResponse.json({ error: 'Cannot delete department with associated courses or instructors.' }, { status: 400 });
    }

    await prisma.department.delete({
      where: { departmentId: parseInt(id) },
    });

    return NextResponse.json({ success: true, message: 'Department deleted successfully' });
  } catch (error) {
    console.error('[DEPARTMENT_DELETE]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 