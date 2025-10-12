import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CourseStatus, CourseType } from "@prisma/client";

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

// GET /api/courses - Get all courses
export async function GET() {
  try {
    console.log("Fetching courses from database...");
    

    
    // Check if the CourseOffering table exists by trying to count records
    try {
      const courseCount = await prisma.courseOffering.count();
      console.log(`Found ${courseCount} courses in database`);
    } catch (tableError) {
      console.error("Error accessing CourseOffering table:", tableError);
      return NextResponse.json(
        { 
          error: "Database schema issue - CourseOffering table not found or inaccessible",
          details: process.env.NODE_ENV === 'development' ? tableError : undefined
        },
        { status: 500 }
      );
    }
    
    const courses = await prisma.courseOffering.findMany({
      orderBy: {
        courseName: 'asc',
      },
      include: {
        Department: true,
        Subjects: {
          include: {
            Instructor: true,
          },
        },
        _count: {
          select: {
            Student: true,
            Section: true,
          },
        },
      },
    });

    console.log(`Retrieved ${courses.length} courses from database`);

    // Transform the data to match the frontend interface
    const transformedCourses = courses.map(course => {
      // Calculate unique instructors for this course
      const uniqueInstructors = new Set();
      course.Subjects.forEach(subject => {
        subject.Instructor.forEach(instructor => {
          uniqueInstructors.add(instructor.instructorId);
        });
      });

      return {
        id: course.courseId.toString(),
        name: course.courseName,
        code: course.courseCode,
        department: course.Department?.departmentId?.toString() || '',
        departmentName: course.Department?.departmentName || '',
        departmentCode: course.Department?.departmentCode || '',
        description: course.description || '',
        units: course.totalUnits,
        status: course.courseStatus,
        totalStudents: course._count.Student,
        totalInstructors: uniqueInstructors.size, // Actual count of unique instructors
        createdAt: course.createdAt.toISOString(),
        updatedAt: course.updatedAt.toISOString(),
        courseType: course.courseType,
        major: course.major || '',
      };
    });

    console.log("Courses transformed successfully");
    return NextResponse.json(transformedCourses);
  } catch (error) {
    console.error("Error fetching courses:", error);
    
    // Provide more detailed error information
    let errorMessage = "Failed to fetch courses";
    let statusCode = 500;
    
    if (error instanceof Error) {
      if (error.message.includes("connect")) {
        errorMessage = "Database connection failed";
        statusCode = 503;
      } else if (error.message.includes("table") || error.message.includes("relation")) {
        errorMessage = "Database schema issue - table not found";
        statusCode = 500;
      } else if (error.message.includes("timeout")) {
        errorMessage = "Database query timeout";
        statusCode = 504;
      } else {
        errorMessage = error.message;
      }
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: statusCode }
    );
  }
}

// POST /api/courses - Create a new course
export async function POST(request: NextRequest) {
  try {
    const gate = await assertAdmin(request);
    if (!('ok' in gate) || gate.ok !== true) return gate.res;
    const body = await request.json();
    const { name, code, department, description, units, status, courseType } = body;

    // Validate required fields
    if (!name || !code || !department || !units || !status) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if course code already exists
    const existingCourse = await prisma.courseOffering.findFirst({
      where: {
        courseCode: code,
      },
    });

    if (existingCourse) {
      return NextResponse.json(
        { error: "Course code already exists" },
        { status: 400 }
      );
    }

    // Normalize enums
    const normalizedStatus = typeof status === 'string' ? status.toUpperCase() : undefined;
    if (!normalizedStatus || !(normalizedStatus in CourseStatus)) {
      return NextResponse.json(
        { error: "Invalid or missing status" },
        { status: 400 }
      );
    }
    const normalizedType = typeof courseType === 'string' ? courseType.toUpperCase() : 'MANDATORY';
    const typeEnum: CourseType = (normalizedType in CourseType ? normalizedType : 'MANDATORY') as CourseType;

    // Create new course
    const newCourse = await prisma.courseOffering.create({
      data: {
        courseName: name,
        courseCode: code,
        departmentId: parseInt(department),
        description: description || "",
        totalUnits: units,
        courseStatus: normalizedStatus as CourseStatus,
        courseType: typeEnum,
      },
    });

    return NextResponse.json(newCourse);
  } catch (error) {
    console.error("Error creating course:", error);
    return NextResponse.json(
      { error: "Failed to create course" },
      { status: 500 }
    );
  }
} 