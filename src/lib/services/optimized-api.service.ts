import { cacheService, CacheKeys, CacheTTL } from './cache.service';
import { prisma } from '@/lib/prisma';

export interface OptimizedQueryOptions {
  useCache?: boolean;
  cacheTTL?: number;
  cacheKey?: string;
}

export class OptimizedApiService {
  
  /**
   * Get students with caching
   */
  async getStudents(options: {
    departmentId?: number;
    courseId?: number;
    status?: string;
    limit?: number;
    offset?: number;
  } = {}, cacheOptions: OptimizedQueryOptions = {}) {
    const { useCache = true, cacheTTL = CacheTTL.MEDIUM } = cacheOptions;
    
    const cacheKey = CacheKeys.studentsByDepartment(options.departmentId || 0) + 
      `:${options.courseId || 0}:${options.status || 'all'}:${options.limit || 50}:${options.offset || 0}`;

    if (useCache) {
      const cached = await cacheService.get(cacheKey);
      if (cached) return cached;
    }

    const students = await prisma.student.findMany({
      where: {
        ...(options.departmentId && { departmentId: options.departmentId }),
        ...(options.courseId && { courseId: options.courseId }),
        ...(options.status && { status: options.status as any }),
      },
      take: options.limit || 50,
      skip: options.offset || 0,
      include: {
        Department: true,
        CourseOffering: true,
        StudentSection: {
          include: {
            Section: true,
          },
        },
      },
    });

    if (useCache) {
      await cacheService.set(cacheKey, students, { ttl: cacheTTL });
    }

    return students;
  }

  /**
   * Get attendance with caching
   */
  async getAttendance(options: {
    studentId?: number;
    sectionId?: number;
    startDate?: Date;
    endDate?: Date;
    status?: string;
    limit?: number;
    offset?: number;
  } = {}, cacheOptions: OptimizedQueryOptions = {}) {
    const { useCache = true, cacheTTL = CacheTTL.SHORT } = cacheOptions;
    
    const cacheKey = `attendance:${JSON.stringify(options)}`;

    if (useCache) {
      const cached = await cacheService.get(cacheKey);
      if (cached) return cached;
    }

    const attendance = await prisma.attendance.findMany({
      where: {
        ...(options.studentId && { studentId: options.studentId }),
        ...(options.sectionId && { 
          subjectSched: {
            sectionId: options.sectionId,
          },
        }),
        ...(options.startDate && options.endDate && {
          timestamp: {
            gte: options.startDate,
            lte: options.endDate,
          },
        }),
        ...(options.status && { status: options.status as any }),
      },
      take: options.limit || 100,
      skip: options.offset || 0,
      include: {
        student: {
          include: {
            Department: true,
            CourseOffering: true,
          },
        },
        subjectSchedule: {
          include: {
            subject: true,
            section: true,
            instructor: true,
            room: true,
          },
        },
      },
      orderBy: {
        timestamp: 'desc',
      },
    });

    if (useCache) {
      await cacheService.set(cacheKey, attendance, { ttl: cacheTTL });
    }

    return attendance;
  }

  /**
   * Get attendance statistics with caching
   */
  async getAttendanceStats(studentId: number, cacheOptions: OptimizedQueryOptions = {}) {
    const { useCache = true, cacheTTL = CacheTTL.MEDIUM } = cacheOptions;
    
    const cacheKey = CacheKeys.attendanceStats(studentId);

    if (useCache) {
      const cached = await cacheService.get(cacheKey);
      if (cached) return cached;
    }

    // Get attendance data for the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const attendance = await prisma.attendance.findMany({
      where: {
        studentId,
        timestamp: {
          gte: thirtyDaysAgo,
        },
      },
      select: {
        status: true,
        timestamp: true,
      },
    });

    // Calculate statistics
    const total = attendance.length;
    const present = attendance.filter(a => a.status === 'PRESENT').length;
    const absent = attendance.filter(a => a.status === 'ABSENT').length;
    const late = attendance.filter(a => a.status === 'LATE').length;
    const attendanceRate = total > 0 ? (present / total) * 100 : 0;

    const stats = {
      total,
      present,
      absent,
      late,
      attendanceRate: Math.round(attendanceRate * 100) / 100,
      period: '30 days',
    };

    if (useCache) {
      await cacheService.set(cacheKey, stats, { ttl: cacheTTL });
    }

    return stats;
  }

  /**
   * Get sections with caching
   */
  async getSections(options: {
    courseId?: number;
    yearLevel?: number;
    status?: string;
    limit?: number;
    offset?: number;
  } = {}, cacheOptions: OptimizedQueryOptions = {}) {
    const { useCache = true, cacheTTL = CacheTTL.LONG } = cacheOptions;
    
    const cacheKey = CacheKeys.sectionsByCourse(options.courseId || 0) + 
      `:${options.yearLevel || 0}:${options.status || 'all'}:${options.limit || 50}:${options.offset || 0}`;

    if (useCache) {
      const cached = await cacheService.get(cacheKey);
      if (cached) return cached;
    }

    const sections = await prisma.section.findMany({
      where: {
        ...(options.courseId && { courseId: options.courseId }),
        ...(options.yearLevel && { yearLevel: options.yearLevel }),
        ...(options.status && { sectionStatus: options.status as any }),
      },
      take: options.limit || 50,
      skip: options.offset || 0,
      include: {
        Course: true,
        StudentSection: {
          include: {
            Student: {
              include: {
                Department: true,
                CourseOffering: true,
              },
            },
          },
        },
        SubjectSchedule: {
          include: {
            subject: true,
            instructor: true,
            room: true,
          },
        },
      },
    });

    if (useCache) {
      await cacheService.set(cacheKey, sections, { ttl: cacheTTL });
    }

    return sections;
  }

  /**
   * Get system statistics with caching
   */
  async getSystemStats(cacheOptions: OptimizedQueryOptions = {}) {
    const { useCache = true, cacheTTL = CacheTTL.SHORT } = cacheOptions;
    
    const cacheKey = CacheKeys.systemStats();

    if (useCache) {
      const cached = await cacheService.get(cacheKey);
      if (cached) return cached;
    }

    // Get counts in parallel
    const [
      totalStudents,
      totalInstructors,
      totalSections,
      totalAttendance,
      recentAttendance,
    ] = await Promise.all([
      prisma.student.count(),
      prisma.instructor.count(),
      prisma.section.count(),
      prisma.attendance.count(),
      prisma.attendance.count({
        where: {
          timestamp: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
          },
        },
      }),
    ]);

    const stats = {
      totalStudents,
      totalInstructors,
      totalSections,
      totalAttendance,
      recentAttendance,
      lastUpdated: new Date().toISOString(),
    };

    if (useCache) {
      await cacheService.set(cacheKey, stats, { ttl: cacheTTL });
    }

    return stats;
  }

  /**
   * Get analytics data with caching
   */
  async getAnalytics(type: string, filters: Record<string, any> = {}, cacheOptions: OptimizedQueryOptions = {}) {
    const { useCache = true, cacheTTL = CacheTTL.MEDIUM } = cacheOptions;
    
    const cacheKey = CacheKeys.analytics(type, filters);

    if (useCache) {
      const cached = await cacheService.get(cacheKey);
      if (cached) return cached;
    }

    let analytics;

    switch (type) {
      case 'attendance_trends':
        analytics = await this.getAttendanceTrends(filters);
        break;
      case 'department_stats':
        analytics = await this.getDepartmentStats(filters);
        break;
      case 'student_performance':
        analytics = await this.getStudentPerformance(filters);
        break;
      default:
        throw new Error(`Unknown analytics type: ${type}`);
    }

    if (useCache) {
      await cacheService.set(cacheKey, analytics, { ttl: cacheTTL });
    }

    return analytics;
  }

  /**
   * Invalidate cache for specific entities
   */
  async invalidateStudentCache(studentId: number) {
    await cacheService.invalidatePattern(`student:${studentId}*`);
    await cacheService.invalidatePattern(`attendance:student:${studentId}*`);
    await cacheService.invalidatePattern(`attendance:stats:${studentId}*`);
  }

  async invalidateSectionCache(sectionId: number) {
    await cacheService.invalidatePattern(`section:${sectionId}*`);
    await cacheService.invalidatePattern(`attendance:section:${sectionId}*`);
  }

  async invalidateSystemCache() {
    await cacheService.invalidatePattern('system:*');
    await cacheService.invalidatePattern('analytics:*');
  }

  // Private helper methods for analytics
  private async getAttendanceTrends(filters: Record<string, any>) {
    // Implementation for attendance trends analytics
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const trends = await prisma.attendance.groupBy({
      by: ['timestamp'],
      where: {
        timestamp: {
          gte: thirtyDaysAgo,
        },
        ...(filters.studentId && { studentId: filters.studentId }),
        ...(filters.sectionId && { 
          subjectSched: {
            sectionId: filters.sectionId,
          },
        }),
      },
      _count: {
        attendanceId: true,
      },
      _avg: {
        // No numeric fields to average in attendance table
      },
    });

    return {
      type: 'attendance_trends',
      data: trends,
      period: '30 days',
    };
  }

  private async getDepartmentStats(filters: Record<string, any>) {
    const departments = await prisma.department.findMany({
      include: {
        Student: {
          include: {
            Attendance: {
              where: {
                timestamp: {
                  gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                },
              },
            },
          },
        },
      },
    });

    return {
      type: 'department_stats',
      data: departments.map(dept => ({
        departmentId: dept.departmentId,
        departmentName: dept.departmentName,
        studentCount: dept.Student.length,
        totalAttendance: dept.Student.reduce((sum: number, student: any) => sum + student.Attendance.length, 0),
      })),
    };
  }

  private async getStudentPerformance(filters: Record<string, any>) {
    const students = await prisma.student.findMany({
      where: {
        ...(filters.departmentId && { departmentId: filters.departmentId }),
        ...(filters.courseId && { courseId: filters.courseId }),
      },
      include: {
        Attendance: {
          where: {
            timestamp: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            },
          },
        },
      },
    });

    return {
      type: 'student_performance',
      data: students.map(student => {
        const totalAttendance = student.Attendance.length;
        const presentCount = student.Attendance.filter((a: any) => a.status === 'PRESENT').length;
        const attendanceRate = totalAttendance > 0 ? (presentCount / totalAttendance) * 100 : 0;

        return {
          studentId: student.studentId,
          studentName: `${student.firstName} ${student.lastName}`,
          totalAttendance,
          presentCount,
          attendanceRate: Math.round(attendanceRate * 100) / 100,
        };
      }),
    };
  }
}

// Singleton instance
export const optimizedApiService = new OptimizedApiService();
