import { NextRequest } from 'next/server';

// Server-Sent Events endpoint for real-time attendance updates
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const studentId = searchParams.get('studentId');
  const subjectId = searchParams.get('subjectId');
  const readerId = searchParams.get('readerId');
  const roomId = searchParams.get('roomId');
  const building = searchParams.get('building');

  // Create a readable stream for Server-Sent Events
  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection message
      const sendEvent = (data: any) => {
        const eventData = `data: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(new TextEncoder().encode(eventData));
      };

      sendEvent({
        type: 'connection',
        message: 'Connected to live attendance feed',
        timestamp: new Date().toISOString()
      });

      // Set up interval to check for new attendance records
      const interval = setInterval(async () => {
        try {
          const { prisma } = await import('@/lib/prisma');
          
          // Build where clause for filtering
          const whereClause: any = {
            timestamp: {
              gte: new Date(Date.now() - 30 * 1000)
            },
            attendanceType: 'RFID_SCAN'
          };

          if (studentId) whereClause.studentId = parseInt(studentId);
          if (subjectId) whereClause.subjectSchedId = parseInt(subjectId);
          
          // RFID Reader filtering
          if (readerId) {
            whereClause.rfidLog = {
              readerId: parseInt(readerId)
            };
          }

          if (roomId) {
            whereClause.rfidLog = {
              ...whereClause.rfidLog,
              reader: {
                roomId: parseInt(roomId)
              }
            };
          }

          if (building) {
            whereClause.rfidLog = {
              ...whereClause.rfidLog,
              reader: {
                ...whereClause.rfidLog?.reader,
                room: {
                  roomBuildingLoc: building
                }
              }
            };
          }

          // Get recent attendance records (last 30 seconds)
          const recentRecords = await prisma.attendance.findMany({
            where: whereClause,
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
                  }
                }
              },
              subjectSchedule: {
                select: {
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
              }
            },
            orderBy: {
              timestamp: 'desc'
            },
            take: 10
          });

          if (recentRecords.length > 0) {
            sendEvent({
              type: 'attendance_update',
              records: recentRecords,
              timestamp: new Date().toISOString()
            });
          }

          // Send heartbeat every 30 seconds
          sendEvent({
            type: 'heartbeat',
            timestamp: new Date().toISOString()
          });

        } catch (error) {
          console.error('Stream error:', error);
          sendEvent({
            type: 'error',
            message: 'Error fetching attendance data',
            timestamp: new Date().toISOString()
          });
        }
      }, 5000); // Check every 5 seconds

      // Cleanup on close
      request.signal.addEventListener('abort', () => {
        clearInterval(interval);
        controller.close();
      });
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    }
  });
}
