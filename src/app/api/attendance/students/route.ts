import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const departmentId = searchParams.get('departmentId');
    const departmentCode = searchParams.get('departmentCode');
    const courseId = searchParams.get('courseId');
    const yearLevel = searchParams.get('yearLevel');
    const status = searchParams.get('status');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sortBy') || 'attendance-desc';
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '25');

    console.log('Fetching students with attendance data. Filters:', {
      departmentId,
      departmentCode,
      courseId,
      yearLevel,
      status,
      startDate,
      endDate,
      search,
      sortBy,
      page,
      pageSize
    });

    // Build where clause for students
    const studentWhere: any = {};
    
    if (departmentCode) {
      studentWhere.Department = {
        departmentCode: departmentCode
      };
    } else if (departmentId) {
      studentWhere.departmentId = parseInt(departmentId);
    }

    if (courseId) {
      studentWhere.courseId = parseInt(courseId);
    }
    
    if (yearLevel) {
      studentWhere.yearLevel = yearLevel;
    }
    
    if (status) {
      studentWhere.status = status;
    }

    // Add search filter
    if (search) {
      studentWhere.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { studentIdNum: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { Department: { departmentName: { contains: search, mode: 'insensitive' } } },
        { CourseOffering: { courseName: { contains: search, mode: 'insensitive' } } }
      ];
    }

    // Build attendance date filter
    const attendanceWhere: any = {};
    if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      attendanceWhere.timestamp = {
        gte: start,
        lte: end
      };
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
    } else if (sortBy === 'yearLevel') {
      orderBy = { yearLevel: 'asc' };
    }

    // Calculate pagination
    const skip = (page - 1) * pageSize;

    // First, get total count for pagination
    const totalCount = await prisma.student.count({
      where: studentWhere
    });

    // Fetch students with optimized includes
    const students = await prisma.student.findMany({
      where: studentWhere,
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
        guardianId: true,
        userId: true,
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
        Guardian: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phoneNumber: true,
            relationshipToStudent: true
          }
        },
        User: {
          select: {
            userId: true,
            lastLogin: true
          }
        },
        StudentSection: {
          where: {
            enrollmentStatus: 'ACTIVE'
          },
          select: {
            Section: {
              select: {
                sectionId: true,
                sectionName: true
              }
            },
            enrollmentDate: true,
            enrollmentStatus: true
          }
        },
        StudentSchedules: {
          select: {
            schedule: {
              select: {
                subject: {
                  select: {
                    subjectName: true,
                    subjectCode: true
                  }
                },
                instructor: {
                  select: {
                    firstName: true,
                    lastName: true
                  }
                },
                room: {
                  select: {
                    roomNo: true
                  }
                },
                day: true,
                startTime: true,
                endTime: true
              }
            },
            enrolledAt: true,
            status: true
          }
        },
        _count: {
          select: {
            Attendance: true
          }
        }
      },
      orderBy,
      skip,
      take: pageSize
    });

    console.log(`Found ${students.length} students (page ${page} of ${Math.ceil(totalCount / pageSize)})`);

    // Fetch attendance data separately for better performance
    const studentIds = students.map(s => s.studentId);
    const attendanceData = await prisma.attendance.groupBy({
      by: ['studentId', 'status'],
      where: {
        studentId: { in: studentIds },
        ...attendanceWhere
      },
      _count: {
        status: true
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

    // Transform students with calculated attendance statistics
    const transformedStudents = students.map(student => {
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
        if (rate >= 90) return 'NONE';
        if (rate >= 75) return 'LOW';
        if (rate >= 60) return 'MEDIUM';
        return 'HIGH';
      };
      
      const riskLevel = calculateRiskLevel(attendanceRate);

      // Get section information
      const activeSection = student.StudentSection?.[0];
      const sectionInfo = activeSection?.Section;

      return {
        id: student.studentId.toString(),
        studentName: `${student.firstName} ${student.middleName ? student.middleName + ' ' : ''}${student.lastName}${student.suffix ? ' ' + student.suffix : ''}`,
        studentId: student.studentIdNum,
        studentIdNumber: student.studentIdNum,
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
        guardianId: student.guardianId || null,
        subjects: student.StudentSchedules?.map((ss) => ({
          subjectName: ss.schedule?.subject?.subjectName || 'Unknown Subject',
          subjectCode: ss.schedule?.subject?.subjectCode || 'N/A',
          instructor: ss.schedule?.instructor ?
            `${ss.schedule.instructor.firstName || ''} ${ss.schedule.instructor.lastName || ''}`.trim() || 'TBD' : 'TBD',
          room: ss.schedule?.room?.roomNo || 'TBD',
          schedule: {
            dayOfWeek: ss.schedule?.day || 'TBD',
            startTime: ss.schedule?.startTime || 'TBD',
            endTime: ss.schedule?.endTime || 'TBD'
          },
          enrollmentDate: ss.enrolledAt?.toISOString() || new Date().toISOString(),
          status: ss.status || 'UNKNOWN'
        })) || [],
        
        // Section Information
        sectionInfo: sectionInfo ? {
          sectionName: sectionInfo.sectionName || 'Unknown Section',
          sectionCode: sectionInfo.sectionId?.toString() || 'N/A',
          instructor: null,
          enrollmentDate: activeSection?.enrollmentDate?.toISOString() || new Date().toISOString(),
          sectionStatus: activeSection?.enrollmentStatus || 'UNKNOWN'
        } : null,
        
        // Attendance statistics
        presentDays: presentCount,
        absentDays: absentCount,
        lateDays: lateCount,
        excusedDays: excusedCount,
        totalDays: totalDays,
        attendanceRate: attendanceRate,
        
        // Last attendance info (simplified)
        lastAttendance: new Date().toISOString(),
        lastAttendanceStatus: 'ABSENT',
        lastAttendanceType: 'REGULAR',
        lastVerificationStatus: 'PENDING',
        lastCheckInTime: '',
        lastCheckOutTime: '',
        lastDuration: 0,
        lastLocation: 'Room TBD',
        
        // Additional calculated fields
        trend: 0,
        riskLevel: riskLevel,
        riskFactors: {
          attendanceRate: attendanceRate,
          recentAbsences: absentCount,
          trend: 0,
          consecutiveAbsences: 0
        },
        
        // Subject attendance
        subjectAttendance: {},
        
        // Guardian info
        guardianInfo: student.Guardian ? {
          name: `${student.Guardian.firstName} ${student.Guardian.lastName}`,
          email: student.Guardian.email,
          phone: student.Guardian.phoneNumber,
          relationship: student.Guardian.relationshipToStudent
        } : null,
        
        // Academic info
        academicInfo: {
          totalSubjects: student.StudentSchedules?.length || 0,
          currentEnrollment: student.StudentSchedules?.length || 0,
          sectionName: sectionInfo?.sectionName || 'Not Assigned',
          sectionCode: sectionInfo?.sectionId?.toString() || '',
          instructor: 'TBD'
        },
        
        // Calculated attendance stats for dashboard
        attendanceStats: {
          presentPercentage: totalDays > 0 ? Math.round((presentCount / totalDays) * 100 * 10) / 10 : 0,
          latePercentage: totalDays > 0 ? Math.round((lateCount / totalDays) * 100 * 10) / 10 : 0,
          absentPercentage: totalDays > 0 ? Math.round((absentCount / totalDays) * 100 * 10) / 10 : 0,
          excusedPercentage: totalDays > 0 ? Math.round((excusedCount / totalDays) * 100 * 10) / 10 : 0
        },
        
        // Additional fields for compatibility
        address: student.address || '',
        avatarUrl: null,
        enrollmentStatus: student.status,
        lastDeviceInfo: null,
        recentAttendanceRecords: [],
        createdAt: student.createdAt?.toISOString(),
        updatedAt: student.updatedAt?.toISOString(),
        lastLogin: student.User?.lastLogin?.toISOString()
      };
    });

    console.log(`Transformed ${transformedStudents.length} students with attendance data`);
    
    return NextResponse.json({
      students: transformedStudents,
      total: totalCount,
      page,
      pageSize,
      totalPages: Math.ceil(totalCount / pageSize),
      filters: {
        departmentId,
        courseId,
        yearLevel,
        status,
        startDate,
        endDate,
        search,
        sortBy
      }
    });

  } catch (error) {
    console.error('Error fetching students with attendance:', error);
    return NextResponse.json(
      { error: 'Failed to fetch students with attendance data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 