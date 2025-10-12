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

    // Build where clause
    const where: any = {
      attendanceType: 'RFID_SCAN'
    };

    if (startDate && endDate) {
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
