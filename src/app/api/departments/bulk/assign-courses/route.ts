import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const assignCoursesSchema = z.object({
  departmentIds: z.array(z.string()).min(1, "At least one department ID is required"),
  courseIds: z.array(z.string()).min(1, "At least one course ID is required"),
});

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

export async function POST(request: NextRequest) {
  try {
    const gate = await assertAdmin(request);
    if (!('ok' in gate) || gate.ok !== true) return gate.res;
    const body = await request.json();
    console.log('Assign courses request body:', JSON.stringify(body, null, 2));
    
    const { departmentIds, courseIds } = assignCoursesSchema.parse(body);
    // For schema alignment: a CourseOffering belongs to exactly one Department.
    // Enforce assigning to a single department per request to avoid ambiguity.
    if (departmentIds.length !== 1) {
      return NextResponse.json({
        success: false,
        error: "Provide exactly one departmentId for assignment"
      }, { status: 400 });
    }
    const targetDepartmentId = parseInt(departmentIds[0]);

    // Verify department exists
    const targetDepartment = await prisma.department.findUnique({ where: { departmentId: targetDepartmentId } });
    if (!targetDepartment) {
      return NextResponse.json({ success: false, error: "Department not found" }, { status: 404 });
    }

    // Verify CourseOffering records exist for given IDs
    const courseOfferingIds = courseIds.map(id => parseInt(id));
    const existingCourses = await prisma.courseOffering.findMany({
      where: { courseId: { in: courseOfferingIds } },
      select: { courseId: true }
    });
    if (existingCourses.length !== courseOfferingIds.length) {
      const existingSet = new Set(existingCourses.map(c => c.courseId));
      const missing = courseOfferingIds.filter(id => !existingSet.has(id));
      return NextResponse.json({ success: false, error: `CourseOffering ids not found: ${missing.join(', ')}` }, { status: 404 });
    }

    // Assign courses to the target department by updating departmentId
    const updateResult = await prisma.courseOffering.updateMany({
      where: { courseId: { in: courseOfferingIds } },
      data: { departmentId: targetDepartmentId }
    });

    return NextResponse.json({
      success: true,
      message: `Assigned ${updateResult.count} courses to department ${targetDepartment.departmentName}`,
      details: { updated: updateResult.count }
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
