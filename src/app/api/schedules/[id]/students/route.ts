import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET students for a specific schedule
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

    const { id } = await params;
    const scheduleId = parseInt(id);
    
    if (isNaN(scheduleId)) {
      return NextResponse.json({ error: 'Invalid schedule ID' }, { status: 400 });
    }

    // Check if schedule exists
    const schedule = await prisma.subjectSchedule.findUnique({
      where: { subjectSchedId: scheduleId },
      select: { subjectSchedId: true, sectionId: true }
    });

    if (!schedule) {
      return NextResponse.json({ error: 'Schedule not found' }, { status: 404 });
    }

    // Get students enrolled in this schedule
    const students = await prisma.studentSchedule.findMany({
      where: {
        scheduleId: scheduleId,
        status: 'ACTIVE'
      },
      include: {
        student: {
          include: {
            User: {
              select: {
                email: true,
                status: true
              }
            },
            CourseOffering: {
              select: {
                courseName: true
              }
            },
            Department: {
              select: {
                departmentName: true
              }
            }
          }
        }
      },
      orderBy: {
        student: {
          lastName: 'asc'
        }
      }
    });

    // Also get students from the section (alternative approach)
    const sectionStudents = await prisma.studentSection.findMany({
      where: {
        sectionId: schedule.sectionId,
        enrollmentStatus: 'ACTIVE'
      },
      include: {
        Student: {
          include: {
            User: {
              select: {
                email: true,
                status: true
              }
            },
            CourseOffering: {
              select: {
                courseName: true
              }
            },
            Department: {
              select: {
                departmentName: true
              }
            }
          }
        }
      },
      orderBy: {
        Student: {
          lastName: 'asc'
        }
      }
    });

    // Combine and deduplicate students
    const allStudents = [
      ...students.map(s => ({
        ...s.student,
        enrollmentType: 'schedule',
        enrolledAt: s.enrolledAt,
        status: s.status
      })),
      ...sectionStudents.map(s => ({
        ...s.Student,
        enrollmentType: 'section',
        enrolledAt: s.enrollmentDate,
        status: s.enrollmentStatus
      }))
    ];

    // Remove duplicates based on studentId
    const uniqueStudents = allStudents.reduce((acc, student) => {
      const existing = acc.find(s => s.studentId === student.studentId);
      if (!existing) {
        acc.push(student);
      }
      return acc;
    }, [] as any[]);

    return NextResponse.json({
      success: true,
      data: uniqueStudents,
      total: uniqueStudents.length,
      scheduleId: scheduleId,
      sectionId: schedule.sectionId
    });

  } catch (error) {
    console.error('Error fetching schedule students:', error);
    return NextResponse.json({ error: 'Failed to fetch schedule students' }, { status: 500 });
  }
}
