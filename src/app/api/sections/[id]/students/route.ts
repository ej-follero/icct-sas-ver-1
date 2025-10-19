import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/sections/[id]/students
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // JWT Authentication
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = Number((decoded as any)?.userId);
    if (!Number.isFinite(userId)) {
      return NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 });
    }

    // Check user exists and is active
    const user = await prisma.user.findUnique({
      where: { userId },
      select: { status: true, role: true }
    });

    if (!user || user.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'User not found or inactive' }, { status: 401 });
    }

    // Role-based access control
    const allowedRoles = ['SUPER_ADMIN', 'ADMIN', 'DEPARTMENT_HEAD', 'INSTRUCTOR'];
    if (!allowedRoles.includes(user.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { id } = await params;
    const sectionId = parseInt(id);
    const studentSections = await prisma.studentSection.findMany({
      where: { sectionId },
      include: { Student: true }
    });
    const students = studentSections.map(ss => ({
      id: ss.Student.studentId,
      firstName: ss.Student.firstName,
      lastName: ss.Student.lastName,
      studentIdNumber: ss.Student.studentIdNum,
      yearLevel: ss.Student.yearLevel,
      status: ss.enrollmentStatus,
      email: ss.Student.email,
    }));
    return NextResponse.json(students);
  } catch (error) {
    console.error("Error fetching students for section:", error);
    return NextResponse.json(
      { error: "Failed to fetch students for section" },
      { status: 500 }
    );
  }
} 