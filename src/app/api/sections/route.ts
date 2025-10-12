import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/sections
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
    // Fetch all sections with related CourseOffering and counts
    const sections = await prisma.section.findMany({
      include: {
        Course: true, // CourseOffering relation
        StudentSection: true, // For counting students
        SubjectSchedule: true, // For counting subjects
      },
    });

    // Map to backend keys for frontend compatibility
    const mapped = sections.map((section) => ({
      sectionId: section.sectionId,
      sectionName: section.sectionName,
      sectionCapacity: section.sectionCapacity,
      sectionStatus: section.sectionStatus,
      yearLevel: section.yearLevel,
      courseId: section.courseId,
      courseName: section.Course?.courseName || '',
      totalStudents: section.StudentSection.length,
      totalSubjects: section.SubjectSchedule.length,
      scheduleNotes: section.scheduleNotes || '',
      academicYear: section.academicYear || '',
      semester: section.semester || '',
      currentEnrollment: section.currentEnrollment,
      createdAt: section.createdAt.toISOString(),
      updatedAt: section.updatedAt.toISOString(),
    }));

    return NextResponse.json(mapped);
  } catch (error) {
    console.error("Error fetching sections:", error);
    return NextResponse.json(
      { error: "Failed to fetch sections" },
      { status: 500 }
    );
  }
}

// POST /api/sections
export async function POST(request: NextRequest) {
  try {
    // JWT Authentication - Admin only
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

    const data = await request.json();
    console.log("Creating section with data:", data);
    
    // Validate required fields
    if (!data.sectionName || !data.courseId) {
      return NextResponse.json({ 
        error: 'Missing required fields: sectionName and courseId are required' 
      }, { status: 400 });
    }
    
    // Validate semesterId if provided, otherwise use default
    let semesterId = data.semesterId;
    if (!semesterId) {
      // Find the current active semester as default
      const currentSemester = await prisma.semester.findFirst({
        where: { status: 'CURRENT' },
        select: { semesterId: true }
      });
      
      if (!currentSemester) {
        // If no current semester, find the most recent semester or create a default
        const latestSemester = await prisma.semester.findFirst({
          orderBy: { createdAt: 'desc' },
          select: { semesterId: true }
        });
        
        if (!latestSemester) {
          return NextResponse.json({ 
            error: 'No semester found. Please create a semester first.' 
          }, { status: 400 });
        }
        
        semesterId = latestSemester.semesterId;
      } else {
        semesterId = currentSemester.semesterId;
      }
    } else {
      // Validate that the provided semesterId exists
      const semesterExists = await prisma.semester.findUnique({
        where: { semesterId: Number(semesterId) },
        select: { semesterId: true }
      });
      if (!semesterExists) {
        return NextResponse.json({ error: 'Invalid semester ID' }, { status: 400 });
      }
    }
    
    // Create the section in the database
    console.log("Creating section with semesterId:", semesterId);
    const created = await prisma.section.create({
      data: {
        sectionName: data.sectionName,
        sectionCapacity: data.sectionCapacity,
        sectionStatus: data.sectionStatus,
        yearLevel: data.yearLevel,
        academicYear: data.academicYear,
        semester: data.semester,
        currentEnrollment: data.currentEnrollment ?? 0,
        scheduleNotes: data.scheduleNotes ?? null,
        courseId: Number(data.courseId),
        semesterId: Number(semesterId),
      },
      include: {
        Course: true,
        StudentSection: true,
        SubjectSchedule: true,
      },
    });
    console.log("Section created successfully:", created.sectionId);
    
    // Map to backend keys for frontend compatibility
    const mapped = {
      sectionId: created.sectionId,
      sectionName: created.sectionName,
      sectionCapacity: created.sectionCapacity,
      sectionStatus: created.sectionStatus,
      yearLevel: created.yearLevel,
      courseId: created.courseId,
      courseName: created.Course?.courseName || '',
      totalStudents: created.StudentSection.length,
      totalSubjects: created.SubjectSchedule.length,
      scheduleNotes: created.scheduleNotes || '',
      academicYear: created.academicYear || '',
      semester: created.semester || '',
      currentEnrollment: created.currentEnrollment,
      createdAt: created.createdAt.toISOString(),
      updatedAt: created.updatedAt.toISOString(),
    };
    return NextResponse.json(mapped, { status: 201 });
  } catch (error) {
    console.error("Error creating section:", error);
    return NextResponse.json(
      { error: "Failed to create section", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
} 