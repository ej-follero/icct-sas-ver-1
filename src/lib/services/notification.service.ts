import { emailService } from './email.service';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface NotificationRequest {
  userId: number;
  type: 'email';
  subject: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  scheduledFor?: Date;
  template?: string;
  variables?: Record<string, any>;
}

export interface NotificationResult {
  success: boolean;
  method: 'email';
  error?: string;
  timestamp: Date;
}

export class NotificationService {
  private queue: NotificationRequest[] = [];
  private isProcessing = false;

  constructor() {
    // Start processing queue
    this.processQueue();
  }

  // Add notification to queue
  async addToQueue(notification: NotificationRequest): Promise<void> {
    this.queue.push(notification);
    
    // Log to database
    await this.logNotification(notification);
    
    // Process queue if not already processing
    if (!this.isProcessing) {
      this.processQueue();
    }
  }

  // Process notification queue
  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;

    while (this.queue.length > 0) {
      const notification = this.queue.shift();
      if (notification) {
        await this.processNotification(notification);
      }
    }

    this.isProcessing = false;
  }

  // Process individual notification
  private async processNotification(notification: NotificationRequest): Promise<NotificationResult> {
    try {
      const user = await prisma.user.findUnique({
        where: { userId: notification.userId },
        include: {
          Student: true,
        },
      });

      if (!user) {
        throw new Error('User not found');
      }

      const results: NotificationResult[] = [];

                   // Send email notification
             const emailResult = await this.sendEmailNotification(user, notification);
             results.push(emailResult);

      // Update notification status
      await this.updateNotificationStatus(notification, results);

      return {
        success: results.some(r => r.success),
        method: notification.type,
        timestamp: new Date(),
      };
    } catch (error) {
      console.error('Notification processing error:', error);
      return {
        success: false,
        method: notification.type,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
      };
    }
  }

  // Send email notification
  private async sendEmailNotification(user: any, notification: NotificationRequest): Promise<NotificationResult> {
    try {
      const success = await emailService.sendGeneralNotificationEmail(
        user.email,
        notification.subject,
        notification.message,
        user.userName
      );

      return {
        success,
        method: 'email',
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        success: false,
        method: 'email',
        error: error instanceof Error ? error.message : 'Email sending failed',
        timestamp: new Date(),
      };
    }
  }

  

  // Send attendance notification
  async sendAttendanceNotification(
    studentId: number,
    notificationType: 'absence' | 'tardiness' | 'improvement' | 'concern',
    details: any
  ): Promise<void> {
    try {
      const student = await prisma.student.findUnique({
        where: { studentId },
        include: {
          Guardian: true,
          User: true,
        },
      });

      if (!student || !student.Guardian) {
        throw new Error('Student or guardian not found');
      }

      const guardian = student.Guardian;
      const studentName = `${student.firstName} ${student.lastName}`;
      const guardianName = `${guardian.firstName} ${guardian.lastName}`;

      // Send email notification
      if (guardian.email) {
        await emailService.sendAttendanceNotificationEmail(
          guardian.email,
          studentName,
          guardianName,
          notificationType,
          details
        );
      }

      

      // Log notification
      await prisma.attendanceNotification.create({
        data: {
          studentId,
          type: notificationType.toUpperCase() as any,
          message: `Notification sent for ${notificationType}`,
          recipient: 'PARENT',
          method: 'EMAIL',
          status: 'SENT',
          sentAt: new Date(),
        },
      });
    } catch (error) {
      console.error('Attendance notification error:', error);
    }
  }

  // Send password reset notification
  async sendPasswordResetNotification(email: string, resetToken: string, userName: string): Promise<boolean> {
    try {
      const success = await emailService.sendPasswordResetEmail(email, resetToken, userName);
      return success;
    } catch (error) {
      console.error('Password reset notification error:', error);
      return false;
    }
  }

  // Send bulk notifications
  async sendBulkNotifications(
    userIds: number[],
    notification: Omit<NotificationRequest, 'userId'>
  ): Promise<{ success: number; failed: number }> {
    const results = await Promise.allSettled(
      userIds.map(userId => 
        this.addToQueue({
          ...notification,
          userId,
        })
      )
    );

    const success = results.filter(result => result.status === 'fulfilled').length;
    const failed = results.length - success;

    return { success, failed };
  }

  // Log notification to database
  private async logNotification(notification: NotificationRequest): Promise<void> {
    try {
      await prisma.systemLogs.create({
        data: {
          userId: notification.userId,
          actionType: 'NOTIFICATION_QUEUED',
          module: 'NOTIFICATION',
          details: `Notification queued: ${notification.subject}`,
          timestamp: new Date(),
        },
      });
    } catch (error) {
      console.error('Error logging notification:', error);
    }
  }

  // Update notification status
  private async updateNotificationStatus(
    notification: NotificationRequest,
    results: NotificationResult[]
  ): Promise<void> {
    try {
      const success = results.some(r => r.success);
      const status = success ? 'SENT' : 'FAILED';

      await prisma.systemLogs.create({
        data: {
          userId: notification.userId,
          actionType: 'NOTIFICATION_SENT',
          module: 'NOTIFICATION',
          details: `Notification ${status}: ${notification.subject}`,
          timestamp: new Date(),
        },
      });
    } catch (error) {
      console.error('Error updating notification status:', error);
    }
  }

  // Get notification statistics
  async getNotificationStats(): Promise<{
    total: number;
    sent: number;
    failed: number;
    pending: number;
  }> {
    try {
      const [total, sent, failed] = await Promise.all([
        prisma.systemLogs.count({
          where: { actionType: 'NOTIFICATION_QUEUED' },
        }),
        prisma.systemLogs.count({
          where: { 
            actionType: 'NOTIFICATION_SENT',
            details: { contains: 'SENT' },
          },
        }),
        prisma.systemLogs.count({
          where: { 
            actionType: 'NOTIFICATION_SENT',
            details: { contains: 'FAILED' },
          },
        }),
      ]);

      return {
        total,
        sent,
        failed,
        pending: this.queue.length,
      };
    } catch (error) {
      console.error('Error getting notification stats:', error);
      return { total: 0, sent: 0, failed: 0, pending: 0 };
    }
  }
}

// Export singleton instance
export const notificationService = new NotificationService(); 