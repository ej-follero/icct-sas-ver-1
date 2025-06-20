import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/courses - Get all courses
export async function GET() {
  try {
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

    return NextResponse.json(transformedCourses);
  } catch (error) {
    console.error("Error fetching courses:", error);
    return NextResponse.json(
      { error: "Failed to fetch courses" },
      { status: 500 }
    );
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