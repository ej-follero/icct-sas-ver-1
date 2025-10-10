import { NextResponse } from 'next/server';
import { Status } from '@prisma/client';
import { prisma } from '@/lib/prisma';

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
        head: {
          select: {
            userId: true,
            userName: true,
          },
        },
      },
    });

    // Get instructor information for department heads
    const departmentHeadIds = departments
      .filter(dept => dept.headOfDepartment)
      .map(dept => dept.headOfDepartment!);
    
    console.log('Department head IDs:', departmentHeadIds);
    
    const headInstructors = await prisma.instructor.findMany({
      where: {
        instructorId: {
          in: departmentHeadIds
        }
      },
      select: {
        instructorId: true,
        firstName: true,
        lastName: true,
        middleName: true,
        email: true,
        phoneNumber: true,
        officeLocation: true,
        officeHours: true,
      }
    });

    console.log('Found head instructors:', headInstructors.length);
    console.log('Sample head instructor:', headInstructors[0]);

    // Create a map for quick lookup
    const headInstructorMap = new Map(
      headInstructors.map(instructor => [instructor.instructorId, instructor])
    );



    const formattedDepartments = departments.map(dept => {
      const headInstructor = dept.headOfDepartment ? headInstructorMap.get(dept.headOfDepartment) : null;
      
      const formattedDept = {
        id: dept.departmentId.toString(),
        name: dept.departmentName,
        code: dept.departmentCode,
        description: dept.departmentDescription,
        headOfDepartment: headInstructor ? 
          `${headInstructor.firstName} ${headInstructor.lastName}`.trim() : 
          (dept.head ? dept.head.userName : 'Not Assigned'),
        headOfDepartmentDetails: headInstructor ? {
          firstName: headInstructor.firstName,
          lastName: headInstructor.lastName,
          middleName: headInstructor.middleName,
          fullName: `${headInstructor.firstName} ${headInstructor.middleName ? headInstructor.middleName + ' ' : ''}${headInstructor.lastName}`.trim(),
          email: headInstructor.email,
          phoneNumber: headInstructor.phoneNumber,
          officeLocation: headInstructor.officeLocation,
          officeHours: headInstructor.officeHours,
        } : null,
        totalInstructors: dept._count.Instructor,
        status: dept.departmentStatus === Status.ACTIVE ? 'active' : 'inactive',
        logo: dept.departmentLogo,
        courseOfferings: dept.CourseOffering.map(course => ({
          id: course.courseId.toString(),
          name: course.courseName,
          code: course.courseCode,
          description: course.description,
          status: course.courseStatus === 'ACTIVE' ? 'active' : 'inactive',
          totalStudents: course._count.Student,
          totalSections: course._count.Section,
        })),
      };
      
      console.log(`Department ${formattedDept.name}: headOfDepartment = "${formattedDept.headOfDepartment}"`);
      
      return formattedDept;
    });



    return NextResponse.json({ data: formattedDepartments });
  } catch (error) {
    console.error('Error fetching departments:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : 'Unknown'
    });
    return NextResponse.json(
      { error: 'Failed to fetch departments', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// POST new department
export async function POST(request: NextRequest) {
  try {
    // JWT Authentication - Admin only
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const reqUserId = Number((decoded as any)?.userId);
    if (!Number.isFinite(reqUserId)) {
      return NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 });
    }
    const reqUser = await prisma.user.findUnique({ where: { userId: reqUserId }, select: { role: true, status: true } });
    if (!reqUser || reqUser.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'User not found or inactive' }, { status: 401 });
    }
    const adminRoles = ['SUPER_ADMIN', 'ADMIN'];
    if (!adminRoles.includes(reqUser.role)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
    const body = await request.json();
    const { name, code, description, status, courseOfferings, headOfDepartment, logo } = body;

    const newDepartment = await prisma.department.create({
      data: {
        departmentName: name,
        departmentCode: code,
        departmentDescription: description,
        departmentStatus: status === 'active' ? Status.ACTIVE : Status.INACTIVE,
        headOfDepartment: headOfDepartment ? parseInt(headOfDepartment) : null,
        departmentLogo: logo || null,
      },
    });

    // Handle course assignments if provided
    if (courseOfferings && Array.isArray(courseOfferings) && courseOfferings.length > 0) {
      const courseIds = courseOfferings.map((course: any) => parseInt(course.id));
      
      // Update courses to assign them to this department
      await prisma.courseOffering.updateMany({
        where: {
          courseId: { in: courseIds }
        },
        data: {
          departmentId: newDepartment.departmentId
        }
      });
    }

    // Format the response to match the frontend expectations
    const formattedDepartment = {
      id: newDepartment.departmentId.toString(),
      name: newDepartment.departmentName,
      code: newDepartment.departmentCode,
      description: newDepartment.departmentDescription,
      status: newDepartment.departmentStatus === Status.ACTIVE ? 'active' : 'inactive',
      logo: newDepartment.departmentLogo,
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