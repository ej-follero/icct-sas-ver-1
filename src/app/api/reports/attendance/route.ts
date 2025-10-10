import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get('page') || '1'));
    const pageSize = Math.min(1000, Math.max(1, Number(searchParams.get('pageSize') || '50')));
    const departmentIdParam = searchParams.get('departmentId');
    const courseIdParam = searchParams.get('courseId');
    const yearLevelParam = searchParams.get('yearLevel');
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');

    // Build where clause for students
    const where: any = {};
    if (departmentIdParam && departmentIdParam !== 'all') {
      const deptNum = Number(departmentIdParam);
      if (!Number.isNaN(deptNum) && Number.isFinite(deptNum)) {
        where.departmentId = deptNum;
      } else {
        // fallback by departmentCode via relation
        where.Department = { is: { departmentCode: departmentIdParam } };
      }
    }
    if (courseIdParam && courseIdParam !== 'all') {
      const courseNum = Number(courseIdParam);
      if (!Number.isNaN(courseNum) && Number.isFinite(courseNum)) {
        where.courseId = courseNum;
      } else {
        where.CourseOffering = { is: { courseCode: courseIdParam } };
      }
    }
    if (yearLevelParam && yearLevelParam !== 'all') {
      where.yearLevel = yearLevelParam;
    }

    const attendanceTimeWhere: any = {};
    if (startDateParam) attendanceTimeWhere.gte = new Date(startDateParam);
    if (endDateParam) attendanceTimeWhere.lte = new Date(endDateParam);

    const [total, students] = await Promise.all([
      prisma.student.count({ where }),
      prisma.student.findMany({
        where,
        include: {
          Department: true,
          CourseOffering: true,
          Attendance: {
            where: {
              ...(startDateParam || endDateParam ? { timestamp: attendanceTimeWhere } : {}),
            },
            orderBy: { timestamp: 'desc' },
          },
        },
        orderBy: { studentId: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      })
    ]);

    const data = students.map((s) => {
      const present = s.Attendance.filter(a => a.status === 'PRESENT').length;
      const late = s.Attendance.filter(a => a.status === 'LATE').length;
      const absent = s.Attendance.filter(a => a.status === 'ABSENT').length;
      const excused = s.Attendance.filter(a => a.status === 'EXCUSED').length;
      const totalDays = s.Attendance.length;
      const attended = present + late + excused; // counting excused as attended for rate? adjust if needed
      const attendanceRate = totalDays > 0 ? Math.round((attended / totalDays) * 100) : 0;
      const lastAttendance = s.Attendance[0]?.timestamp?.toISOString() || null;

      return {
        id: s.studentId,
        studentName: `${s.firstName} ${s.lastName}`.trim(),
        studentId: s.studentIdNum,
        department: s.Department?.departmentName || null,
        course: s.CourseOffering?.courseName || null,
        courseCode: s.CourseOffering?.courseCode || null,
        yearLevel: s.yearLevel,
        attendanceRate,
        presentDays: present,
        lateDays: late,
        absentDays: absent,
        excusedDays: excused,
        totalDays,
        lastAttendance,
      };
    });

    return NextResponse.json({
      success: true,
      data,
      meta: {
        type: 'students',
        count: data.length,
        total,
        page,
        pageSize,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Attendance reports API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch attendance reports',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
