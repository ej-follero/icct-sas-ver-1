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

    // If not found by ID, try to find by code
    if (!course) {
      course = await prisma.courseOffering.findUnique({
        where: {
          courseCode: params.id,
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
    }

    if (!course) {
      return NextResponse.json(
        { error: "Course not found" },
        { status: 404 }
      );
    }

    // Calculate unique instructors for this course
    const uniqueInstructors = new Set();
    course.Subjects.forEach(subject => {
      subject.Instructor.forEach(instructor => {
        uniqueInstructors.add(instructor.instructorId);
      });
    });

    return NextResponse.json({
      id: course.courseId.toString(),
      name: course.courseName,
      code: course.courseCode,
      department: course.Department?.departmentName ?? '',
      departmentCode: course.Department?.departmentCode ?? '',
      description: course.description,
      units: course.totalUnits,
      status: course.courseStatus,
      totalStudents: course._count.Student,
      totalInstructors: uniqueInstructors.size,
      createdAt: course.createdAt.toISOString(),
      updatedAt: course.updatedAt.toISOString(),
      courseType: course.courseType,
      major: course.major || '',
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
    const { name, code, department, description, units, status, courseType, major } = body;

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
        courseType: courseType || existingCourse.courseType,
        major: major || existingCourse.major,
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

// DELETE /api/courses/[id] - Soft delete (archive) a course
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

    // Soft delete: set courseStatus to 'ARCHIVED'
    await prisma.courseOffering.update({
      where: {
        courseId: existingCourse.courseId,
      },
      data: {
        courseStatus: 'ARCHIVED',
      },
    });

    return NextResponse.json(
      { message: "Course archived (soft deleted) successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error archiving course:", error);
    return NextResponse.json(
      { error: "Failed to archive course" },
      { status: 500 }
    );
  }
}

// PATCH /api/courses/[id] - Update course status (e.g., restore from archived)
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { status } = body;
    if (!status) {
      return NextResponse.json(
        { error: "Missing status field" },
        { status: 400 }
      );
    }
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
    // Update only the courseStatus
    const updatedCourse = await prisma.courseOffering.update({
      where: {
        courseId: existingCourse.courseId,
      },
      data: {
        courseStatus: status,
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
      department: updatedCourse.Department?.departmentName || '',
      departmentCode: updatedCourse.Department?.departmentCode || '',
      description: updatedCourse.description || '',
      units: updatedCourse.totalUnits,
      status: updatedCourse.courseStatus,
      totalStudents: updatedCourse._count.Student,
      totalInstructors: updatedCourse._count.Section,
      createdAt: updatedCourse.createdAt.toISOString(),
      updatedAt: updatedCourse.updatedAt.toISOString(),
      courseType: updatedCourse.courseType,
      major: updatedCourse.major || '',
    });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || "Failed to update course status" },
      { status: 500 }
    );
  }
} 