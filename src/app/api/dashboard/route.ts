import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '7d'; // 1d, 7d, 30d, 90d

    // Calculate date ranges
    const now = new Date();
    const getDateRange = (period: string) => {
      switch (period) {
        case '1d':
          return new Date(now.getTime() - 24 * 60 * 60 * 1000);
        case '7d':
          return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        case '30d':
          return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        case '90d':
          return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        default:
          return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      }
    };

    const startDate = getDateRange(period);
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Fetch all dashboard data in parallel
    const [
      // User Statistics
      totalUsers,
      activeUsers,
      totalStudents,
      activeStudents,
      totalInstructors,
      activeInstructors,
      totalGuardians,
      activeGuardians,

      // Course & Academic Statistics
      totalCourses,
      activeCourses,
      totalDepartments,
      activeDepartments,
      totalSections,
      activeSections,
      totalSubjects,
      activeSubjects,

      // Attendance Statistics
      totalAttendanceRecords,
      todayAttendanceRecords,
      periodAttendanceRecords,
      attendanceByStatus,
      attendanceByDepartment,

      // RFID Statistics
      totalRFIDTags,
      activeRFIDTags,
      totalRFIDReaders,
      activeRFIDReaders,
      totalRFIDScans,
      todayRFIDScans,
      periodRFIDScans,

      // System Statistics
      totalEvents,
      activeEvents,
      totalAnnouncements,
      activeAnnouncements,
      totalEmails,
      unreadEmails,
      failedEmails,

      // Recent Activity
      recentAttendance,
      recentRFIDScans,
      recentSystemLogs,
      recentAnnouncements,
      recentEvents,

      // Security & Alerts
      securityAlerts,
      unresolvedSecurityAlerts,
      recentSecurityLogs,

      // Backup Statistics
      totalBackups,
      recentBackups,
      backupStatus
    ] = await Promise.all([
      // User Statistics
      prisma.user.count(),
      prisma.user.count({ where: { status: 'ACTIVE' } }),
      prisma.student.count(),
      prisma.student.count({ where: { status: 'ACTIVE' } }),
      prisma.instructor.count(),
      prisma.instructor.count({ where: { status: 'ACTIVE' } }),
      prisma.guardian.count(),
      prisma.guardian.count({ where: { status: 'ACTIVE' } }),

      // Course & Academic Statistics
      prisma.courseOffering.count(),
      prisma.courseOffering.count({ where: { courseStatus: 'ACTIVE' } }),
      prisma.department.count(),
      prisma.department.count({ where: { departmentStatus: 'ACTIVE' } }),
      prisma.section.count(),
      prisma.section.count({ where: { sectionStatus: 'ACTIVE' } }),
      prisma.subjects.count(),
      prisma.subjects.count({ where: { status: 'ACTIVE' } }),

      // Attendance Statistics
      prisma.attendance.count(),
      prisma.attendance.count({
        where: { timestamp: { gte: todayStart } }
      }),
      prisma.attendance.count({
        where: { timestamp: { gte: startDate } }
      }),
      prisma.attendance.groupBy({
        by: ['status'],
        _count: { status: true },
        where: { timestamp: { gte: startDate } }
      }),
      prisma.attendance.groupBy({
        by: ['userRole'],
        _count: { userRole: true },
        where: { timestamp: { gte: startDate } }
      }),

      // RFID Statistics
      prisma.rFIDTags.count(),
      prisma.rFIDTags.count({ where: { status: 'ACTIVE' } }),
      prisma.rFIDReader.count(),
      prisma.rFIDReader.count({ where: { status: 'ACTIVE' } }),
      prisma.rFIDLogs.count(),
      prisma.rFIDLogs.count({
        where: { timestamp: { gte: todayStart } }
      }),
      prisma.rFIDLogs.count({
        where: { timestamp: { gte: startDate } }
      }),

      // System Statistics
      prisma.event.count({ where: { deletedAt: null } }),
      prisma.event.count({ 
        where: { 
          deletedAt: null,
          status: { in: ['SCHEDULED', 'ONGOING'] }
        }
      }),
      prisma.announcement.count({ where: { status: 'ACTIVE' } }),
      prisma.announcement.count({ 
        where: { 
          status: 'ACTIVE',
          createdAt: { gte: startDate }
        }
      }),
      prisma.email.count(),
      prisma.email.count({ where: { isRead: false } }),
      prisma.email.count({ where: { status: 'FAILED' } }),

      // Recent Activity
      prisma.attendance.findMany({
        take: 10,
        orderBy: { timestamp: 'desc' },
        include: {
          student: {
            select: { firstName: true, lastName: true, studentIdNum: true }
          },
          instructor: {
            select: { firstName: true, lastName: true }
          },
          user: {
            select: { userName: true, role: true }
          }
        }
      }),
      prisma.rFIDLogs.findMany({
        take: 10,
        orderBy: { timestamp: 'desc' },
        include: {
          reader: {
            select: { deviceName: true, roomId: true }
          },
          user: {
            select: { userName: true, role: true }
          }
        }
      }),
      prisma.systemLogs.findMany({
        take: 10,
        orderBy: { timestamp: 'desc' },
        include: {
          user: {
            select: { userName: true, role: true }
          }
        }
      }),
      prisma.announcement.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        where: { status: 'ACTIVE' },
        include: {
          admin: {
            select: { userName: true }
          }
        }
      }),
      prisma.event.findMany({
        take: 5,
        orderBy: { eventDate: 'asc' },
        where: { 
          deletedAt: null,
          eventDate: { gte: now }
        },
        include: {
          createdByAdmin: {
            select: { userName: true }
          }
        }
      }),

      // Security & Alerts
      prisma.securityAlert.count(),
      prisma.securityAlert.count({ where: { resolved: false } }),
      prisma.securityLog.findMany({
        take: 5,
        orderBy: { timestamp: 'desc' },
        where: { resolved: false },
        include: {
          user: {
            select: { userName: true, role: true }
          }
        }
      }),

      // Backup Statistics
      prisma.systemBackup.count(),
      prisma.systemBackup.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.systemBackup.groupBy({
        by: ['status'],
        _count: { status: true }
      })
    ]);

    // Calculate attendance rate
    const totalPeriodAttendance = attendanceByStatus.reduce((sum, item) => sum + item._count.status, 0);
    const presentCount = attendanceByStatus.find(item => item.status === 'PRESENT')?._count.status || 0;
    const attendanceRate = totalPeriodAttendance > 0 ? (presentCount / totalPeriodAttendance) * 100 : 0;

    // Calculate RFID scan success rate
    const totalPeriodScans = periodRFIDScans;
    const successfulScans = await prisma.rFIDLogs.count({
      where: {
        timestamp: { gte: startDate },
        scanStatus: 'SUCCESS'
      }
    });
    const scanSuccessRate = totalPeriodScans > 0 ? (successfulScans / totalPeriodScans) * 100 : 0;

    // Prepare chart data
    const attendanceTrends = await getAttendanceTrends(startDate, now);
    const departmentPerformance = await getDepartmentPerformance(startDate);
    const rfidActivity = await getRFIDActivity(startDate, now);

    // System health indicators
    const systemHealth = {
      database: 'HEALTHY', // Could be enhanced with actual health checks
      rfidSystem: activeRFIDReaders > 0 ? 'HEALTHY' : 'WARNING',
      emailSystem: failedEmails < 10 ? 'HEALTHY' : 'WARNING',
      security: unresolvedSecurityAlerts < 5 ? 'HEALTHY' : 'WARNING'
    };

    const dashboardData = {
      // Core Statistics
      statistics: {
        users: {
          total: totalUsers,
          active: activeUsers,
          students: { total: totalStudents, active: activeStudents },
          instructors: { total: totalInstructors, active: activeInstructors },
          guardians: { total: totalGuardians, active: activeGuardians }
        },
        academic: {
          courses: { total: totalCourses, active: activeCourses },
          departments: { total: totalDepartments, active: activeDepartments },
          sections: { total: totalSections, active: activeSections },
          subjects: { total: totalSubjects, active: activeSubjects }
        },
        attendance: {
          total: totalAttendanceRecords,
          today: todayAttendanceRecords,
          period: periodAttendanceRecords,
          rate: Math.round(attendanceRate * 100) / 100,
          byStatus: attendanceByStatus,
          byDepartment: attendanceByDepartment
        },
        rfid: {
          tags: { total: totalRFIDTags, active: activeRFIDTags },
          readers: { total: totalRFIDReaders, active: activeRFIDReaders },
          scans: { total: totalRFIDScans, today: todayRFIDScans, period: periodRFIDScans },
          successRate: Math.round(scanSuccessRate * 100) / 100
        },
        system: {
          events: { total: totalEvents, active: activeEvents },
          announcements: { total: totalAnnouncements, recent: activeAnnouncements },
          emails: { total: totalEmails, unread: unreadEmails, failed: failedEmails },
          backups: { total: totalBackups, status: backupStatus }
        },
        security: {
          alerts: { total: securityAlerts, unresolved: unresolvedSecurityAlerts }
        }
      },

      // Charts and Analytics
      charts: {
        attendanceTrends,
        departmentPerformance,
        rfidActivity
      },

      // Recent Activity
      recentActivity: {
        attendance: recentAttendance,
        rfidScans: recentRFIDScans,
        systemLogs: recentSystemLogs,
        announcements: recentAnnouncements,
        events: recentEvents,
        securityLogs: recentSecurityLogs
      },

      // System Health
      systemHealth,

      // Metadata
      metadata: {
        period,
        generatedAt: now.toISOString(),
        dataRange: { start: startDate.toISOString(), end: now.toISOString() }
      }
    };

    return NextResponse.json(dashboardData);
  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Helper functions for chart data
async function getAttendanceTrends(startDate: Date, endDate: Date) {
  const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const trends = [];

  for (let i = 0; i < days; i++) {
    const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
    const nextDate = new Date(date.getTime() + 24 * 60 * 60 * 1000);

    const [present, absent, late, excused] = await Promise.all([
      prisma.attendance.count({
        where: {
          timestamp: { gte: date, lt: nextDate },
          status: 'PRESENT'
        }
      }),
      prisma.attendance.count({
        where: {
          timestamp: { gte: date, lt: nextDate },
          status: 'ABSENT'
        }
      }),
      prisma.attendance.count({
        where: {
          timestamp: { gte: date, lt: nextDate },
          status: 'LATE'
        }
      }),
      prisma.attendance.count({
        where: {
          timestamp: { gte: date, lt: nextDate },
          status: 'EXCUSED'
        }
      })
    ]);

    trends.push({
      date: date.toISOString().split('T')[0],
      present,
      absent,
      late,
      excused,
      total: present + absent + late + excused
    });
  }

  return trends;
}

async function getDepartmentPerformance(startDate: Date) {
  const departments = await prisma.department.findMany({
    where: { departmentStatus: 'ACTIVE' },
    include: {
      Student: {
        where: { status: 'ACTIVE' }
      },
      CourseOffering: {
        where: { courseStatus: 'ACTIVE' }
      }
    }
  });

  const performance = await Promise.all(
    departments.map(async (dept) => {
      const attendance = await prisma.attendance.groupBy({
        by: ['status'],
        _count: { status: true },
        where: {
          timestamp: { gte: startDate },
          student: {
            departmentId: dept.departmentId
          }
        }
      });

      const totalAttendance = attendance.reduce((sum, item) => sum + item._count.status, 0);
      const presentCount = attendance.find(item => item.status === 'PRESENT')?._count.status || 0;
      const attendanceRate = totalAttendance > 0 ? (presentCount / totalAttendance) * 100 : 0;

      return {
        department: dept.departmentName,
        departmentCode: dept.departmentCode,
        students: dept.Student.length,
        courses: dept.CourseOffering.length,
        attendanceRate: Math.round(attendanceRate * 100) / 100,
        totalAttendance
      };
    })
  );

  return performance.sort((a, b) => b.attendanceRate - a.attendanceRate);
}

async function getRFIDActivity(startDate: Date, endDate: Date) {
  const [scanTrends, readerStatus, tagStatus] = await Promise.all([
    // Scan trends by day
    prisma.rFIDLogs.groupBy({
      by: ['scanStatus'],
      _count: { scanStatus: true },
      where: { timestamp: { gte: startDate } }
    }),
    // Reader status
    prisma.rFIDReader.groupBy({
      by: ['status'],
      _count: { status: true }
    }),
    // Tag status
    prisma.rFIDTags.groupBy({
      by: ['status'],
      _count: { status: true }
    })
  ]);

  return {
    scanTrends,
    readerStatus,
    tagStatus
  };
}
