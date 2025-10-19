import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/attendance/live-feed
// Query params: limit, offset, startDate, endDate, studentId, subjectId
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const studentId = searchParams.get('studentId');
    const subjectId = searchParams.get('subjectId');
    const readerId = searchParams.get('readerId');
    const roomId = searchParams.get('roomId');
    const building = searchParams.get('building');
    const status = searchParams.get('status');
    const department = searchParams.get('department');
    const course = searchParams.get('course');
    const timeRange = searchParams.get('timeRange');
    const date = searchParams.get('date');
    const currentDay = searchParams.get('currentDay');

    // Build where clause
    const where: any = {
      attendanceType: 'RFID_SCAN'
    };

    if (currentDay === 'true' && date) {
      // Filter for specific date (current day)
      const targetDate = new Date(date);
      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);
      
      where.timestamp = {
        gte: startOfDay,
        lte: endOfDay
      };
    } else if (startDate && endDate) {
      where.timestamp = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    } else {
      // Default to last 24 hours
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      where.timestamp = { gte: yesterday };
    }

    if (studentId) {
      where.studentId = parseInt(studentId);
    }

    if (subjectId) {
      where.subjectSchedId = parseInt(subjectId);
    }

    if (status) {
      where.status = status;
    }

    // RFID Reader filtering
    if (readerId) {
      where.rfidLog = {
        readerId: parseInt(readerId)
      };
    }

    if (roomId) {
      where.rfidLog = {
        ...where.rfidLog,
        reader: {
          roomId: parseInt(roomId)
        }
      };
    }

    if (building) {
      where.rfidLog = {
        ...where.rfidLog,
        reader: {
          ...where.rfidLog?.reader,
          room: {
            roomBuildingLoc: building
          }
        }
      };
    }

    // Department filtering
    if (department) {
      where.student = {
        Department: {
          departmentName: department
        }
      };
    }

    // Course filtering
    if (course) {
      where.student = {
        ...where.student,
        CourseOffering: {
          courseName: course
        }
      };
    }

    // Time range filtering
    if (timeRange) {
      const now = new Date();
      let timeFilter: any = {};

      switch (timeRange) {
        case 'morning':
          const morningStart = new Date(now);
          morningStart.setHours(6, 0, 0, 0);
          const morningEnd = new Date(now);
          morningEnd.setHours(12, 0, 0, 0);
          timeFilter = {
            gte: morningStart,
            lte: morningEnd
          };
          break;
        case 'afternoon':
          const afternoonStart = new Date(now);
          afternoonStart.setHours(12, 0, 0, 0);
          const afternoonEnd = new Date(now);
          afternoonEnd.setHours(18, 0, 0, 0);
          timeFilter = {
            gte: afternoonStart,
            lte: afternoonEnd
          };
          break;
        case 'evening':
          const eveningStart = new Date(now);
          eveningStart.setHours(18, 0, 0, 0);
          const eveningEnd = new Date(now);
          eveningEnd.setHours(22, 0, 0, 0);
          timeFilter = {
            gte: eveningStart,
            lte: eveningEnd
          };
          break;
        case 'last-hour':
          timeFilter = {
            gte: new Date(now.getTime() - 60 * 60 * 1000)
          };
          break;
        case 'last-2-hours':
          timeFilter = {
            gte: new Date(now.getTime() - 2 * 60 * 60 * 1000)
          };
          break;
      }

      if (Object.keys(timeFilter).length > 0) {
        where.timestamp = {
          ...where.timestamp,
          ...timeFilter
        };
      }
    }

    // Get attendance records with related data
    const attendanceRecords = await prisma.attendance.findMany({
      where,
      include: {
        student: {
          select: {
            studentId: true,
            studentIdNum: true,
            firstName: true,
            lastName: true,
            rfidTag: true,
            Department: {
              select: {
                departmentName: true,
                departmentCode: true
              }
            },
            CourseOffering: {
              select: {
                courseCode: true,
                courseName: true
              }
            }
          }
        },
        subjectSchedule: {
          select: {
            subjectSchedId: true,
            subject: {
              select: {
                subjectCode: true,
                subjectName: true
              }
            },
            section: {
              select: {
                sectionName: true
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
        },
        rfidLog: {
          select: {
            logsId: true,
            location: true,
            timestamp: true,
            readerId: true,
            reader: {
              select: {
                readerId: true,
                deviceId: true,
                deviceName: true,
                status: true,
                room: {
                  select: {
                    roomId: true,
                    roomNo: true,
                    roomBuildingLoc: true,
                    roomFloorLoc: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        timestamp: 'desc'
      },
      take: limit,
      skip: offset
    });

    // Get summary statistics
    const totalCount = await prisma.attendance.count({ where });
    
    const statusCounts = await prisma.attendance.groupBy({
      by: ['status'],
      where,
      _count: {
        status: true
      }
    });

    const recentActivity = await prisma.attendance.findMany({
      where: {
        timestamp: {
          gte: new Date(Date.now() - 60 * 60 * 1000) // Last hour
        },
        attendanceType: 'RFID_SCAN'
      },
      select: {
        attendanceId: true,
        status: true,
        timestamp: true,
        student: {
          select: {
            studentIdNum: true,
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: {
        timestamp: 'desc'
      },
      take: 10
    });

    return NextResponse.json({
      success: true,
      data: {
        records: attendanceRecords,
        pagination: {
          total: totalCount,
          limit,
          offset,
          hasMore: offset + limit < totalCount
        },
        statistics: {
          totalRecords: totalCount,
          statusCounts: statusCounts.reduce((acc, item) => {
            acc[item.status] = item._count.status;
            return acc;
          }, {} as Record<string, number>)
        },
        recentActivity
      }
    });

  } catch (e: any) {
    console.error('Live feed error:', e);
    return NextResponse.json({ 
      error: e?.message || 'Failed to fetch live feed data' 
    }, { status: 500 });
  }
}
