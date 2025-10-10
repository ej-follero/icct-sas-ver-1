import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
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
    // Query params and filters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = parseInt(searchParams.get("pageSize") || "10", 10);
    const search = searchParams.get("search") || "";

    // Build where clause with filters
    const where: any = {
      // Exclude cancelled schedules (soft deleted)
      status: {
        not: 'CANCELLED'
      }
    };
    if (search) {
      where.OR = [
        { subject: { subjectName: { contains: search, mode: "insensitive" } } },
        { section: { sectionName: { contains: search, mode: "insensitive" } } },
        { instructor: { firstName: { contains: search, mode: "insensitive" } } },
        { instructor: { lastName: { contains: search, mode: "insensitive" } } },
      ];
    }

    // Add filter parameters
    const status = searchParams.get("status");
    const semester = searchParams.get("semester");
    const day = searchParams.get("day");
    const instructor = searchParams.get("instructor");
    const room = searchParams.get("room");
    const scheduleType = searchParams.get("scheduleType");
    const academicYear = searchParams.get("academicYear");
    const subject = searchParams.get("subject");
    const section = searchParams.get("section");

    if (status && status !== 'all') {
      where.status = status;
    }
    if (semester && semester !== 'all') {
      where.semester = { semesterName: { contains: semester, mode: "insensitive" } };
    }
    if (day && day !== 'all') {
      where.day = day;
    }
    if (instructor && instructor !== 'all') {
      where.instructor = {
        OR: [
          { firstName: { contains: instructor, mode: "insensitive" } },
          { lastName: { contains: instructor, mode: "insensitive" } }
        ]
      };
    }
    if (room && room !== 'all') {
      where.room = { roomNo: { contains: room, mode: "insensitive" } };
    }
    if (scheduleType && scheduleType !== 'all') {
      where.scheduleType = scheduleType;
    }
    if (academicYear && academicYear !== 'all') {
      where.academicYear = academicYear;
    }
    if (subject && subject !== 'all') {
      where.subject = { subjectName: { contains: subject, mode: "insensitive" } };
    }
    if (section && section !== 'all') {
      where.section = { sectionName: { contains: section, mode: "insensitive" } };
    }

    const total = await prisma.subjectSchedule.count({ where });
    const schedules = await prisma.subjectSchedule.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { startTime: "asc" },
      include: {
        subject: true,
        section: true,
        instructor: true,
        room: true,
        semester: true,
      },
    });
    return NextResponse.json({ data: schedules, total });
  } catch (error) {
    console.error('Error fetching schedules:', error);
    return NextResponse.json({ error: "Failed to fetch schedules" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
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

    // Admin-only access control
    const adminRoles = ['SUPER_ADMIN', 'ADMIN'];
    if (!adminRoles.includes(user.role)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const {
      subjectId,
      sectionId,
      instructorId,
      roomId,
      day,
      startTime,
      endTime,
      scheduleType = 'REGULAR',
      status = 'ACTIVE',
      maxStudents = 30,
      notes,
      semesterId,
      academicYear
    } = body;

    // Validate required fields
    if (!subjectId || !sectionId || !instructorId || !roomId || !day || !startTime || !endTime) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Create the schedule
    const newSchedule = await prisma.subjectSchedule.create({
      data: {
        subjectId: parseInt(subjectId),
        sectionId: parseInt(sectionId),
        instructorId: parseInt(instructorId),
        roomId: parseInt(roomId),
        day: day,
        startTime: startTime,
        endTime: endTime,
        scheduleType: scheduleType,
        status: status,
        maxStudents: parseInt(maxStudents),
        notes: notes || null,
        semesterId: semesterId ? parseInt(semesterId) : 1, // Default to first semester if not provided
        academicYear: academicYear || new Date().getFullYear().toString(),
      },
      include: {
        subject: true,
        section: true,
        instructor: true,
        room: true,
        semester: true,
      },
    });

    return NextResponse.json(newSchedule, { status: 201 });
  } catch (error) {
    console.error('Error creating schedule:', error);
    return NextResponse.json({ error: 'Failed to create schedule' }, { status: 500 });
  }
} 