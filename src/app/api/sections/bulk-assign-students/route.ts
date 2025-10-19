import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
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

    const { studentIds, sectionId } = await request.json();

    if (!Array.isArray(studentIds) || studentIds.length === 0) {
      return NextResponse.json({ error: 'Student IDs array is required' }, { status: 400 });
    }

    if (!sectionId || !Number.isFinite(Number(sectionId))) {
      return NextResponse.json({ error: 'Valid section ID is required' }, { status: 400 });
    }

    const sectionIdNum = Number(sectionId);

    // Verify section exists and get current enrollment
    const section = await prisma.section.findUnique({
      where: { sectionId: sectionIdNum },
      select: { 
        sectionId: true, 
        sectionName: true, 
        sectionCapacity: true,
        yearLevel: true
      }
    });

    if (!section) {
      return NextResponse.json({ error: 'Section not found' }, { status: 404 });
    }

    // Get current enrollment count
    const currentEnrollment = await prisma.studentSection.count({
      where: { 
        sectionId: sectionIdNum,
        enrollmentStatus: 'ACTIVE'
      }
    });

    // Check capacity
    if (currentEnrollment + studentIds.length > section.sectionCapacity) {
      return NextResponse.json({ 
        error: `Section capacity exceeded. Current: ${currentEnrollment}, Capacity: ${section.sectionCapacity}, Trying to add: ${studentIds.length}` 
      }, { status: 400 });
    }

    // Verify all students exist and get their year levels
    const students = await prisma.student.findMany({
      where: { 
        studentId: { in: studentIds },
        status: 'ACTIVE'
      },
      select: { 
        studentId: true, 
        firstName: true, 
        lastName: true, 
        yearLevel: true,
        studentIdNum: true
      }
    });

    if (students.length !== studentIds.length) {
      const foundIds = students.map(s => s.studentId);
      const missingIds = studentIds.filter(id => !foundIds.includes(id));
      return NextResponse.json({ 
        error: `Some students not found or inactive: ${missingIds.join(', ')}` 
      }, { status: 400 });
    }

    // Check if students are already enrolled in this section
    const existingEnrollments = await prisma.studentSection.findMany({
      where: {
        studentId: { in: studentIds },
        sectionId: sectionIdNum,
        enrollmentStatus: 'ACTIVE'
      },
      select: { studentId: true }
    });

    if (existingEnrollments.length > 0) {
      const alreadyEnrolledIds = existingEnrollments.map(e => e.studentId);
      return NextResponse.json({ 
        error: `Some students are already enrolled in this section: ${alreadyEnrolledIds.join(', ')}` 
      }, { status: 400 });
    }

    // Validate year level compatibility - STRICT: All students must match section year level
    const incompatibleStudents = students.filter(student => Number(student.yearLevel) !== Number(section.yearLevel));
    if (incompatibleStudents.length > 0) {
      const incompatibleIds = incompatibleStudents.map(s => s.studentId);
      return NextResponse.json({ 
        error: `Year level mismatch: Students ${incompatibleIds.join(', ')} have year level ${incompatibleStudents[0].yearLevel} but section requires year level ${section.yearLevel}` 
      }, { status: 400 });
    }

    // Perform bulk assignment
    const assignments = studentIds.map(studentId => ({
      studentId: Number(studentId),
      sectionId: sectionIdNum,
      enrollmentStatus: 'ACTIVE' as const,
      enrollmentDate: new Date(),
      isRegular: true
    }));

    const result = await prisma.studentSection.createMany({
      data: assignments,
      skipDuplicates: true
    });

    // Get updated enrollment count
    const newEnrollmentCount = await prisma.studentSection.count({
      where: { 
        sectionId: sectionIdNum,
        enrollmentStatus: 'ACTIVE'
      }
    });

    return NextResponse.json({
      success: true,
      message: `Successfully assigned ${result.count} students to section ${section.sectionName}`,
      data: {
        sectionId: section.sectionId,
        sectionName: section.sectionName,
        assignedCount: result.count,
        totalEnrollment: newEnrollmentCount,
        capacity: section.sectionCapacity,
        students: students.map(s => ({
          studentId: s.studentId,
          name: `${s.firstName} ${s.lastName}`,
          studentIdNumber: s.studentIdNum,
          yearLevel: s.yearLevel
        }))
      }
    });

  } catch (error) {
    console.error('Bulk assign students error:', error);
    return NextResponse.json({ 
      error: 'Failed to assign students to section' 
    }, { status: 500 });
  }
}
