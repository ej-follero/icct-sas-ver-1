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
    const limit = parseInt(searchParams.get('pageSize') || searchParams.get('limit') || '10');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const classFilter = searchParams.get('class') || 'all';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const where: any = {};
    
    if (priority !== 'all') {
      where.priority = priority.toUpperCase();
    }
    
    if (audience !== 'all') {
      if (audience === 'STUDENTS') {
        where.userType = 'STUDENT';
      } else if (audience === 'INSTRUCTORS') {
        where.userType = 'INSTRUCTOR';
      } else if (audience === 'ADMINS') {
        where.userType = { in: ['SUPER_ADMIN', 'ADMIN'] };
      }
    }

    if (status !== 'all') {
      if (status === 'ACTIVE' || status === 'normal' || status === 'important') {
        where.status = 'ACTIVE';
      } else if (status === 'INACTIVE' || status === 'archived') {
        where.status = 'INACTIVE';
      }
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Handle date range filtering
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    // Handle class filtering (this would need to be implemented based on your schema)
    if (classFilter !== 'all') {
      // This would need to be adjusted based on how classes are stored
      // For now, we'll skip this filter
    }

    // Handle sorting
    let orderBy: any = {};
    if (sortBy === 'title') {
      orderBy = { title: sortOrder };
    } else if (sortBy === 'date') {
      orderBy = { createdAt: sortOrder };
    } else if (sortBy === 'status') {
      orderBy = { status: sortOrder };
    } else {
      orderBy = { createdAt: 'desc' };
    }

    const announcements = await prisma.announcement.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      include: {
        admin: {
          select: {
            userId: true,
            userName: true,
            email: true
          }
        },
        section: {
          select: {
            sectionName: true
          }
        },
        subject: {
          select: {
            subjectName: true,
            subjectCode: true
          }
        },
        instructor: {
          select: {
            firstName: true,
            lastName: true,
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

    // Transform announcements to match frontend expectations
    const transformedAnnouncements = announcements.map(announcement => ({
      id: announcement.announcementId,
      title: announcement.title,
      description: announcement.content,
      class: announcement.section?.sectionName || announcement.subject?.subjectName || 'General',
      date: announcement.createdAt.toISOString().split('T')[0],
      status: announcement.status === 'ACTIVE' ? 'normal' : 'archived',
      priority: announcement.priority.toLowerCase(),
      createdAt: announcement.createdAt.toISOString(),
      updatedAt: announcement.updatedAt.toISOString(),
      createdBy: announcement.admin?.userName || ((announcement.instructor?.firstName || '') + ' ' + (announcement.instructor?.lastName || '')).trim() || 'Unknown',
      isGeneral: announcement.isGeneral,
      subjectId: announcement.subjectId,
      sectionId: announcement.sectionId,
      instructorId: announcement.instructorId,
    }));

    return NextResponse.json({
      items: transformedAnnouncements,
      total: total,
      page: page,
      pageSize: limit,
      totalPages: Math.ceil(total / limit),
      statistics,
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

    // Get creator from JWT cookie
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    let userId: number; let creatorRole: 'SUPER_ADMIN' | 'ADMIN' | 'DEPARTMENT_HEAD' | 'INSTRUCTOR' | 'STUDENT' = 'ADMIN';
    try {
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      userId = decoded.userId as number;
      const roleFromToken = decoded.role as ('SUPER_ADMIN' | 'ADMIN' | 'DEPARTMENT_HEAD' | 'INSTRUCTOR' | 'STUDENT' | undefined);
      creatorRole = roleFromToken || creatorRole;
    } catch {
      return NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 });
    }

    // Map audience to Role enum (fallback to creator's role); isGeneral for ALL
    const mapAudienceToRole = (aud?: string): 'STUDENT' | 'INSTRUCTOR' | 'ADMIN' | undefined => {
      if (!aud || aud === 'ALL') return undefined;
      if (aud === 'STUDENTS') return 'STUDENT';
      if (aud === 'INSTRUCTORS') return 'INSTRUCTOR';
      if (aud === 'ADMINS') return 'ADMIN';
      return undefined;
    };

    const userTypeValue = mapAudienceToRole(validatedData.targetAudience) || creatorRole;

    const announcement = await prisma.announcement.create({
      data: {
        title: validatedData.title,
        content: validatedData.content,
        priority: validatedData.priority || 'NORMAL',
        userType: userTypeValue as any,
        status: validatedData.isPublished ? 'ACTIVE' : 'INACTIVE',
        createdby: userId,
        isGeneral: validatedData.targetAudience === 'ALL'
      }
    });

    // If published, send notifications
    if (validatedData.isPublished) {
      await sendAnnouncementNotifications(announcement, validatedData.targetAudience);
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

async function sendAnnouncementNotifications(announcement: any, targetAudience?: 'ALL' | 'STUDENTS' | 'INSTRUCTORS' | 'ADMINS') {
  try {
    // Get target users based on audience
    let targetUsers: Array<{ userId: number; email: string; userName: string }> = [];
    
    if (targetAudience === 'ALL') {
      targetUsers = await prisma.user.findMany({
        select: { userId: true, email: true, userName: true }
      });
    } else if (targetAudience === 'STUDENTS') {
      targetUsers = await prisma.user.findMany({
        where: { role: 'STUDENT' },
        select: { userId: true, email: true, userName: true }
      });
    } else if (targetAudience === 'INSTRUCTORS') {
      targetUsers = await prisma.user.findMany({
        where: { role: 'INSTRUCTOR' },
        select: { userId: true, email: true, userName: true }
      });
    } else if (targetAudience === 'ADMINS') {
      targetUsers = await prisma.user.findMany({
        where: { role: { in: ['SUPER_ADMIN', 'ADMIN'] } },
        select: { userId: true, email: true, userName: true }
      });
    }

    // Create notification records
    const notifications = targetUsers.map((user) => ({
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