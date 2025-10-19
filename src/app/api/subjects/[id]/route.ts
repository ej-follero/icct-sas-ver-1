import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { SubjectType, SemesterType } from "@prisma/client";

// Subject schema for validation
const subjectSchema = z.object({
  name: z.string().min(1, "Name is required"),
  code: z.string().min(1, "Code is required"),
  type: z.enum(["lecture", "laboratory", "both"]),
  units: z.number().min(0),
  lecture_units: z.number().min(0),
  laboratory_units: z.number().min(0),
  semester: z.string(),
  year_level: z.string(),
  department: z.string(),
  description: z.string().optional(),
  instructors: z.array(z.string()),
});

// GET handler for individual subject
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // JWT Authentication (SUPER_ADMIN, ADMIN, DEPARTMENT_HEAD, INSTRUCTOR)
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

    const { prisma } = await import('@/lib/prisma');
    const user = await prisma.user.findUnique({ where: { userId }, select: { status: true, role: true } });
    if (!user || user.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'User not found or inactive' }, { status: 401 });
    }
    const allowedRoles = ['SUPER_ADMIN', 'ADMIN', 'DEPARTMENT_HEAD', 'INSTRUCTOR'];
    if (!allowedRoles.includes(user.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const subjectId = parseInt(id);
    
    if (isNaN(subjectId)) {
      return NextResponse.json(
        { error: "Invalid subject ID" },
        { status: 400 }
      );
    }

    const subject = await prisma.subjects.findUnique({
      where: { subjectId },
      include: {
        Department: true,
        CourseOffering: true,
        Instructor: true,
      },
    });
    
    if (!subject) {
      return NextResponse.json(
        { error: "Subject not found" },
        { status: 404 }
      );
    }

    // Map the response to match frontend expectations
    const responseSubject = {
      subjectId: subject.subjectId,
      subjectName: subject.subjectName,
      subjectCode: subject.subjectCode,
      subjectType: subject.subjectType,
      status: subject.status,
      description: subject.description,
      lectureUnits: subject.lectureUnits,
      labUnits: subject.labUnits,
      creditedUnits: subject.creditedUnits,
      totalHours: subject.totalHours,
      prerequisites: subject.prerequisites,
      courseId: subject.courseId,
      departmentId: subject.departmentId,
      academicYear: subject.academicYear,
      semester: subject.semester,
      maxStudents: subject.maxStudents,
      createdAt: subject.createdAt,
      updatedAt: subject.updatedAt,
      department: subject.Department ? {
        departmentId: subject.Department.departmentId,
        departmentName: subject.Department.departmentName,
        departmentCode: subject.Department.departmentCode,
        departmentType: subject.Department.departmentType,
        status: subject.Department.departmentStatus,
      } : null,
      course: subject.CourseOffering ? {
        courseId: subject.CourseOffering.courseId,
        courseName: subject.CourseOffering.courseName,
        courseCode: subject.CourseOffering.courseCode,
        courseType: subject.CourseOffering.courseType,
        status: subject.CourseOffering.courseStatus,
      } : null,
      instructors: subject.Instructor ? subject.Instructor.map(instructor => ({
        instructorId: instructor.instructorId,
        firstName: instructor.firstName,
        lastName: instructor.lastName,
        email: instructor.email,
        status: instructor.status,
      })) : [],
    };

    return NextResponse.json(responseSubject);
  } catch (error) {
    console.error("Error fetching subject:", error);
    return NextResponse.json(
      { error: "Failed to fetch subject" },
      { status: 500 }
    );
  }
}

// PUT handler for updating a subject
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

    const { prisma } = await import('@/lib/prisma');
    const user = await prisma.user.findUnique({ where: { userId }, select: { status: true, role: true } });
    if (!user || user.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'User not found or inactive' }, { status: 401 });
    }
    const adminRoles = ['SUPER_ADMIN', 'ADMIN'];
    if (!adminRoles.includes(user.role)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
    const { id } = await params;
    const subjectId = parseInt(id);
    
    if (isNaN(subjectId)) {
      return NextResponse.json(
        { error: "Invalid subject ID" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validatedData = subjectSchema.parse(body);

    // Check if subject exists
    const existingSubject = await prisma.subjects.findUnique({
      where: { subjectId }
    });
    
    if (!existingSubject) {
      return NextResponse.json(
        { error: "Subject not found" },
        { status: 404 }
      );
    }

    // Update the subject
    const updatedSubject = await prisma.subjects.update({
      where: { subjectId },
      data: {
        subjectName: validatedData.name,
        subjectCode: validatedData.code,
        subjectType: ((t: string) => {
          const map: any = { lecture: 'LECTURE', laboratory: 'LABORATORY', both: 'HYBRID' };
          return map[t] || t.toUpperCase();
        })(validatedData.type) as SubjectType,
        description: validatedData.description || "",
        lectureUnits: validatedData.lecture_units,
        labUnits: validatedData.laboratory_units,
        creditedUnits: validatedData.units,
        totalHours: validatedData.lecture_units + validatedData.laboratory_units,
        departmentId: parseInt(validatedData.department),
        semester: validatedData.semester.toUpperCase() as SemesterType,
      },
      include: {
        Department: true,
        CourseOffering: true,
        Instructor: true,
      },
    });

    // Map the response to match frontend expectations
    const responseSubject = {
      subjectId: updatedSubject.subjectId,
      subjectName: updatedSubject.subjectName,
      subjectCode: updatedSubject.subjectCode,
      subjectType: updatedSubject.subjectType,
      status: updatedSubject.status,
      description: updatedSubject.description,
      lectureUnits: updatedSubject.lectureUnits,
      labUnits: updatedSubject.labUnits,
      creditedUnits: updatedSubject.creditedUnits,
      totalHours: updatedSubject.totalHours,
      prerequisites: updatedSubject.prerequisites,
      courseId: updatedSubject.courseId,
      departmentId: updatedSubject.departmentId,
      academicYear: updatedSubject.academicYear,
      semester: updatedSubject.semester,
      maxStudents: updatedSubject.maxStudents,
      createdAt: updatedSubject.createdAt,
      updatedAt: updatedSubject.updatedAt,
      department: updatedSubject.Department ? {
        departmentId: updatedSubject.Department.departmentId,
        departmentName: updatedSubject.Department.departmentName,
        departmentCode: updatedSubject.Department.departmentCode,
        departmentType: updatedSubject.Department.departmentType,
        status: updatedSubject.Department.departmentStatus,
      } : null,
      course: updatedSubject.CourseOffering ? {
        courseId: updatedSubject.CourseOffering.courseId,
        courseName: updatedSubject.CourseOffering.courseName,
        courseCode: updatedSubject.CourseOffering.courseCode,
        courseType: updatedSubject.CourseOffering.courseType,
        status: updatedSubject.CourseOffering.courseStatus,
      } : null,
      instructors: updatedSubject.Instructor ? updatedSubject.Instructor.map(instructor => ({
        instructorId: instructor.instructorId,
        firstName: instructor.firstName,
        lastName: instructor.lastName,
        email: instructor.email,
        status: instructor.status,
      })) : [],
    };

    return NextResponse.json(responseSubject);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid subject data", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error updating subject:", error);
    return NextResponse.json(
      { error: "Failed to update subject" },
      { status: 500 }
    );
  }
}

// DELETE handler for removing a subject
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

    const { prisma } = await import('@/lib/prisma');
    const user = await prisma.user.findUnique({ where: { userId }, select: { status: true, role: true } });
    if (!user || user.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'User not found or inactive' }, { status: 401 });
    }
    const adminRoles = ['SUPER_ADMIN', 'ADMIN'];
    if (!adminRoles.includes(user.role)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
    const { id } = await params;
    const subjectId = parseInt(id);
    
    // Check for associated data
    const subject = await prisma.subjects.findUnique({
      where: { subjectId },
      include: {
        _count: {
          select: {
            SubjectSchedule: true,
            Announcement: true,
            Instructor: true
          }
        }
      }
    });

    if (!subject) {
      return NextResponse.json(
        { error: "Subject not found" },
        { status: 404 }
      );
    }

    // Check if subject has any associated data
    if (subject._count.SubjectSchedule > 0 || 
        subject._count.Announcement > 0 || 
        subject._count.Instructor > 0) {
      return NextResponse.json(
        { 
          error: "Cannot delete subject with associated data",
          details: {
            hasSchedules: subject._count.SubjectSchedule > 0,
            hasAnnouncements: subject._count.Announcement > 0,
            hasInstructors: subject._count.Instructor > 0,
            hasEnrolledStudents: false // This field doesn't exist in the schema
          }
        },
        { status: 409 }
      );
    }

    // If no associated data, proceed with deletion
    await prisma.subjects.delete({
      where: { subjectId }
    });

    return NextResponse.json(
      { message: "Subject deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting subject:", error);
    return NextResponse.json(
      { error: "Failed to delete subject" },
      { status: 500 }
    );
  }
}

// HEAD handler to check if subject can be deleted
export async function HEAD(
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

    const { prisma } = await import('@/lib/prisma');
    const user = await prisma.user.findUnique({ where: { userId }, select: { status: true, role: true } });
    if (!user || user.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'User not found or inactive' }, { status: 401 });
    }
    const adminRoles = ['SUPER_ADMIN', 'ADMIN'];
    if (!adminRoles.includes(user.role)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
    const { id } = await params;
    const subjectId = parseInt(id);
    
    if (isNaN(subjectId)) {
      return NextResponse.json(
        { error: "Invalid subject ID" },
        { status: 400 }
      );
    }

    // Check for associated data
    const subject = await prisma.subjects.findUnique({
      where: { subjectId },
      include: {
        _count: {
          select: {
            SubjectSchedule: true,
            Announcement: true,
            Instructor: true
          }
        }
      }
    });

    if (!subject) {
      return NextResponse.json(
        { error: "Subject not found" },
        { status: 404 }
      );
    }

    const canDelete = subject._count.SubjectSchedule === 0 && 
                     subject._count.Announcement === 0 && 
                     subject._count.Instructor === 0;

    return NextResponse.json({
      canDelete,
      details: {
        hasSchedules: subject._count.SubjectSchedule > 0,
        hasAnnouncements: subject._count.Announcement > 0,
        hasInstructors: subject._count.Instructor > 0,
        hasEnrolledStudents: false
      }
    });
  } catch (error) {
    console.error("Error checking subject deletability:", error);
    return NextResponse.json(
      { error: "Failed to check subject status" },
      { status: 500 }
    );
  }
} 