import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const announcementSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).optional(),
  targetAudience: z.enum(['ALL', 'STUDENTS', 'INSTRUCTORS', 'ADMINS']).optional(),
  isPublished: z.boolean().optional(),
  publishedAt: z.string().datetime().optional(),
  attachments: z.array(z.object({
    filename: z.string(),
    url: z.string(),
    size: z.number()
  })).optional()
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const priority = searchParams.get('priority') || 'all';
    const audience = searchParams.get('audience') || 'all';
    const status = searchParams.get('status') || 'all';
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const where: any = {};
    
    if (priority !== 'all') {
      where.priority = priority;
    }
    
    if (audience !== 'all') {
      where.userType = audience;
    }

    if (status !== 'all') {
      if (status === 'published') {
        where.status = 'ACTIVE';
      } else if (status === 'draft') {
        where.status = 'INACTIVE';
      }
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } }
      ];
    }

    const announcements = await prisma.announcement.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        admin: {
          select: {
            userId: true,
            userName: true,
            email: true
          }
        }
      }
    });

    const total = await prisma.announcement.count({ where });

    // Get statistics
    const statistics = {
      total: total,
      published: announcements.filter(a => a.status === 'ACTIVE').length,
      drafts: announcements.filter(a => a.status === 'INACTIVE').length,
      urgent: announcements.filter(a => a.priority === 'URGENT').length,
      normal: announcements.filter(a => a.priority === 'NORMAL').length
    };

    return NextResponse.json({
      data: announcements,
      statistics,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching announcements:', error);
    return NextResponse.json(
      { error: 'Failed to fetch announcements' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = announcementSchema.parse(body);

    const announcement = await prisma.announcement.create({
      data: {
        title: validatedData.title,
        content: validatedData.content,
        priority: validatedData.priority || 'NORMAL',
        userType: validatedData.targetAudience || 'ALL',
        status: validatedData.isPublished ? 'ACTIVE' : 'INACTIVE',
        createdby: 1, // TODO: Get from session
        isGeneral: validatedData.targetAudience === 'ALL'
      }
    });

    // If published, send notifications
    if (validatedData.isPublished) {
      await sendAnnouncementNotifications(announcement);
    }

    return NextResponse.json({ data: announcement });
  } catch (error) {
    console.error('Error creating announcement:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid announcement data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create announcement' },
      { status: 500 }
    );
  }
}

async function sendAnnouncementNotifications(announcement: any) {
  try {
    // Get target users based on audience
    let targetUsers = [];
    
    if (announcement.targetAudience === 'ALL') {
      targetUsers = await prisma.user.findMany({
        select: { userId: true, email: true, userName: true }
      });
    } else if (announcement.targetAudience === 'STUDENTS') {
      targetUsers = await prisma.user.findMany({
        where: { role: 'STUDENT' },
        select: { userId: true, email: true, userName: true }
      });
    } else if (announcement.targetAudience === 'INSTRUCTORS') {
      targetUsers = await prisma.user.findMany({
        where: { role: 'INSTRUCTOR' },
        select: { userId: true, email: true, userName: true }
      });
    } else if (announcement.targetAudience === 'ADMINS') {
      targetUsers = await prisma.user.findMany({
        where: { role: { in: ['SUPER_ADMIN', 'ADMIN'] } },
        select: { userId: true, email: true, userName: true }
      });
    }

    // Create notification records
    const notifications = targetUsers.map(user => ({
      userId: user.userId,
      title: `New Announcement: ${announcement.title}`,
      message: announcement.content.substring(0, 200) + (announcement.content.length > 200 ? '...' : ''),
      type: 'ANNOUNCEMENT',
      priority: announcement.priority,
      isRead: false,
      createdAt: new Date()
    }));

    await prisma.notification.createMany({
      data: notifications
    });

    // TODO: Send email notifications
    // TODO: Send push notifications
    // TODO: Send SMS for urgent announcements

  } catch (error) {
    console.error('Error sending announcement notifications:', error);
  }
}