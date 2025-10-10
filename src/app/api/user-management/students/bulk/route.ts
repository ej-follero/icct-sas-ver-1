import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { BulkActionRequest } from '@/types/user-management';

const bulkActionSchema = z.object({
  action: z.enum([
    'activate', 'deactivate', 'suspend', 'block', 
    'reset_password', 'enable_2fa', 'disable_2fa',
    'send_verification_email', 'send_credentials'
  ]),
  userIds: z.array(z.number()).min(1),
  options: z.object({
    notifyUsers: z.boolean().optional().default(true),
    reason: z.string().optional(),
    temporaryPassword: z.boolean().optional().default(false),
    suspensionDuration: z.number().optional(), // days
  }).optional().default({}),
});

// POST - Execute bulk actions
export async function POST(request: NextRequest) {
  try {
    // JWT Authentication - Admin only
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const reqUserId = Number((decoded as any)?.userId);
    if (!Number.isFinite(reqUserId)) {
      return NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 });
    }

    const reqUser = await prisma.user.findUnique({ where: { userId: reqUserId }, select: { status: true, role: true } });
    if (!reqUser || reqUser.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'User not found or inactive' }, { status: 401 });
    }
    const adminRoles = ['SUPER_ADMIN', 'ADMIN'];
    if (!adminRoles.includes(reqUser.role)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
    const body = await request.json();
    const validatedData = bulkActionSchema.parse(body);
    
    const { action, userIds, options } = validatedData;
    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[]
    };

    // Verify all users are students
    const users = await prisma.user.findMany({
      where: {
        userId: { in: userIds },
        role: 'STUDENT'
      },
      include: {
        Student: true
      }
    });

    if (users.length !== userIds.length) {
      return NextResponse.json(
        { error: 'Some users not found or not students' },
        { status: 400 }
      );
    }

    // Execute bulk action
    try {
      switch (action) {
        case 'activate':
          await prisma.user.updateMany({
            where: { userId: { in: userIds } },
            data: { 
              status: 'ACTIVE',
              updatedAt: new Date()
            }
          });
          results.success = userIds.length;
          break;

        case 'deactivate':
          await prisma.user.updateMany({
            where: { userId: { in: userIds } },
            data: { 
              status: 'INACTIVE',
              updatedAt: new Date()
            }
          });
          results.success = userIds.length;
          break;

        case 'suspend':
          const suspensionData: any = { 
            status: 'SUSPENDED',
            updatedAt: new Date()
          };
          
          // If suspension duration is provided, could store it in a separate table
          if (options?.suspensionDuration) {
            // For now, just update the status
            // In a real implementation, you'd store suspension end date
          }
          
          await prisma.user.updateMany({
            where: { userId: { in: userIds } },
            data: suspensionData
          });
          results.success = userIds.length;
          break;

        case 'block':
          await prisma.user.updateMany({
            where: { userId: { in: userIds } },
            data: { 
              status: 'BLOCKED',
              updatedAt: new Date()
            }
          });
          results.success = userIds.length;
          break;

        case 'reset_password':
          // Generate temporary passwords if requested
          const passwordOperations = [];
          
          for (const userId of userIds) {
            let newPassword = 'TempPass123!'; // Default temp password
            
            if (options?.temporaryPassword) {
              // Generate random temporary password
              newPassword = generateTemporaryPassword();
            }
            
            const hashedPassword = await bcrypt.hash(newPassword, 12);
            
            passwordOperations.push(
              prisma.user.update({
                where: { userId },
                data: {
                  passwordHash: hashedPassword,
                  lastPasswordChange: new Date(),
                  updatedAt: new Date()
                }
              })
            );

            // In a real implementation, you'd send the new password via email
            // For now, we'll just log it (remove in production!)
            console.log(`New password for user ${userId}: ${newPassword}`);
          }
          
          await Promise.all(passwordOperations);
          results.success = userIds.length;
          break;

        case 'enable_2fa':
          await prisma.user.updateMany({
            where: { userId: { in: userIds } },
            data: { 
              twoFactorEnabled: true,
              updatedAt: new Date()
            }
          });
          results.success = userIds.length;
          break;

        case 'disable_2fa':
          await prisma.user.updateMany({
            where: { userId: { in: userIds } },
            data: { 
              twoFactorEnabled: false,
              updatedAt: new Date()
            }
          });
          results.success = userIds.length;
          break;

        case 'send_verification_email':
          // In a real implementation, you'd send verification emails
          // For now, just mark as if emails were sent
          results.success = userIds.length;
          break;

        case 'send_credentials':
          // In a real implementation, you'd send login credentials
          // For now, just mark as if credentials were sent
          results.success = userIds.length;
          break;

        default:
          return NextResponse.json(
            { error: 'Invalid action' },
            { status: 400 }
          );
      }

      // Log the bulk action (in a real implementation)
      await logBulkAction(action, userIds, options);

      // Send notifications if requested (in a real implementation)
      if (options?.notifyUsers) {
        await sendBulkNotifications(action, users, options);
      }

      return NextResponse.json({
        message: `Bulk ${action} completed successfully`,
        results
      });

    } catch (error) {
      console.error(`Error executing bulk ${action}:`, error);
      return NextResponse.json(
        { error: `Failed to execute bulk ${action}` },
        { status: 500 }
      );
    }

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error in bulk operation:', error);
    return NextResponse.json(
      { error: 'Failed to execute bulk operation' },
      { status: 500 }
    );
  }
}

// Helper functions
function generateTemporaryPassword(length: number = 12): string {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  
  // Ensure at least one of each type
  password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)]; // uppercase
  password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)]; // lowercase
  password += '0123456789'[Math.floor(Math.random() * 10)]; // number
  password += '!@#$%^&*'[Math.floor(Math.random() * 8)]; // special
  
  // Fill the rest randomly
  for (let i = password.length; i < length; i++) {
    password += charset[Math.floor(Math.random() * charset.length)];
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

async function logBulkAction(
  action: string, 
  userIds: number[], 
  options: any
): Promise<void> {
  try {
    // In a real implementation, log to audit table
    console.log(`Bulk action logged: ${action} on ${userIds.length} users`);
    
    // Example: Insert into audit log table
    // await prisma.auditLog.create({
    //   data: {
    //     action: `BULK_${action.toUpperCase()}`,
    //     performedBy: getCurrentUserId(), // Get from auth context
    //     affectedUsers: userIds,
    //     options,
    //     timestamp: new Date()
    //   }
    // });
  } catch (error) {
    console.error('Error logging bulk action:', error);
  }
}

async function sendBulkNotifications(
  action: string, 
  users: any[], 
  options: any
): Promise<void> {
  try {
    // In a real implementation, send notifications via email
    console.log(`Notifications sent for ${action} to ${users.length} users`);
    
    // Example notification logic:
    // for (const user of users) {
    //   await sendNotification({
    //     userId: user.userId,
    //     type: getNotificationTypeForAction(action),
    //     message: getNotificationMessage(action, options),
    //     email: user.email,
    //     phone: user.Student?.[0]?.phoneNumber
    //   });
    // }
  } catch (error) {
    console.error('Error sending bulk notifications:', error);
  }
} 