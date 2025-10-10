import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Get user ID from JWT token in cookies
    const token = request.cookies.get('token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verify JWT token and extract user ID
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userIdRaw = (decoded as any)?.userId;
    const userId = Number(userIdRaw);
    if (!Number.isFinite(userId)) {
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      );
    }

    // Get user data with related student data and attendance
    const user = await prisma.user.findUnique({
      where: { userId },
      include: {
        UserPreferences: true,
        Student: {
          include: {
            Department: true,
            StudentSection: {
              include: {
                Section: {
                  include: {
                    Course: true
                  }
                }
              }
            }
          }
        },
        Attendance: {
          include: {
            subjectSchedule: {
              include: {
                subject: true,
                section: true
              }
            }
          },
          orderBy: {
            timestamp: 'desc'
          },
          take: 100 // Last 100 attendance records
        }
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get additional activity data
    const loginHistory = await prisma.securityLog.findMany({
      where: {
        userId,
        action: 'LOGIN_SUCCESS'
      },
      orderBy: {
        timestamp: 'desc'
      },
      take: 50,
      select: {
        timestamp: true,
        ipAddress: true,
        userAgent: true
      }
    });

    const securityEvents = await prisma.securityLog.findMany({
      where: { userId },
      orderBy: {
        timestamp: 'desc'
      },
      take: 50,
      select: {
        eventType: true,
        timestamp: true,
        ipAddress: true,
        details: true
      }
    });

    // Prepare export data
    const exportData = {
      profile: {
        userId: user.userId,
        userName: user.userName,
        email: user.email,
        role: user.role,
        status: user.status,
        firstName: user.Student?.[0]?.firstName,
        lastName: user.Student?.[0]?.lastName,
        phoneNumber: user.Student?.[0]?.phoneNumber,
        address: user.Student?.[0]?.address,
        bio: undefined,
        department: user.Student?.[0]?.Department?.departmentName,
        position: user.role === 'INSTRUCTOR' ? 'Instructor' : user.role === 'STUDENT' ? 'Student' : 'Administrator',
        lastLogin: user.lastLogin?.toISOString(),
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString()
      },
      preferences: user.UserPreferences ? {
        notifications: user.UserPreferences.notifications,
        emailAlerts: user.UserPreferences.emailAlerts,
        language: user.UserPreferences.language,
        timezone: user.UserPreferences.timezone,
        theme: user.UserPreferences.theme,
        emailFrequency: user.UserPreferences.emailFrequency,
        dashboardLayout: user.UserPreferences.dashboardLayout
      } : null,
      security: {
        twoFactorEnabled: user.twoFactorEnabled,
        lastPasswordChange: user.lastPasswordChange?.toISOString() || user.createdAt.toISOString(),
        failedLoginAttempts: user.failedLoginAttempts,
        isEmailVerified: user.isEmailVerified
      },
      enrollment: user.Student?.[0]?.StudentSection?.map(section => ({
        sectionId: section.Section.sectionId,
        sectionName: section.Section.sectionName,
        courseName: section.Section.Course.courseName,
        yearLevel: section.Section.yearLevel,
        semester: section.Section.semester,
        academicYear: section.Section.academicYear,
        enrollmentStatus: section.enrollmentStatus,
        enrollmentDate: section.enrollmentDate.toISOString(),
        dropDate: section.dropDate ? section.dropDate.toISOString() : null
      })) || [],
      attendance: user.Attendance?.map(attendance => ({
        attendanceId: attendance.attendanceId,
        subjectName: attendance.subjectSchedule?.subject?.subjectName,
        sectionName: attendance.subjectSchedule?.section?.sectionName,
        status: attendance.status,
        timestamp: attendance.timestamp.toISOString(),
        method: attendance.attendanceType,
        location: attendance.location
      })) || [],
      activity: {
        loginHistory: loginHistory.map(login => ({
          timestamp: login.timestamp.toISOString(),
          ipAddress: login.ipAddress,
          userAgent: login.userAgent
        })),
        securityEvents: securityEvents.map(event => ({
          eventType: event.eventType,
          timestamp: event.timestamp.toISOString(),
          ipAddress: event.ipAddress,
          details: event.details
        }))
      },
      exportInfo: {
        exportedAt: new Date().toISOString(),
        exportedBy: user.email,
        dataVersion: '1.0',
        recordCounts: {
          attendanceRecords: user.Attendance?.length || 0,
          loginHistory: loginHistory.length,
          securityEvents: securityEvents.length,
          enrolledSections: user.Student?.[0]?.StudentSection?.length || 0
        }
      }
    };

    // Set headers for file download
    const headers = new Headers();
    headers.set('Content-Type', 'application/json');
    headers.set('Content-Disposition', `attachment; filename="profile-data-${user.email.split('@')[0]}-${new Date().toISOString().split('T')[0]}.json"`);

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers
    });

  } catch (error) {
    console.error('Error exporting profile data:', error);
    return NextResponse.json(
      { error: 'Failed to export profile data' },
      { status: 500 }
    );
  }
}
