import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/courses/[id] - Get a specific course
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Try to find by ID first
    let course = await prisma.courseOffering.findUnique({
      where: {
        courseId: parseInt(params.id),
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

    // If not found by ID, try to find by code
    if (!course) {
      course = await prisma.courseOffering.findUnique({
        where: {
          courseCode: params.id,
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
    }

    if (!course) {
      return NextResponse.json(
        { error: "Course not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: course.courseId.toString(),
      name: course.courseName,
      code: course.courseCode,
      department: course.Department?.departmentName ?? '',
      description: course.description,
      units: course.totalUnits,
      status: course.courseStatus === 'ACTIVE' ? 'active' : 'inactive',
      totalStudents: course._count.Student,
      totalInstructors: course._count.Section,
      createdAt: course.createdAt.toISOString(),
      updatedAt: course.updatedAt.toISOString(),
      courseType: course.courseType,
    });
  } catch (error) {
    console.error("Error fetching course:", error);
    return NextResponse.json(
      { error: "Failed to fetch course" },
      { status: 500 }
    );
  }
}

// PUT /api/courses/[id] - Update a course
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
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

    // Try to find by ID first
    let existingCourse = await prisma.courseOffering.findUnique({
      where: {
        courseId: parseInt(params.id),
      },
      include: {
        Semester: true,
      },
    });

    // If not found by ID, try to find by code
    if (!existingCourse) {
      existingCourse = await prisma.courseOffering.findUnique({
        where: {
          courseCode: params.id,
        },
        include: {
          Semester: true,
        },
      });
    }

    if (!existingCourse) {
      return NextResponse.json(
        { error: "Course not found" },
        { status: 404 }
      );
    }

    // Check if new code conflicts with other courses
    if (code !== existingCourse.courseCode) {
      const codeConflict = await prisma.courseOffering.findFirst({
        where: {
          courseCode: code,
          NOT: {
            courseId: existingCourse.courseId,
          },
        },
      });

      if (codeConflict) {
        return NextResponse.json(
          { error: "Course code already exists" },
          { status: 400 }
        );
      }
    }

    // Update course
    const updatedCourse = await prisma.courseOffering.update({
      where: {
        courseId: existingCourse.courseId,
      },
      data: {
        courseName: name,
        courseCode: code,
        departmentId: parseInt(department),
        description: description || "",
        totalUnits: units,
        courseStatus: status.toUpperCase(),
        // Keep existing values for required fields
        academicYear: existingCourse.academicYear,
        semester: existingCourse.semester,
        semesterId: existingCourse.semesterId,
        courseType: existingCourse.courseType,
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

    return NextResponse.json({
      id: updatedCourse.courseId.toString(),
      name: updatedCourse.courseName,
      code: updatedCourse.courseCode,
      department: updatedCourse.Department?.departmentName ?? '',
      description: updatedCourse.description,
      units: updatedCourse.totalUnits,
      status: updatedCourse.courseStatus === 'ACTIVE' ? 'active' : 'inactive',
      totalStudents: updatedCourse._count.Student,
      totalInstructors: updatedCourse._count.Section,
      createdAt: updatedCourse.createdAt.toISOString(),
      updatedAt: updatedCourse.updatedAt.toISOString(),
      courseType: updatedCourse.courseType,
    });
  } catch (error) {
    console.error("Error updating course:", error);
    return NextResponse.json(
      { error: "Failed to update course" },
      { status: 500 }
    );
  }
}

// DELETE /api/courses/[id] - Delete a course
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Try to find by ID first
    let existingCourse = await prisma.courseOffering.findUnique({
      where: {
        courseId: parseInt(params.id),
      },
    });

    // If not found by ID, try to find by code
    if (!existingCourse) {
      existingCourse = await prisma.courseOffering.findUnique({
        where: {
          courseCode: params.id,
        },
      });
    }

    if (!existingCourse) {
      return NextResponse.json(
        { error: "Course not found" },
        { status: 404 }
      );
    }

    // Delete course
    await prisma.courseOffering.delete({
      where: {
        courseId: existingCourse.courseId,
      },
    });

    return NextResponse.json(
      { message: "Course deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting course:", error);
    return NextResponse.json(
      { error: "Failed to delete course" },
      { status: 500 }
    );
  }
} 