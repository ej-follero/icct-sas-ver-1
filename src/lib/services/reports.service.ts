import { prisma } from '@/lib/prisma';

export interface ReportsSummary {
  totalReports: number;
  generatedToday: number;
  activeUsers: number;
  systemStatus: string;
}

export interface StudentAttendanceData {
  id: string;
  studentName: string;
  studentId: string;
  department: string;
  course: string;
  yearLevel: string;
  attendanceRate: number;
  presentDays: number;
  lateDays: number;
  absentDays: number;
  totalDays: number;
  lastAttendance: string;
}

// Instructor attendance data removed

export interface RFIDLogData {
  id: string;
  tagId: string;
  studentName: string;
  location: string;
  timeIn: string;
  timeOut: string;
  date: string;
  status: string;
}

export interface CommunicationLogData {
  id: string;
  type: string;
  title: string;
  sender: string;
  recipients: string;
  date: string;
  status: string;
  readCount: number;
}

export class ReportsService {
  /**
   * Get summary statistics for the reports dashboard
   */
  static async getSummary(): Promise<ReportsSummary> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [
      totalReports,
      generatedToday,
      activeUsers,
      systemLogs
    ] = await Promise.all([
      prisma.reportLog.count(),
      prisma.reportLog.count({
        where: {
          createdAt: {
            gte: today,
            lt: tomorrow
          }
        }
      }),
      prisma.user.count({
        where: {
          status: 'ACTIVE'
        }
      }),
      prisma.systemLogs.findMany({
        where: {
          timestamp: {
            gte: new Date(Date.now() - 5 * 60 * 1000) // Last 5 minutes
          }
        },
        orderBy: {
          timestamp: 'desc'
        },
        take: 10
      })
    ]);

    const hasRecentErrors = systemLogs.some(log => 
      log.actionType === 'ERROR' || log.actionType === 'FATAL'
    );
    
    const systemStatus = hasRecentErrors ? 'Issues Detected' : 'Online';

    return {
      totalReports,
      generatedToday,
      activeUsers,
      systemStatus
    };
  }

  /**
   * Get student attendance data for reports
   */
  static async getStudentAttendanceData(): Promise<StudentAttendanceData[]> {
    const students = await prisma.student.findMany({
      where: {
        status: 'ACTIVE'
      },
      include: {
        Attendance: {
          where: {
            timestamp: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
            }
          }
        },
        Department: {
          select: {
            departmentName: true
          }
        },
        CourseOffering: {
          select: {
            courseName: true
          }
        }
      },
      take: 50 // Limit for performance
    });

    return students.map(student => {
      const attendance = student.Attendance;
      const presentDays = attendance.filter(a => a.status === 'PRESENT').length;
      const lateDays = attendance.filter(a => a.status === 'LATE').length;
      const absentDays = attendance.filter(a => a.status === 'ABSENT').length;
      const totalDays = attendance.length;
      const attendanceRate = totalDays > 0 ? (presentDays / totalDays) * 100 : 0;
      
      const lastAttendance = attendance.length > 0 
        ? attendance.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0].timestamp.toISOString().split('T')[0]
        : 'N/A';

      return {
        id: student.studentId.toString(),
        studentName: `${student.firstName} ${student.lastName}`,
        studentId: student.studentIdNum,
        department: student.Department?.departmentName || 'N/A',
        course: student.CourseOffering?.courseName || 'N/A',
        yearLevel: student.yearLevel,
        attendanceRate: Math.round(attendanceRate * 100) / 100,
        presentDays,
        lateDays,
        absentDays,
        totalDays,
        lastAttendance
      };
    });
  }

  // Instructor attendance data retrieval removed

  /**
   * Get RFID logs data for reports
   */
  static async getRFIDLogsData(): Promise<RFIDLogData[]> {
    const rfidLogs = await prisma.rFIDLogs.findMany({
      where: {
        timestamp: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
        }
      },
      include: {
        reader: {
          select: {
            deviceName: true,
            roomId: true
          }
        },
        user: {
          select: {
            email: true,
            userName: true,
            role: true
          }
        }
      },
      orderBy: {
        timestamp: 'desc'
      },
      take: 100 // Limit for performance
    });

    return rfidLogs.map(log => ({
      id: log.logsId.toString(),
      tagId: log.rfidTag,
      studentName: log.user?.userName || log.user?.email || 'Unknown',
      location: log.location || 'N/A',
      timeIn: new Date(log.timestamp).toTimeString().slice(0,8),
      timeOut: 'N/A',
      date: log.timestamp.toISOString().split('T')[0],
      status: log.scanStatus
    }));
  }

  /**
   * Get communication logs data for reports
   */
  static async getCommunicationLogsData(): Promise<CommunicationLogData[]> {
    const announcements = await prisma.announcement.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
        }
      },
      include: {
        instructor: {
          select: {
            firstName: true,
            lastName: true
          }
        },
        admin: {
          select: {
            email: true,
            userName: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 50 // Limit for performance
    });

    return announcements.map(announcement => ({
      id: announcement.announcementId.toString(),
      type: 'Announcement',
      title: announcement.title,
      sender: announcement.instructor 
        ? `${announcement.instructor.firstName} ${announcement.instructor.lastName}` 
        : (announcement.admin?.userName || announcement.admin?.email || 'System'),
      recipients: announcement.isGeneral ? 'All Users' : (announcement.sectionId ? 'Section' : (announcement.subjectId ? 'Subject' : 'Targeted')),
      date: announcement.createdAt.toISOString().split('T')[0],
      status: announcement.status === 'ACTIVE' ? 'Sent' : 'Draft',
      readCount: Math.floor(Math.random() * 200) + 50 // Mock read count
    }));
  }
}
