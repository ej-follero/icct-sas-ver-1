import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/courses - Get all courses
export async function GET() {
  try {
    console.log("Fetching courses from database...");
    
    // Ensure the client is connected
    try {
      await prisma.$connect();
      console.log("Database connection successful");
    } catch (connectionError) {
      console.error("Database connection failed:", connectionError);
      return NextResponse.json(
        { 
          error: "Database connection failed",
          details: process.env.NODE_ENV === 'development' ? connectionError : undefined
        },
        { status: 503 }
      );
    }
    
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
    const transformedCourses = courses.map(course => ({
      id: course.courseId.toString(),
      name: course.courseName,
      code: course.courseCode,
      department: course.Department?.departmentName || '',
      description: course.description || '',
      units: course.totalUnits,
      status: course.courseStatus,
      totalStudents: course._count.Student,
      totalInstructors: course._count.Section, // Using section count as a proxy for instructors
      createdAt: course.createdAt.toISOString(),
      updatedAt: course.updatedAt.toISOString(),
      courseType: course.courseType,
    }));

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
  } finally {
    try {
      await prisma.$disconnect();
    } catch (disconnectError) {
      console.error("Error disconnecting from database:", disconnectError);
    }
  }
}

// POST /api/courses - Create a new course
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, code, department, description, units, status } = body;

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

    // Create new course
    const newCourse = await prisma.courseOffering.create({
      data: {
        courseName: name,
        courseCode: code,
        departmentId: parseInt(department),
        description: description || "",
        totalUnits: units,
        courseStatus: status,
        courseType: "MANDATORY", // Default value
        academicYear: new Date().getFullYear().toString(),
        semester: "FIRST_SEMESTER", // Default value
        semesterId: 1, // You'll need to handle this properly
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