import { NextResponse } from 'next/server';
import { PrismaClient, Status } from '@prisma/client';

const prisma = new PrismaClient();

// GET all departments
export async function GET() {
  try {
    const departments = await prisma.department.findMany({
      include: {
        _count: {
          select: {
            Instructor: true,
            CourseOffering: true,
          },
        },
        CourseOffering: {
          include: {
            _count: {
              select: {
                Student: true,
                Section: true,
              },
            },
          },
        },
        Instructor: {
          select: {
            instructorId: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    console.log('Raw departments from database:', departments); // Debug log

    const formattedDepartments = departments.map(dept => ({
      id: dept.departmentId.toString(),
      name: dept.departmentName,
      code: dept.departmentCode,
      description: dept.departmentDescription,
      headOfDepartment: dept.Instructor[0] ? `${dept.Instructor[0].firstName} ${dept.Instructor[0].lastName}` : 'Not Assigned',
      totalInstructors: dept._count.Instructor,
      status: dept.departmentStatus === Status.ACTIVE ? 'active' : 'inactive',
      courseOfferings: dept.CourseOffering.map(course => ({
        id: course.courseId.toString(),
        name: course.courseName,
        code: course.courseCode,
        description: course.description,
        status: course.courseStatus === 'ACTIVE' ? 'active' : 'inactive',
        totalStudents: course._count.Student,
        totalSections: course._count.Section,
      })),
    }));

    console.log('Formatted departments:', formattedDepartments); // Debug log

    return NextResponse.json({ data: formattedDepartments });
  } catch (error) {
    console.error('Error fetching departments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch departments' },
      { status: 500 }
    );
  }
}

// POST new department
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, code, description, status } = body;

    const newDepartment = await prisma.department.create({
      data: {
        departmentName: name,
        departmentCode: code,
        departmentDescription: description,
        departmentStatus: status === 'active' ? Status.ACTIVE : Status.INACTIVE,
      },
    });

    // Format the response to match the frontend expectations
    const formattedDepartment = {
      id: newDepartment.departmentId.toString(),
      name: newDepartment.departmentName,
      code: newDepartment.departmentCode,
      description: newDepartment.departmentDescription,
      status: newDepartment.departmentStatus === Status.ACTIVE ? 'active' : 'inactive',
      totalInstructors: 0,
    };

    return NextResponse.json({ data: formattedDepartment }, { status: 201 });
  } catch (error) {
    console.error('Error creating department:', error);
    return NextResponse.json(
      { error: 'Failed to create department' },
      { status: 500 }
    );
  }
} 