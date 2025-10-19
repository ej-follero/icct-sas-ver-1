import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/sections/[id]/relationships
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
    
    if (isNaN(sectionId)) {
      return NextResponse.json(
        { error: "Invalid section ID" },
        { status: 400 }
      );
    }

    // Check for related records
    const [
      studentCount,
      subjectCount,
      scheduleCount,
      attendanceCount
    ] = await Promise.all([
      // Check for enrolled students
      prisma.studentSection.count({
        where: { sectionId }
      }),
      // Check for assigned subjects
      prisma.subjectSchedule.count({
        where: { sectionId }
      }),
      // Check for schedules
      prisma.subjectSchedule.count({
        where: { sectionId }
      }),
      // Check for attendance records
      prisma.attendance.count({
        where: { 
          subjectSchedule: {
            sectionId: sectionId
          }
        }
      })
    ]);

    const relationships: string[] = [];
    let hasRelationships = false;

    if (studentCount > 0) {
      relationships.push(`${studentCount} enrolled student(s)`);
      hasRelationships = true;
    }

    if (subjectCount > 0) {
      relationships.push(`${subjectCount} assigned subject(s)`);
      hasRelationships = true;
    }

    if (scheduleCount > 0) {
      relationships.push(`${scheduleCount} schedule(s)`);
      hasRelationships = true;
    }

    if (attendanceCount > 0) {
      relationships.push(`${attendanceCount} attendance record(s)`);
      hasRelationships = true;
    }

    return NextResponse.json({
      hasRelationships,
      relationships,
      counts: {
        students: studentCount,
        subjects: subjectCount,
        schedules: scheduleCount,
        attendance: attendanceCount
      }
    });
  } catch (error) {
    console.error("Error checking section relationships:", error);
    return NextResponse.json(
      { error: "Failed to check section relationships" },
      { status: 500 }
    );
  }
}
