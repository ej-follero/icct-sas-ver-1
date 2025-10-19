import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/sections/[id]
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

    const { id: sectionId } = await params;
    const id = parseInt(sectionId);
    
    const section = await prisma.section.findUnique({
      where: { sectionId: id },
      include: {
        Course: true,
        StudentSection: {
          include: {
            Student: true,
          },
        },
        SubjectSchedule: {
          include: {
            subject: true,
            instructor: true,
          },
        },
      },
    });

    if (!section) {
      return NextResponse.json(
        { error: "Section not found" },
        { status: 404 }
      );
    }

    // Map to frontend format
    const mapped = {
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
      roomAssignment: section.roomAssignment || '',
      createdAt: section.createdAt.toISOString(),
      updatedAt: section.updatedAt.toISOString(),
    };

    return NextResponse.json(mapped);
  } catch (error) {
    console.error("Error fetching section:", error);
    return NextResponse.json(
      { error: "Failed to fetch section" },
      { status: 500 }
    );
  }
}

// PUT /api/sections/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id: sectionId } = await params;
    const id = parseInt(sectionId);
    const data = await request.json();
    
    const updatedSection = await prisma.section.update({
      where: { sectionId: id },
      data: {
        sectionName: data.sectionName,
        sectionCapacity: data.sectionCapacity,
        sectionStatus: data.sectionStatus,
        yearLevel: data.yearLevel,
        academicYear: data.academicYear,
        semester: data.semester,
        currentEnrollment: data.currentEnrollment,
        roomAssignment: data.roomAssignment,
        scheduleNotes: data.scheduleNotes,
        courseId: Number(data.courseId),
      },
      include: {
        Course: true,
        StudentSection: true,
        SubjectSchedule: true,
      },
    });

    // Map to frontend format
    const mapped = {
      sectionId: updatedSection.sectionId,
      sectionName: updatedSection.sectionName,
      sectionCapacity: updatedSection.sectionCapacity,
      sectionStatus: updatedSection.sectionStatus,
      yearLevel: updatedSection.yearLevel,
      courseId: updatedSection.courseId,
      courseName: updatedSection.Course?.courseName || '',
      totalStudents: updatedSection.StudentSection.length,
      totalSubjects: updatedSection.SubjectSchedule.length,
      scheduleNotes: updatedSection.scheduleNotes || '',
      academicYear: updatedSection.academicYear || '',
      semester: updatedSection.semester || '',
      currentEnrollment: updatedSection.currentEnrollment,
      roomAssignment: updatedSection.roomAssignment || '',
      createdAt: updatedSection.createdAt.toISOString(),
      updatedAt: updatedSection.updatedAt.toISOString(),
    };

    return NextResponse.json(mapped);
  } catch (error) {
    console.error("Error updating section:", error);
    return NextResponse.json(
      { error: "Failed to update section" },
      { status: 500 }
    );
  }
}

// DELETE /api/sections/[id] - Soft delete
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id: sectionId } = await params;
    const id = parseInt(sectionId);
    
    // Soft delete by updating status to DELETED
    const deletedSection = await prisma.section.update({
      where: { sectionId: id },
      data: {
        sectionStatus: 'INACTIVE',
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ 
      message: "Section deleted successfully",
      sectionId: deletedSection.sectionId 
    });
  } catch (error) {
    console.error("Error deleting section:", error);
    return NextResponse.json(
      { error: "Failed to delete section" },
      { status: 500 }
    );
  }
} 