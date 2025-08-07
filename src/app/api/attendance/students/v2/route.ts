import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Extract query parameters
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '25');
    const sortBy = searchParams.get('sortBy') || 'attendanceRate';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    
    // Extract filter parameters
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const departmentCode = searchParams.get('departmentCode');
    const courseId = searchParams.get('courseId');
    const yearLevel = searchParams.get('yearLevel');
    const status = searchParams.get('status');
    const studentType = searchParams.get('studentType');
    const enrollmentStatus = searchParams.get('enrollmentStatus');
    const attendanceRate = searchParams.get('attendanceRate');
    const riskLevel = searchParams.get('riskLevel');
    
    // Build cache key for future caching implementation
    const cacheKey = `students_v2_${JSON.stringify({
      page,
      pageSize,
      sortBy,
      sortOrder,
      startDate,
      endDate,
      departmentCode,
      courseId,
      yearLevel,
      status,
      studentType,
      enrollmentStatus,
      attendanceRate,
      riskLevel
    })}`;
    
    // Build where clause for filters
    const whereClause: any = {
      status: 'ACTIVE'
    };
    
    if (departmentCode) {
      whereClause.department = {
        code: departmentCode
      };
    }
    
    if (courseId) {
      whereClause.courseId = courseId;
    }
    
    if (yearLevel) {
      whereClause.yearLevel = yearLevel;
    }
    
    if (status) {
      whereClause.status = status;
    }
    
    if (studentType) {
      whereClause.studentType = studentType;
    }
    
    if (enrollmentStatus) {
      whereClause.enrollmentStatus = enrollmentStatus;
    }
    
    // Build order by clause
    let orderBy: any = { lastName: 'asc' };
    if (sortBy === 'attendance-desc') {
      orderBy = { Attendance: { _count: 'desc' } };
    } else if (sortBy === 'attendance-asc') {
      orderBy = { Attendance: { _count: 'asc' } };
    } else if (sortBy === 'name') {
      orderBy = { firstName: 'asc' };
    } else if (sortBy === 'id') {
      orderBy = { studentIdNum: 'asc' };
    } else if (sortBy === 'department') {
      orderBy = { Department: { departmentName: 'asc' } };
    } else if (sortBy === 'course') {
      orderBy = { CourseOffering: { courseName: 'asc' } };
    } else if (sortBy === 'year-level') {
      orderBy = { yearLevel: 'asc' };
    } else if (sortBy === 'status') {
      orderBy = { status: 'asc' };
    }
    
    // Calculate offset for pagination
    const offset = (page - 1) * pageSize;
    
    // Get total count
    const totalCount = await prisma.student.count({
      where: whereClause
    });
    
    // Get students with attendance data using Prisma query
    const students = await prisma.student.findMany({
      where: whereClause,
      select: {
        studentId: true,
        firstName: true,
        lastName: true,
        middleName: true,
        suffix: true,
        studentIdNum: true,
        email: true,
        phoneNumber: true,
        yearLevel: true,
        gender: true,
        status: true,
        studentType: true,
        rfidTag: true,
        address: true,
        createdAt: true,
        updatedAt: true,
        departmentId: true,
        courseId: true,
        Department: {
          select: {
            departmentId: true,
            departmentName: true,
            departmentCode: true
          }
        },
        CourseOffering: {
          select: {
            courseId: true,
            courseName: true,
            courseCode: true
          }
        },
        User: {
          select: {
            userId: true,
            lastLogin: true
          }
        },
        Guardian: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phoneNumber: true,
            relationshipToStudent: true
          }
        },
        StudentSection: {
          where: {
            enrollmentStatus: 'ACTIVE'
          },
          select: {
            enrollmentDate: true,
            enrollmentStatus: true,
            Section: {
              select: {
                sectionId: true,
                sectionName: true
              }
            }
          }
        },
        _count: {
          select: {
            Attendance: true
          }
        }
      },
      orderBy: orderBy,
      skip: offset,
      take: pageSize
    });

    // Fetch attendance data separately for better performance
    const studentIds = students.map(s => s.studentId);
    const attendanceData = await prisma.attendance.groupBy({
      by: ['studentId', 'status'],
      where: {
        studentId: { in: studentIds }
      },
      _count: {
        status: true
      }
    });

    // Fetch recent attendance records for charts
    // Support dynamic date range
    const attendanceWhere: any = {
      studentId: { in: studentIds }
    };
    if (startDate) attendanceWhere.timestamp = { ...(attendanceWhere.timestamp || {}), gte: new Date(startDate) };
    if (endDate) attendanceWhere.timestamp = { ...(attendanceWhere.timestamp || {}), lte: new Date(endDate) };
    if (!startDate && !endDate) {
      // Default: last 30 days
      attendanceWhere.timestamp = { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) };
    }

    const recentAttendanceRecords = await prisma.attendance.findMany({
      where: attendanceWhere,
      select: {
        studentId: true,
        status: true,
        timestamp: true,
        verification: true, // Verification status field
        attendanceType: true
      },
      orderBy: {
        timestamp: 'desc'
      }
    });

    // Create attendance lookup map
    const attendanceMap = new Map();
    attendanceData.forEach(item => {
      if (!attendanceMap.has(item.studentId)) {
        attendanceMap.set(item.studentId, {});
      }
      attendanceMap.get(item.studentId)[item.status] = item._count.status;
    });

    // Create recent attendance records map
    const recentRecordsMap = new Map();
    recentAttendanceRecords.forEach(record => {
      if (!recentRecordsMap.has(record.studentId)) {
        recentRecordsMap.set(record.studentId, []);
      }
      recentRecordsMap.get(record.studentId).push({
        status: record.status,
        timestamp: record.timestamp.toISOString(),
        type: record.attendanceType,
        verificationStatus: record.verification
      });
    });
    
    // Transform the data to match the expected format
    const transformedStudents = students.map((student: any) => {
      const attendanceCounts = attendanceMap.get(student.studentId) || {};
      const totalDays = Object.values(attendanceCounts).reduce((sum: number, count: any) => sum + count, 0);
      const presentCount = attendanceCounts.PRESENT || 0;
      const lateCount = attendanceCounts.LATE || 0;
      const absentCount = attendanceCounts.ABSENT || 0;
      const excusedCount = attendanceCounts.EXCUSED || 0;
      
      const attendanceRate = totalDays > 0 ? 
        Math.round(((presentCount + lateCount) / totalDays) * 100 * 10) / 10 : 0;

      // Calculate risk level based on attendance patterns
      const calculateRiskLevel = (rate: number) => {
        if (rate >= 90) return 'LOW';
        if (rate >= 75) return 'MEDIUM';
        if (rate >= 60) return 'HIGH';
        return 'CRITICAL';
      };
      
      const riskLevel = calculateRiskLevel(attendanceRate);

      return {
        id: student.studentId.toString(),
        studentId: student.studentIdNum,
        studentName: `${student.firstName} ${student.middleName ? student.middleName + ' ' : ''}${student.lastName}${student.suffix ? ' ' + student.suffix : ''}`,
        firstName: student.firstName,
        lastName: student.lastName,
        middleName: student.middleName || '',
        email: student.email,
        phoneNumber: student.phoneNumber,
        department: student.Department ? `${student.Department.departmentCode} - ${student.Department.departmentName}` : 'Unknown',
        course: student.CourseOffering?.courseName || 'Unknown',
        yearLevel: student.yearLevel,
        gender: student.gender,
        status: student.status,
        studentType: student.studentType,
        rfidTag: student.rfidTag,
        userId: student.User?.userId || null,
        courseId: student.courseId || null,
        departmentId: student.departmentId || null,
        
        // Attendance statistics
        presentDays: presentCount,
        absentDays: absentCount,
        lateDays: lateCount,
        excusedDays: excusedCount,
        totalDays: totalDays,
        attendanceRate: attendanceRate,
        
        // Additional calculated fields
        riskLevel: riskLevel,
        
        // Recent attendance records for charts
        recentAttendanceRecords: recentRecordsMap.get(student.studentId) || [],
        
        // Guardian info
        guardianInfo: student.Guardian ? {
          name: `${student.Guardian.firstName} ${student.Guardian.lastName}`,
          email: student.Guardian.email,
          phone: student.Guardian.phoneNumber,
          relationship: student.Guardian.relationshipToStudent
        } : null,
        
        // Section info
        sectionInfo: student.StudentSection?.[0] ? {
          sectionName: student.StudentSection[0].Section?.sectionName || 'Unknown Section',
          sectionCode: student.StudentSection[0].Section?.sectionId?.toString() || 'N/A',
          enrollmentDate: student.StudentSection[0].enrollmentDate?.toISOString() || new Date().toISOString(),
          sectionStatus: student.StudentSection[0].enrollmentStatus || 'UNKNOWN'
        } : null,
        
        createdAt: student.createdAt?.toISOString(),
        updatedAt: student.updatedAt?.toISOString(),
        lastLogin: student.User?.lastLogin?.toISOString()
      };
    });
    
    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / pageSize);
    
    const response = {
      students: transformedStudents,
      pagination: {
        currentPage: page,
        pageSize,
        totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      },
      meta: {
        apiVersion: 'v2',
        timestamp: new Date().toISOString(),
        filters: {
          startDate,
          endDate,
          departmentCode,
          courseId,
          yearLevel,
          status,
          studentType,
          enrollmentStatus,
          attendanceRate,
          riskLevel
        },
        sort: {
          field: sortBy,
          order: sortOrder
        }
      }
    };
    
    return NextResponse.json(response, {
      headers: {
        'x-api-version': 'v2',
        'x-cache-status': 'DISABLED',
        'x-cache-key': cacheKey
      }
    });
    
  } catch (error) {
    console.error('V2 API Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch students data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function HEAD() {
  try {
    // Quick health check
    // Cache stats would be available here when caching is implemented
    
    const response = new NextResponse(null, { status: 200 });
    response.headers.set('X-Cache-Size', '0');
    response.headers.set('X-API-Version', '2.0');
    response.headers.set('X-Status', 'healthy');
    
    return response;
  } catch (error) {
    return new NextResponse(null, { status: 503 });
  }
} 