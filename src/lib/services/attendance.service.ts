import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export interface AttendanceFilters {
  departmentId?: number;
  departmentCode?: string;
  courseId?: number;
  yearLevel?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  studentType?: string;
  enrollmentStatus?: string;
  attendanceRate?: string;
  riskLevel?: string;
  subjects?: string[];
  instructors?: string[];
  rooms?: string[];
  scheduleDays?: string[];
  scheduleTimes?: string[];
}

export interface PaginationOptions {
  page: number;
  pageSize: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface StudentWithStats {
  id: string;
  studentName: string;
  studentId: string;
  firstName: string;
  lastName: string;
  email: string;
  department: string;
  course: string;
  yearLevel: string;
  status: string;
  attendanceRate: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  excusedDays: number;
  totalDays: number;
  riskLevel: string;
  subjects: Array<{
    subjectName: string;
    subjectCode: string;
    instructor: string;
    room: string;
    schedule: {
      dayOfWeek: string;
      startTime: string;
      endTime: string;
    };
  }>;
  guardianInfo?: {
    name: string;
    email: string;
    phone: string;
    relationship: string;
  };
}

export class AttendanceService {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  async getStudentsWithAttendance(
    filters: AttendanceFilters = {},
    pagination: PaginationOptions = { page: 1, pageSize: 25 }
  ): Promise<{
    students: StudentWithStats[];
    pagination: {
      page: number;
      pageSize: number;
      totalCount: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
    filters: AttendanceFilters;
  }> {
    const cacheKey = this.generateCacheKey(filters, pagination);
    
    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      console.log('Returning cached data for:', cacheKey);
      return cached.data;
    }

    console.log('Executing optimized query with filters:', filters);

    // Build optimized where clause
    const studentWhere = this.buildStudentWhereClause(filters);
    const attendanceWhere = this.buildAttendanceWhereClause(filters);

    // Get total count for pagination
    const totalCount = await prisma.student.count({
      where: studentWhere
    });

    // Calculate pagination
    const skip = (pagination.page - 1) * pagination.pageSize;
    const totalPages = Math.ceil(totalCount / pagination.pageSize);

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
        }
      },
      orderBy: this.buildOrderByClause(pagination.sortBy, pagination.sortOrder),
      skip,
      take: pagination.pageSize
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
      const attendanceCounts = this.calculateAttendanceCounts(student.studentId, attendanceData);
      const attendanceRate = this.calculateAttendanceRate(attendanceCounts);
      const riskLevel = this.calculateRiskLevel(attendanceRate);

      return {
        id: student.studentId.toString(),
        studentName: `${student.firstName} ${student.middleName ? student.middleName + ' ' : ''}${student.lastName}${student.suffix ? ' ' + student.suffix : ''}`,
        studentId: student.studentIdNum,
        firstName: student.firstName,
        lastName: student.lastName,
        email: student.email,
        department: student.Department ? `${student.Department.departmentCode} - ${student.Department.departmentName}` : 'Unknown',
        course: student.CourseOffering?.courseName || 'Unknown',
        yearLevel: student.yearLevel,
        status: student.status,
        attendanceRate,
        presentDays: attendanceCounts.present,
        absentDays: attendanceCounts.absent,
        lateDays: attendanceCounts.late,
        excusedDays: attendanceCounts.excused,
        totalDays: attendanceCounts.total,
        riskLevel,
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
          }
        })),
        guardianInfo: student.Guardian ? {
          name: `${student.Guardian.firstName} ${student.Guardian.lastName}`,
          email: student.Guardian.email,
          phone: student.Guardian.phoneNumber,
          relationship: student.Guardian.relationshipToStudent
        } : undefined
      };
    });

    const result = {
      students: transformedStudents,
      pagination: {
        page: pagination.page,
        pageSize: pagination.pageSize,
        totalCount,
        totalPages,
        hasNext: pagination.page < totalPages,
        hasPrev: pagination.page > 1
      },
      filters
    };

    // Cache the result
    this.cache.set(cacheKey, {
      data: result,
      timestamp: Date.now()
    });

    console.log(`Optimized query returned ${transformedStudents.length} students (page ${pagination.page}/${totalPages})`);
    
    return result;
  }

  async getStudentStats(studentId: number, dateRange?: { start: string; end: string }) {
    const attendanceWhere: Prisma.AttendanceWhereInput = {
      studentId,
      ...(dateRange && {
        timestamp: {
          gte: new Date(dateRange.start),
          lte: new Date(dateRange.end)
        }
      })
    };

    const attendanceData = await prisma.attendance.groupBy({
      by: ['status'],
      where: attendanceWhere,
      _count: {
        status: true
      }
    });

    const counts = {
      present: 0,
      late: 0,
      absent: 0,
      excused: 0
    };

    attendanceData.forEach(item => {
      counts[item.status.toLowerCase() as keyof typeof counts] = item._count.status;
    });

    const total = Object.values(counts).reduce((sum, count) => sum + count, 0);
    const attendanceRate = total > 0 ? Math.round(((counts.present + counts.late) / total) * 100 * 10) / 10 : 0;

    return {
      studentId,
      attendanceRate,
      ...counts,
      total,
      riskLevel: this.calculateRiskLevel(attendanceRate)
    };
  }

  async getAttendanceAnalytics(filters: AttendanceFilters = {}) {
    const studentWhere = this.buildStudentWhereClause(filters);
    const attendanceWhere = this.buildAttendanceWhereClause(filters);

    // Get department breakdown
    const departmentStats = await prisma.student.groupBy({
      by: ['departmentId'],
      where: studentWhere,
      _count: {
        studentId: true
      }
    });

    // Get attendance trends
    const attendanceTrends = await prisma.attendance.groupBy({
      by: ['status', 'timestamp'],
      where: attendanceWhere,
      _count: {
        status: true
      }
    });

    return {
      departmentStats,
      attendanceTrends,
      totalStudents: await prisma.student.count({ where: studentWhere }),
      averageAttendanceRate: await this.calculateAverageAttendanceRate(studentWhere, attendanceWhere)
    };
  }

  private buildStudentWhereClause(filters: AttendanceFilters): Prisma.StudentWhereInput {
    const where: Prisma.StudentWhereInput = {};

    if (filters.departmentCode) {
      where.Department = {
        departmentCode: filters.departmentCode
      };
    } else if (filters.departmentId) {
      where.departmentId = filters.departmentId;
    }

    if (filters.courseId) {
      where.courseId = filters.courseId;
    }

    if (filters.yearLevel) {
      where.yearLevel = filters.yearLevel as any;
    }

    if (filters.status) {
      where.status = filters.status as any;
    }

    if (filters.studentType) {
      where.studentType = filters.studentType as any;
    }

    if (filters.search) {
      where.OR = [
        { firstName: { contains: filters.search, mode: 'insensitive' } },
        { lastName: { contains: filters.search, mode: 'insensitive' } },
        { studentIdNum: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
        { Department: { departmentName: { contains: filters.search, mode: 'insensitive' } } },
        { CourseOffering: { courseName: { contains: filters.search, mode: 'insensitive' } } }
      ];
    }

    return where;
  }

  private buildAttendanceWhereClause(filters: AttendanceFilters): Prisma.AttendanceWhereInput {
    const where: Prisma.AttendanceWhereInput = {};

    if (filters.startDate && filters.endDate) {
      const start = new Date(filters.startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(filters.endDate);
      end.setHours(23, 59, 59, 999);
      where.timestamp = {
        gte: start,
        lte: end
      };
    }

    return where;
  }

  private buildOrderByClause(sortBy?: string, sortOrder: 'asc' | 'desc' = 'asc'): Prisma.StudentOrderByWithRelationInput {
    switch (sortBy) {
      case 'name':
        return { firstName: sortOrder };
      case 'id':
        return { studentIdNum: sortOrder };
      case 'department':
        return { Department: { departmentName: sortOrder } };
      case 'course':
        return { CourseOffering: { courseName: sortOrder } };
      case 'yearLevel':
        return { yearLevel: sortOrder };
      case 'status':
        return { status: sortOrder };
      default:
        return { lastName: 'asc' };
    }
  }

  private calculateAttendanceCounts(studentId: number, attendanceData: any[]) {
    const studentAttendance = attendanceData.filter(a => a.studentId === studentId);
    const counts = {
      present: 0,
      late: 0,
      absent: 0,
      excused: 0,
      total: 0
    };

    studentAttendance.forEach(item => {
      const status = item.status.toLowerCase() as keyof typeof counts;
      if (status in counts) {
        counts[status] = item._count.status;
      }
    });

    counts.total = Object.values(counts).reduce((sum, count) => sum + count, 0);
    return counts;
  }

  private calculateAttendanceRate(counts: { present: number; late: number; absent: number; excused: number; total: number }): number {
    return counts.total > 0 ? 
      Math.round(((counts.present + counts.late) / counts.total) * 100 * 10) / 10 : 0;
  }

  private calculateRiskLevel(attendanceRate: number): string {
    if (attendanceRate >= 90) return 'NONE';
    if (attendanceRate >= 75) return 'LOW';
    if (attendanceRate >= 60) return 'MEDIUM';
    return 'HIGH';
  }

  private generateCacheKey(filters: AttendanceFilters, pagination: PaginationOptions): string {
    return `students:${JSON.stringify(filters)}:${JSON.stringify(pagination)}`;
  }

  private async calculateAverageAttendanceRate(
    studentWhere: Prisma.StudentWhereInput,
    attendanceWhere: Prisma.AttendanceWhereInput
  ): Promise<number> {
    // This would need to be implemented with a more complex query
    // For now, returning a placeholder
    return 85.5;
  }

  // Cache management methods
  clearCache(): void {
    this.cache.clear();
  }

  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
} 