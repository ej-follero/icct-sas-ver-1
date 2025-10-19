import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/sections/[id]/subjects
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
    
    // Fetch subjects for this section through SubjectSchedule
    const subjectSchedules = await prisma.subjectSchedule.findMany({
      where: { sectionId },
      include: {
        subject: {
          include: {
            CourseOffering: true,
            Department: true,
          },
        },
        instructor: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        room: {
          select: {
            roomNo: true,
            roomType: true,
          },
        },
      },
    });

    // Map to frontend format
    const subjects = subjectSchedules.map(schedule => ({
      code: schedule.subject.subjectCode,
      name: schedule.subject.subjectName,
      units: schedule.subject.creditedUnits,
      type: schedule.subject.subjectType,
      status: schedule.subject.status,
      instructor: schedule.instructor ? 
        `${schedule.instructor.firstName} ${schedule.instructor.lastName}` : 
        'Not Assigned',
      day: schedule.day,
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      room: schedule.room ? `${schedule.room.roomNo} (${schedule.room.roomType})` : 'Not Assigned',
    }));

    return NextResponse.json(subjects);
  } catch (error) {
    console.error("Error fetching subjects for section:", error);
    return NextResponse.json(
      { error: "Failed to fetch subjects for section" },
      { status: 500 }
    );
  }
} 