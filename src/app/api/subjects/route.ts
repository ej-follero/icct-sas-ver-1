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

// GET handler
export async function GET(request: NextRequest) {
  try {
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

    const user = await prisma.user.findUnique({ where: { userId }, select: { status: true, role: true } });
    if (!user || user.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'User not found or inactive' }, { status: 401 });
    }
    const allowedRoles = ['SUPER_ADMIN', 'ADMIN', 'DEPARTMENT_HEAD', 'INSTRUCTOR'];
    if (!allowedRoles.includes(user.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '10', 10);
    const courseId = searchParams.get('courseId');
    const sortField = searchParams.get('sortField');
    const sortOrder = searchParams.get('sortOrder') || 'asc';

    // Defensive filter handling
    const where: any = {};
    
    // Search functionality
    const search = searchParams.get('search');
    if (search && search.trim()) {
      where.OR = [
        { subjectName: { contains: search.trim(), mode: 'insensitive' } },
        { subjectCode: { contains: search.trim(), mode: 'insensitive' } },
        { description: { contains: search.trim(), mode: 'insensitive' } },
      ];
    }
    
    if (courseId && courseId !== 'all') {
      where.courseId = parseInt(courseId, 10);
    }
    if (searchParams.get('type') && searchParams.get('type') !== 'all') {
      const type = searchParams.get('type');
      if (type) {
        const map: any = { lecture: 'LECTURE', laboratory: 'LABORATORY', both: 'HYBRID' };
        const normalized = map[type] || type.toUpperCase();
        if (['LECTURE','LABORATORY','HYBRID','THESIS','RESEARCH','INTERNSHIP'].includes(normalized)) {
          where.subjectType = normalized;
        }
      }
    }
    if (searchParams.get('semester') && searchParams.get('semester') !== 'all') {
      const semester = searchParams.get('semester');
      if (semester) {
        const sem = semester.toUpperCase();
        if (['FIRST_SEMESTER','SECOND_SEMESTER','THIRD_SEMESTER'].includes(sem)) where.semester = sem;
      }
    }
    if (searchParams.get('status') && searchParams.get('status') !== 'all') {
      const status = searchParams.get('status');
      if (status) {
        const st = status.toUpperCase();
        if (['ACTIVE','INACTIVE','ARCHIVED','PENDING_REVIEW'].includes(st)) where.status = st;
      }
    }
    if (searchParams.get('department') && searchParams.get('department') !== 'all') {
      const department = searchParams.get('department');
      const departmentId = parseInt(department || '', 10);
      if (!isNaN(departmentId) && departmentId > 0) { // Defensive check
        where.departmentId = departmentId;
      }
      // else: ignore invalid departmentId
    }
    // Add more filters as needed, following the same pattern

    // Build orderBy object for sorting
    const orderBy: any = {};
    if (sortField) {
      // Map frontend field names to database field names
      const fieldMapping: { [key: string]: string } = {
        subjectName: 'subjectName',
        subjectCode: 'subjectCode',
        subjectType: 'subjectType',
        creditedUnits: 'creditedUnits',
        semester: 'semester',
        academicYear: 'academicYear',
        department: 'departmentId', // Sort by departmentId, will need to include department for display
      };
      
      const dbField = fieldMapping[sortField];
      if (dbField) {
        orderBy[dbField] = sortOrder.toLowerCase();
      }
    }

    const [subjectsRaw, total] = await Promise.all([
      prisma.subjects.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: Object.keys(orderBy).length > 0 ? orderBy : undefined,
        include: {
          Department: true,
          CourseOffering: true,
          Instructor: true,
        },
      }),
      prisma.subjects.count({ where }),
    ]);

    // Map DB fields to frontend fields - using schema-aligned field names
    const subjects = subjectsRaw.map(s => ({
      subjectId: s.subjectId,
      subjectName: s.subjectName,
      subjectCode: s.subjectCode,
      subjectType: s.subjectType,
      status: s.status,
      description: s.description,
      lectureUnits: s.lectureUnits,
      labUnits: s.labUnits,
      creditedUnits: s.creditedUnits,
      totalHours: s.totalHours,
      prerequisites: s.prerequisites,
      courseId: s.courseId,
      departmentId: s.departmentId,
      academicYear: s.academicYear,
      semester: s.semester,
      maxStudents: s.maxStudents,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
      // Include related data
      department: s.Department ? {
        departmentId: s.Department.departmentId,
        departmentName: s.Department.departmentName,
        departmentCode: s.Department.departmentCode,
        departmentType: s.Department.departmentType,
        status: s.Department.departmentStatus,
      } : null,
      course: s.CourseOffering ? {
        courseId: s.CourseOffering.courseId,
        courseName: s.CourseOffering.courseName,
        courseCode: s.CourseOffering.courseCode,
        courseType: s.CourseOffering.courseType,
        status: s.CourseOffering.courseStatus,
      } : null,
      instructors: s.Instructor ? s.Instructor.map(instructor => ({
        instructorId: instructor.instructorId,
        firstName: instructor.firstName,
        lastName: instructor.lastName,
        email: instructor.email,
        status: instructor.status,
      })) : [],
    }));

    return NextResponse.json({ subjects, total });
  } catch (error) {
    if (error && typeof error === 'object') {
      const errObj = error as { message?: string; stack?: string };
      console.error("Error fetching subjects:", errObj, errObj.stack);
      return NextResponse.json(
        { error: errObj.message || "Failed to fetch subjects" },
        { status: 500 }
      );
    } else {
      console.error("Error fetching subjects:", error);
      return NextResponse.json(
        { error: "Failed to fetch subjects" },
        { status: 500 }
      );
    }
  }
}

// POST handler
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

    const user = await prisma.user.findUnique({ where: { userId }, select: { status: true, role: true } });
    if (!user || user.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'User not found or inactive' }, { status: 401 });
    }
    const adminRoles = ['SUPER_ADMIN', 'ADMIN'];
    if (!adminRoles.includes(user.role)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
    const body = await request.json();
    const courseIdNum = Number((body as any)?.courseId);
    if (!Number.isFinite(courseIdNum)) {
      return NextResponse.json({ error: 'courseId is required and must be a number' }, { status: 400 });
    }
    const validatedData = subjectSchema.parse(body);

    // Map the validated data to database fields
    const newSubject = await prisma.subjects.create({
      data: {
        subjectName: validatedData.name,
        subjectCode: validatedData.code,
        subjectType: ((t: string) => {
          const map: any = { lecture: 'LECTURE', laboratory: 'LABORATORY', both: 'HYBRID' };
          return map[t] || t.toUpperCase();
        })(validatedData.type) as SubjectType,
        status: 'ACTIVE',
        description: validatedData.description || "",
        lectureUnits: validatedData.lecture_units,
        labUnits: validatedData.laboratory_units,
        creditedUnits: validatedData.units,
        totalHours: validatedData.lecture_units + validatedData.laboratory_units,
        prerequisites: "",
        courseId: courseIdNum,
        departmentId: parseInt(validatedData.department),
        academicYear: (body as any)?.academicYear || "2024-2025",
        semester: validatedData.semester.toUpperCase() as SemesterType,
        maxStudents: (body as any)?.maxStudents ? Number((body as any).maxStudents) : 30,
      },
    });

    // Map the response to match frontend expectations
    const responseSubject = {
      subjectId: newSubject.subjectId,
      subjectName: newSubject.subjectName,
      subjectCode: newSubject.subjectCode,
      subjectType: newSubject.subjectType,
      status: newSubject.status,
      description: newSubject.description,
      lectureUnits: newSubject.lectureUnits,
      labUnits: newSubject.labUnits,
      creditedUnits: newSubject.creditedUnits,
      totalHours: newSubject.totalHours,
      prerequisites: newSubject.prerequisites,
      courseId: newSubject.courseId,
      departmentId: newSubject.departmentId,
      academicYear: newSubject.academicYear,
      semester: newSubject.semester,
      maxStudents: newSubject.maxStudents,
      createdAt: newSubject.createdAt,
      updatedAt: newSubject.updatedAt,
      department: null, // Will be populated when fetched with include
      course: null, // Will be populated when fetched with include
      instructors: [], // Will be populated when fetched with include
    };

    return NextResponse.json(responseSubject, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid subject data", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error creating subject:", error);
    return NextResponse.json(
      { error: "Failed to create subject" },
      { status: 500 }
    );
  }
}