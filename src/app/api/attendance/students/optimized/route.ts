import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

// Cache for 5 minutes
const CACHE_DURATION = 5 * 60 * 1000;
const cache = new Map<string, { data: any; timestamp: number }>();

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
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '25');
    const search = searchParams.get('search') || '';

    // Create cache key
    const cacheKey = JSON.stringify({
      departmentId,
      departmentCode,
      courseId,
      yearLevel,
      status,
      startDate,
      endDate,
      page,
      pageSize,
      search
    });

    // Check cache
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return NextResponse.json(cached.data);
    }

    console.log('Fetching students with optimized query. Filters:', {
      departmentId,
      departmentCode,
      courseId,
      yearLevel,
      status,
      startDate,
      endDate,
      page,
      pageSize,
      search
    });

    // Build optimized where clause
    const studentWhere: Prisma.StudentWhereInput = {};
    
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
    const attendanceWhere: Prisma.AttendanceWhereInput = {};
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

    // Get total count for pagination
    const totalCount = await prisma.student.count({
      where: studentWhere
    });

    // Calculate pagination
    const skip = (page - 1) * pageSize;
    const totalPages = Math.ceil(totalCount / pageSize);

    // Optimized query with selective includes
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
        StudentSchedules: {
          select: {
            enrolledAt: true,
            status: true,
            schedule: {
              select: {
                day: true,
                startTime: true,
                endTime: true,
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
                }
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
      orderBy: {
        lastName: 'asc'
      },
      skip,
      take: pageSize
    });

    // Get attendance data in a separate optimized query
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

    // Transform students with calculated attendance statistics
    const transformedStudents = students.map(student => {
      // Get attendance counts for this student
      const studentAttendance = attendanceData.filter(a => a.studentId === student.studentId);
      const presentCount = studentAttendance.find(a => a.status === 'PRESENT')?._count.status || 0;
      const lateCount = studentAttendance.find(a => a.status === 'LATE')?._count.status || 0;
      const absentCount = studentAttendance.find(a => a.status === 'ABSENT')?._count.status || 0;
      const excusedCount = studentAttendance.find(a => a.status === 'EXCUSED')?._count.status || 0;
      
      const totalDays = presentCount + lateCount + absentCount + excusedCount;
      const attendanceRate = totalDays > 0 ? 
        Math.round(((presentCount + lateCount) / totalDays) * 100 * 10) / 10 : 0;

      // Get section information
      const activeSection = student.StudentSection[0];
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
        courseId: student.CourseOffering?.courseId || null,
        departmentId: student.Department?.departmentId || null,
        guardianId: null, // Would need to be added if needed
        
        subjects: student.StudentSchedules.map((ss) => ({
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
        })),
        
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
        lastAttendance: new Date().toISOString(), // Would need separate query for actual last attendance
        lastAttendanceStatus: 'PRESENT',
        lastAttendanceType: 'REGULAR',
        lastVerificationStatus: 'PENDING',
        lastCheckInTime: '',
        lastCheckOutTime: '',
        lastDuration: 0,
        lastLocation: 'Room TBD',
        
        // Additional calculated fields
        trend: 0,
        riskLevel: attendanceRate >= 90 ? 'NONE' : attendanceRate >= 75 ? 'LOW' : attendanceRate >= 60 ? 'MEDIUM' : 'HIGH',
        riskFactors: {
          attendanceRate: attendanceRate,
          recentAbsences: absentCount,
          trend: 0,
          consecutiveAbsences: 0
        },
        
        // Guardian info
        guardianInfo: student.Guardian ? {
          name: `${student.Guardian.firstName} ${student.Guardian.lastName}`,
          email: student.Guardian.email,
          phone: student.Guardian.phoneNumber,
          relationship: student.Guardian.relationshipToStudent
        } : null,
        
        // Academic info
        academicInfo: {
          totalSubjects: student.StudentSchedules.length,
          currentEnrollment: student.StudentSchedules.length,
          sectionName: sectionInfo?.sectionName || 'Not Assigned',
          sectionCode: sectionInfo?.sectionId?.toString() || '',
          instructor: 'TBD'
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

    const response = {
      students: transformedStudents,
      pagination: {
        page,
        pageSize,
        totalCount,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      },
      filters: {
        departmentId,
        courseId,
        yearLevel,
        status,
        startDate,
        endDate,
        search
      }
    };

    // Cache the response
    cache.set(cacheKey, {
      data: response,
      timestamp: Date.now()
    });

    console.log(`Optimized query returned ${transformedStudents.length} students (page ${page}/${totalPages})`);
    
    return NextResponse.json(response);

  } catch (error) {
    console.error('Error in optimized students query:', error);
    return NextResponse.json(
      { error: 'Failed to fetch students data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 