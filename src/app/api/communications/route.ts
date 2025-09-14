import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma, Priority, EmailStatus, EmailFolder, Status, Role } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    // Authorization: allow ADMIN and INSTRUCTOR
    const role = request.headers.get('x-user-role');
    const isDev = process.env.NODE_ENV !== 'production';
    if (!isDev) {
      if (!role || (role !== 'ADMIN' && role !== 'INSTRUCTOR')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    const { searchParams } = new URL(request.url);
    const search = (searchParams.get('search') || '').trim();
    const status = searchParams.get('status') as string | 'all' | null;
    const priority = searchParams.get('priority') as Priority | 'all' | null;
    const type = searchParams.get('type') as string | 'all' | null;
    const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1);
    const pageSize = Math.min(Math.max(parseInt(searchParams.get('pageSize') || '20', 10), 1), 100);
    const sortByParam = (searchParams.get('sortBy') || 'timestamp') as string;
    const sortOrderParam = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc';

    const sortWhitelist: Record<string, true> = {
      timestamp: true,
      createdAt: true,
      updatedAt: true,
      title: true,
      subject: true,
      status: true,
      priority: true,
      type: true,
    };
    const sortBy = sortWhitelist[sortByParam] ? (sortByParam as any) : 'timestamp';
    const sortOrder = sortOrderParam === 'asc' ? 'asc' : 'desc';
    const skip = (page - 1) * pageSize;

    // Fetch emails and announcements in parallel
    const [emails, announcements] = await Promise.all([
      // Fetch emails
      prisma.email.findMany({
        where: {
          AND: [
            status && status !== 'all' ? { status: status as EmailStatus } : {},
            priority && priority !== 'all' ? { priority } : {},
            type && type !== 'all' && type !== 'announcement' ? { type: type as EmailFolder } : {},
            search ? {
              OR: [
                { subject: { contains: search, mode: 'insensitive' } },
                { sender: { contains: search, mode: 'insensitive' } },
                { recipient: { contains: search, mode: 'insensitive' } },
                { content: { contains: search, mode: 'insensitive' } },
              ],
            } : {},
          ],
        },
        orderBy: { [sortBy === 'timestamp' ? 'createdAt' : sortBy]: sortOrder },
        take: pageSize,
        skip,
        include: {
          recipients: true,
          attachments: true,
        },
      }),
      // Fetch announcements
      prisma.announcement.findMany({
        where: {
          AND: [
            status && status !== 'all' ? { status: status as Status } : {},
            priority && priority !== 'all' ? { priority } : {},
            type && type !== 'all' && type !== 'email' ? {} : {},
            search ? {
              OR: [
                { title: { contains: search, mode: 'insensitive' } },
                { content: { contains: search, mode: 'insensitive' } },
              ],
            } : {},
          ],
        },
        orderBy: { [sortBy === 'timestamp' ? 'createdAt' : sortBy]: sortOrder },
        take: pageSize,
        skip,
        include: {
          admin: {
            select: {
              userName: true,
              email: true,
            },
          },
          instructor: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      }),
    ]);

    // Transform emails to communication format
    const emailCommunications = emails.map(email => ({
      id: `email-${email.id}`,
      type: 'email' as const,
      title: email.subject,
      content: email.content,
      sender: email.sender,
      recipient: email.recipient,
      timestamp: email.createdAt.toISOString(),
      status: email.status.toLowerCase() as 'sent' | 'delivered' | 'read' | 'failed',
      priority: email.priority.toLowerCase() as 'low' | 'normal' | 'high' | 'urgent',
      readCount: email.isRead ? 1 : 0,
      totalRecipients: email.recipients?.length || 1,
      avatar: `/api/avatar/${email.sender}`,
      originalData: email,
    }));

    // Transform announcements to communication format
    const announcementCommunications = announcements.map(announcement => ({
      id: `announcement-${announcement.announcementId}`,
      type: 'announcement' as const,
      title: announcement.title,
      content: announcement.content,
      sender: announcement.admin?.userName || (announcement.instructor ? `${announcement.instructor.firstName} ${announcement.instructor.lastName}`.trim() : 'System'),
      recipient: announcement.isGeneral ? 'All Users' : 'Specific Users',
      timestamp: announcement.createdAt.toISOString(),
      status: announcement.status.toLowerCase() as 'sent' | 'delivered' | 'read' | 'failed',
      priority: announcement.priority.toLowerCase() as 'low' | 'normal' | 'high' | 'urgent',
      readCount: 0, // Announcements don't have read tracking yet
      totalRecipients: announcement.isGeneral ? 100 : 1, // Estimate
      avatar: `/api/avatar/${announcement.admin?.userName || 'system'}`,
      originalData: announcement,
    }));

    // Combine and sort all communications
    const allCommunications = [...emailCommunications, ...announcementCommunications];
    
    // Sort combined results
    allCommunications.sort((a, b) => {
      const aValue = new Date(a.timestamp).getTime();
      const bValue = new Date(b.timestamp).getTime();
      return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
    });

    // Get total counts for stats
    const [emailCount, announcementCount, totalSent, delivered, read, failed] = await Promise.all([
      prisma.email.count(),
      prisma.announcement.count(),
      prisma.email.count({ where: { status: 'SENT' } }) + prisma.announcement.count({ where: { status: 'ACTIVE' } }),
      prisma.email.count({ where: { status: 'DELIVERED' } }),
      prisma.email.count({ where: { status: 'READ' } }),
      prisma.email.count({ where: { status: 'FAILED' } }),
    ]);

    const stats = {
      totalSent: emailCount + announcementCount,
      delivered,
      read,
      failed,
      successRate: totalSent > 0 ? ((delivered + read) / totalSent * 100).toFixed(1) : '0.0',
      trend: '+12.5%',
      trendDirection: 'up' as const,
    };

    return NextResponse.json({
      items: allCommunications,
      total: allCommunications.length,
      page,
      pageSize,
      stats,
    });
  } catch (error) {
    console.error('GET /api/communications error', error);
    return NextResponse.json({ error: 'Failed to fetch communications' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Authorization: only ADMIN can create
    const role = request.headers.get('x-user-role');
    if (!role || role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const {
      type,
      title,
      content,
      sender,
      recipient,
      priority = 'NORMAL',
      status = 'PENDING',
    } = body;

    if (!type || !title || !content || !sender || !recipient) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (type === 'email') {
      // Create email
      const email = await prisma.email.create({
        data: {
          subject: title,
          sender,
          recipient,
          content,
          priority: priority as Priority,
          type: 'SENT' as EmailFolder,
          status: status as EmailStatus,
        },
      });

      return NextResponse.json({
        id: `email-${email.id}`,
        type: 'email',
        title: email.subject,
        content: email.content,
        sender: email.sender,
        recipient: email.recipient,
        timestamp: email.createdAt.toISOString(),
        status: email.status.toLowerCase(),
        priority: email.priority.toLowerCase(),
        originalData: email,
      }, { status: 201 });
    } else if (type === 'announcement') {
      // Create announcement
      const userId = request.headers.get('x-user-id');
      if (!userId) {
        return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
      }

      const announcement = await prisma.announcement.create({
        data: {
          title,
          content,
          isGeneral: true,
          status: 'ACTIVE' as Status,
          priority: priority as Priority,
          createdby: parseInt(userId),
          userType: role as Role,
        },
        include: {
          admin: {
            select: {
              userName: true,
              email: true,
            },
          },
        },
      });

      return NextResponse.json({
        id: `announcement-${announcement.announcementId}`,
        type: 'announcement',
        title: announcement.title,
        content: announcement.content,
        sender: announcement.admin?.userName || 'System',
        recipient: 'All Users',
        timestamp: announcement.createdAt.toISOString(),
        status: announcement.status.toLowerCase(),
        priority: announcement.priority.toLowerCase(),
        originalData: announcement,
      }, { status: 201 });
    }

    return NextResponse.json({ error: 'Invalid communication type' }, { status: 400 });
  } catch (error) {
    console.error('POST /api/communications error', error);
    return NextResponse.json({ error: 'Failed to create communication' }, { status: 500 });
  }
}
