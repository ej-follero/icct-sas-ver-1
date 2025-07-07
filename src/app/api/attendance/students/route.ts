import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const departmentId = searchParams.get('departmentId');
    const courseId = searchParams.get('courseId');
    const yearLevel = searchParams.get('yearLevel');
    const status = searchParams.get('status');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    console.log('Fetching students with attendance data. Filters:', {
      departmentId,
      courseId,
      yearLevel,
      status,
      startDate,
      endDate
    });

    // Build where clause for students
    const studentWhere: any = {};
    
    if (departmentId) {
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

    // Define the type for students with all relations
    type StudentWithRelations = Prisma.StudentGetPayload<{
      include: {
        User: true,
        Department: true,
        CourseOffering: true,
        Guardian: true,
        StudentSection: {
          include: {
            Section: true
          }
        },
        StudentSchedules: {
          include: {
            schedule: {
              include: {
                subject: true,
                instructor: true,
                room: true
              }
            }
          }
        },
        Attendance: true
      }
    }>;

    // Fetch students with their attendance records
    const students: StudentWithRelations[] = await prisma.student.findMany({
      where: studentWhere,
      include: {
        User: true,
        Department: true,
        CourseOffering: true,
        Guardian: true,
        StudentSection: {
          include: {
            Section: true
          }
        },
        StudentSchedules: {
          include: {
            schedule: {
              include: {
                subject: true,
                instructor: true,
                room: true
              }
            }
          }
        },
        Attendance: {
          where: attendanceWhere,
          orderBy: {
            timestamp: 'desc'
          }
        }
      },
      orderBy: {
        lastName: 'asc'
      }
    });

    console.log(`Found ${students.length} students`);

    // Transform students with calculated attendance statistics
    const transformedStudents = students.map(student => {
      const attendanceRecords = Array.isArray(student.Attendance) ? student.Attendance : [];
      
      // Calculate attendance statistics
      const totalDays = attendanceRecords.length;
      const presentCount = attendanceRecords.filter((a) => a.status === 'PRESENT').length;
      const lateCount = attendanceRecords.filter((a) => a.status === 'LATE').length;
      const absentCount = attendanceRecords.filter((a) => a.status === 'ABSENT').length;
      const excusedCount = attendanceRecords.filter((a) => a.status === 'EXCUSED').length;
      
      const attendanceRate = totalDays > 0 ? 
        Math.round(((presentCount + lateCount) / totalDays) * 100 * 10) / 10 : 0;

      // Get last attendance record
      const lastAttendance = attendanceRecords[0]; // Already ordered by timestamp desc
      
      // Calculate trend (simplified - comparing last 7 days vs previous 7 days)
      const last7Days = attendanceRecords.slice(0, 7);
      const previous7Days = attendanceRecords.slice(7, 14);
      const last7Rate = last7Days.length > 0 ? 
        ((last7Days.filter(a => a.status === 'PRESENT' || a.status === 'LATE').length / last7Days.length) * 100) : 0;
      const previous7Rate = previous7Days.length > 0 ? 
        ((previous7Days.filter(a => a.status === 'PRESENT' || a.status === 'LATE').length / previous7Days.length) * 100) : 0;
      const trend = last7Rate - previous7Rate;

      // Calculate risk level based on attendance patterns
      const calculateRiskLevel = (rate: number, recentAbsences: number, trendValue: number) => {
        if (rate >= 90 && trendValue >= 0) return 'NONE';
        if (rate >= 75 && trendValue >= -2) return 'LOW';
        if (rate >= 60 && trendValue >= -5) return 'MEDIUM';
        return 'HIGH';
      };
      
      const recentAbsences = attendanceRecords.slice(0, 7).filter(a => a.status === 'ABSENT').length;
      const riskLevel = calculateRiskLevel(attendanceRate, recentAbsences, trend);

      // Get section information
      const activeSection = student.StudentSection?.find(ss => ss.enrollmentStatus === 'ACTIVE');
      const sectionInfo = activeSection?.Section;
      
      // Calculate section-based attendance
      const sectionAttendance = activeSection ? 
        attendanceRecords.filter(a => {
          // Filter attendance records for this specific section
          // This would need to be enhanced based on how attendance is linked to sections
          return true; // Placeholder - would need proper section filtering
        }) : [];
      
      const sectionPresentCount = sectionAttendance.filter(a => a.status === 'PRESENT').length;
      const sectionTotalCount = sectionAttendance.length;
      const sectionAttendanceRate = sectionTotalCount > 0 ? 
        Math.round(((sectionPresentCount) / sectionTotalCount) * 100 * 10) / 10 : 0;

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
        department: student.Department?.departmentName || 'Unknown',
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
        subjects: Array.isArray(student.StudentSchedules) ? student.StudentSchedules.map((ss) => ({
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
        })) : [],
        
        // Section Information
        sectionInfo: sectionInfo ? {
          sectionName: sectionInfo.sectionName || 'Unknown Section',
          sectionCode: sectionInfo.sectionId?.toString() || 'N/A',
          instructor: null, // No direct instructor on Section
          enrollmentDate: activeSection?.enrollmentDate?.toISOString() || new Date().toISOString(),
          sectionStatus: activeSection?.enrollmentStatus || 'UNKNOWN'
        } : null,
        
        // Section-based attendance
        sectionAttendanceRate: sectionAttendanceRate,
        sectionPresentDays: sectionPresentCount,
        sectionTotalDays: sectionTotalCount,
        
        // Attendance statistics
        presentDays: presentCount,
        absentDays: absentCount,
        lateDays: lateCount,
        excusedDays: excusedCount,
        totalDays: totalDays,
        attendanceRate: attendanceRate,
        
        // Last attendance info
        lastAttendance: lastAttendance?.timestamp?.toISOString() || new Date().toISOString(),
        lastAttendanceStatus: lastAttendance?.status || 'ABSENT',
        lastAttendanceType: lastAttendance?.attendanceType || 'REGULAR',
        lastVerificationStatus: lastAttendance?.verification || 'PENDING',
        lastCheckInTime: lastAttendance?.timestamp?.toISOString() || '',
        lastCheckOutTime: lastAttendance?.checkOutTime?.toISOString() || '',
        lastDuration: lastAttendance?.checkOutTime && lastAttendance?.timestamp ? 
          Math.round((new Date(lastAttendance.checkOutTime).getTime() - new Date(lastAttendance.timestamp).getTime()) / (1000 * 60)) : 0,
        lastLocation: 'Room TBD', // Would need to join with room/schedule data
        
        // Additional calculated fields
        trend: Math.round(trend * 10) / 10,
        riskLevel: riskLevel,
        riskFactors: {
          attendanceRate: attendanceRate,
          recentAbsences: recentAbsences,
          trend: Math.round(trend * 10) / 10,
          consecutiveAbsences: attendanceRecords.findIndex(a => a.status !== 'ABSENT') || 0
        },
        
        // Subject attendance would require additional queries
        subjectAttendance: {},
        
        // Detailed attendance history
        attendanceHistory: attendanceRecords.slice(0, 30).map(record => ({
          attendanceId: record.attendanceId,
          timestamp: record.timestamp.toISOString(),
        status: record.status,
          attendanceType: record.attendanceType,
          verification: record.verification,
          checkOutTime: record.checkOutTime?.toISOString(),
          duration: record.duration,
          location: record.location,
          notes: record.notes,
          deviceInfo: record.deviceInfo,
          verifiedBy: record.verifiedBy,
          verificationTime: record.verificationTime?.toISOString(),
          verificationNotes: record.verificationNotes
        })),
        
        // Guardian info
        guardianInfo: student.Guardian ? {
          name: `${student.Guardian.firstName} ${student.Guardian.lastName}`,
          email: student.Guardian.email,
          phone: student.Guardian.phoneNumber,
          relationship: student.Guardian.relationshipToStudent
        } : null,
        
        // Academic info
        academicInfo: {
          totalSubjects: Array.isArray(student.StudentSchedules) ? student.StudentSchedules.length : 0,
          currentEnrollment: Array.isArray(student.StudentSchedules) ? student.StudentSchedules.length : 0,
          sectionName: sectionInfo?.sectionName || 'Not Assigned',
          sectionCode: sectionInfo?.sectionId?.toString() || '',
          instructor: 'TBD' // No direct instructor on Section
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
        avatarUrl: null, // Would need to be added to Student model
        enrollmentStatus: student.status,
        lastDeviceInfo: null,
        recentAttendanceRecords: attendanceRecords.slice(0, 10).map(record => ({
          attendanceId: record.attendanceId,
          timestamp: record.timestamp.toISOString(),
          status: record.status,
          attendanceType: record.attendanceType,
          verification: record.verification,
          checkOutTime: record.checkOutTime?.toISOString(),
          duration: record.duration,
          location: record.location,
          notes: record.notes
        })),
        createdAt: student.createdAt?.toISOString(),
        updatedAt: student.updatedAt?.toISOString(),
        lastLogin: student.User?.lastLogin?.toISOString()
      };
    });

    console.log(`Transformed ${transformedStudents.length} students with attendance data`);
    
    return NextResponse.json({
      students: transformedStudents,
      total: transformedStudents.length,
      filters: {
        departmentId,
        courseId,
        yearLevel,
        status,
        startDate,
        endDate
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