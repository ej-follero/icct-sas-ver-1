import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createNotification } from '@/lib/notifications';

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
    console.log('Schedule POST request received');
    
    // JWT Authentication
    const token = request.cookies.get('token')?.value;
    console.log('Token present:', !!token);
    if (!token) {
      console.log('No token found, returning 401');
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
    console.log('Schedule creation request body:', body);
    
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

    // Validate required fields (instructorId is now optional)
    if (!subjectId || !sectionId || !roomId || !day || !startTime || !endTime) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate that referenced entities exist
    const [subject, section, room, semester] = await Promise.all([
      prisma.subjects.findUnique({ where: { subjectId: parseInt(subjectId) } }),
      prisma.section.findUnique({ where: { sectionId: parseInt(sectionId) } }),
      prisma.room.findUnique({ where: { roomId: parseInt(roomId) } }),
      semesterId ? prisma.semester.findUnique({ where: { semesterId: parseInt(semesterId) } }) : null
    ]);

    if (!subject) {
      return NextResponse.json({ error: 'Subject not found' }, { status: 400 });
    }
    if (!section) {
      return NextResponse.json({ error: 'Section not found' }, { status: 400 });
    }
    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 400 });
    }
    if (instructorId) {
      const instructor = await prisma.instructor.findUnique({ where: { instructorId: parseInt(instructorId) } });
      if (!instructor) {
        return NextResponse.json({ error: 'Instructor not found' }, { status: 400 });
      }
    }

    // Create the schedule with proper schema alignment
    const newSchedule = await prisma.subjectSchedule.create({
      data: {
        subjectId: parseInt(subjectId),
        sectionId: parseInt(sectionId),
        instructorId: instructorId ? parseInt(instructorId) : null,
        roomId: parseInt(roomId),
        day: day as any, // Cast to DayOfWeek enum
        startTime: startTime,
        endTime: endTime,
        scheduleType: scheduleType as any, // Cast to ScheduleType enum
        status: status as any, // Cast to ScheduleStatus enum
        maxStudents: parseInt(maxStudents) || 30,
        notes: notes || null,
        semesterId: semesterId ? parseInt(semesterId) : 1, // Default to first semester if not provided
        academicYear: academicYear || new Date().getFullYear().toString(),
        isRecurring: true, // Default to recurring
        slots: 0, // Default slots
      },
      include: {
        subject: {
          select: {
            subjectId: true,
            subjectName: true,
            subjectCode: true,
            subjectType: true,
            status: true
          }
        },
        section: {
          select: {
            sectionId: true,
            sectionName: true,
            sectionCapacity: true,
            sectionStatus: true,
            currentEnrollment: true
          }
        },
        instructor: {
          select: {
            instructorId: true,
            firstName: true,
            lastName: true,
            email: true,
            status: true
          }
        },
        room: {
          select: {
            roomId: true,
            roomNo: true,
            roomCapacity: true,
            roomType: true,
            status: true
          }
        },
        semester: {
          select: {
            semesterId: true,
            semesterType: true,
            year: true,
            status: true
          }
        }
      },
    });

    // Notify on room capacity risk (if capacity exceeded by currentEnrollment)
    try {
      const section = newSchedule.section;
      if (section && typeof section.sectionCapacity === 'number' && section.sectionCapacity > 0) {
        const enrollment = section.currentEnrollment ?? 0;
        if (enrollment > section.sectionCapacity) {
          await createNotification(userId, {
            title: 'Room capacity exceeded',
            message: `Section ${section.sectionName} capacity ${section.sectionCapacity} exceeded by ${enrollment - section.sectionCapacity}.`,
            priority: 'HIGH',
            type: 'SCHEDULING',
          });
        }
      }
    } catch {}

    return NextResponse.json(newSchedule, { status: 201 });
  } catch (error) {
    console.error('Error creating schedule:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    });
    return NextResponse.json({ 
      error: 'Failed to create schedule',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 