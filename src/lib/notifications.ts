import { prisma } from '@/lib/prisma';

type Priority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

export async function createNotification(userId: number, params: {
  title: string;
  message?: string | null;
  type?: string; // default SYSTEM
  priority?: Priority; // aligns with prisma enum Priority but Notification.priority is String
  actionUrl?: string | null; // kept in message for now if needed
}) {
  // Align strictly to Notification schema: title (String), message (String?), type (String), priority (String)
  return prisma.notification.create({
    data: {
      userId,
      title: params.title,
      message: params.message ?? null,
      type: params.type ?? 'SYSTEM',
      priority: params.priority ?? 'NORMAL',
      isRead: false,
    },
  });
}


