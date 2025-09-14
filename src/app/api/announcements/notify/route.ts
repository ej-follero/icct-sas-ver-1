import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { EmailService } from '@/lib/services/email.service';

export async function POST(request: NextRequest) {
  try {
    // Get user info from middleware headers
    const userId = request.headers.get('x-user-id');
    const userEmail = request.headers.get('x-user-email');
    const userRole = request.headers.get('x-user-role');
    
    if (!userId || !userEmail) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

    // Only allow ADMIN and INSTRUCTOR to send notifications
    if (!['ADMIN', 'INSTRUCTOR'].includes(userRole || '')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const { announcementId, title, content } = body;

    if (!announcementId || !title || !content) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get announcement details
    const announcement = await prisma.announcement.findUnique({
      where: { announcementId: parseInt(announcementId) },
      include: {
        admin: {
          select: { userName: true, email: true }
        },
        section: {
          select: { sectionName: true }
        },
        subject: {
          select: { subjectName: true, subjectCode: true }
        }
      }
    });

    if (!announcement) {
      return NextResponse.json({ error: 'Announcement not found' }, { status: 404 });
    }

    // Get recipients based on announcement scope
    let recipients: string[] = [];

    if (announcement.isGeneral) {
      // Send to all users
      const allUsers = await prisma.user.findMany({
        where: { status: 'ACTIVE' },
        select: { email: true }
      });
      recipients = allUsers.map(user => user.email);
    } else if (announcement.sectionId) {
      // Send to students in specific section
      const sectionStudents = await prisma.student.findMany({
        where: {
          StudentSection: {
            some: { sectionId: announcement.sectionId }
          }
        },
        include: { User: { select: { email: true } } }
      });
      recipients = sectionStudents.map(student => student.User.email);
    } else if (announcement.subjectId) {
      // Send to students enrolled in specific subject
      const subjectStudents = await prisma.student.findMany({
        where: {
          StudentSchedules: {
            some: {
              schedule: {
                subjectId: announcement.subjectId
              }
            }
          }
        },
        include: { User: { select: { email: true } } }
      });
      recipients = subjectStudents.map(student => student.User.email);
    }

    // Remove duplicates and filter out empty emails
    recipients = [...new Set(recipients)].filter(email => email && email.trim() !== '');

    if (recipients.length === 0) {
      return NextResponse.json({ 
        success: false, 
        message: 'No recipients found for this announcement' 
      });
    }

    // Send emails
    const emailService = new EmailService();
    let successCount = 0;
    const errors: string[] = [];

    for (const recipient of recipients) {
      try {
        const success = await emailService.sendGeneralNotificationEmail(
          recipient,
          `ICCT Announcement: ${title}`,
          `Dear Student,\n\n${content}\n\nBest regards,\nICCT Administration`,
          'Student'
        );
        
        if (success) {
          successCount++;
        } else {
          errors.push(`Failed to send to ${recipient}`);
        }
      } catch (error) {
        errors.push(`Error sending to ${recipient}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Log the notification activity
    await prisma.systemLogs.create({
      data: {
        userId: parseInt(userId),
        actionType: 'ANNOUNCEMENT_NOTIFICATION',
        module: 'ANNOUNCEMENTS',
        entityId: announcementId,
        details: `Sent notification to ${successCount} recipients for announcement: ${title}`,
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      }
    });

    return NextResponse.json({
      success: successCount > 0,
      message: `Notifications sent to ${successCount} out of ${recipients.length} recipients`,
      totalRecipients: recipients.length,
      successCount,
      errors: errors.slice(0, 5) // Limit error details
    });

  } catch (error) {
    console.error('Announcement notification error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to send notifications',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
