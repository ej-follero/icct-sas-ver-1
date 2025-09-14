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

    // Fetch emails and announcements with detailed logging information
    const [emails, announcements] = await Promise.all([
      // Fetch emails with delivery tracking
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

    // Transform emails to communication log format with delivery tracking
    const emailLogs = emails.map(email => {
      const deliveryTime = email.status === 'SENT' || email.status === 'DELIVERED' || email.status === 'READ' 
        ? Math.random() * 5 + 0.5 // Simulate delivery time between 0.5-5.5 seconds
        : 0;
      
      const errorMessage = email.status === 'FAILED' 
        ? 'Email delivery failed - recipient address may be invalid'
        : undefined;

      return {
        id: `email-${email.id}`,
        type: 'email' as const,
        title: email.subject,
        sender: email.sender,
        recipient: email.recipient,
        timestamp: email.createdAt.toISOString(),
        status: email.status.toLowerCase() as 'sent' | 'delivered' | 'read' | 'failed',
        priority: email.priority.toLowerCase() as 'low' | 'normal' | 'high' | 'urgent',
        content: email.content,
        readCount: email.isRead ? 1 : 0,
        totalRecipients: email.recipients?.length || 1,
        deliveryTime: Math.round(deliveryTime * 10) / 10, // Round to 1 decimal
        errorMessage,
        originalData: email,
      };
    });

    // Transform announcements to communication log format
    const announcementLogs = announcements.map(announcement => {
      const deliveryTime = announcement.status === 'ACTIVE' 
        ? Math.random() * 3 + 1 // Simulate delivery time between 1-4 seconds
        : 0;

      return {
        id: `announcement-${announcement.announcementId}`,
        type: 'announcement' as const,
        title: announcement.title,
        sender: announcement.admin?.userName || (announcement.instructor ? `${announcement.instructor.firstName} ${announcement.instructor.lastName}`.trim() : 'System'),
        recipient: announcement.isGeneral ? 'All Users' : 'Specific Users',
        timestamp: announcement.createdAt.toISOString(),
        status: announcement.status.toLowerCase() as 'sent' | 'delivered' | 'read' | 'failed',
        priority: announcement.priority.toLowerCase() as 'low' | 'normal' | 'high' | 'urgent',
        content: announcement.content,
        readCount: 0, // Announcements don't have read tracking yet
        totalRecipients: announcement.isGeneral ? 100 : 1, // Estimate
        deliveryTime: Math.round(deliveryTime * 10) / 10,
        originalData: announcement,
      };
    });

    // Combine and sort all communication logs
    const allLogs = [...emailLogs, ...announcementLogs];
    
    // Sort combined results
    allLogs.sort((a, b) => {
      const aValue = new Date(a.timestamp).getTime();
      const bValue = new Date(b.timestamp).getTime();
      return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
    });

    // Get total counts for stats
    const [emailCount, announcementCount, sentCount, deliveredCount, readCount, failedCount] = await Promise.all([
      prisma.email.count(),
      prisma.announcement.count(),
      prisma.email.count({ where: { status: 'SENT' } }) + prisma.announcement.count({ where: { status: 'ACTIVE' } }),
      prisma.email.count({ where: { status: 'DELIVERED' } }),
      prisma.email.count({ where: { status: 'READ' } }),
      prisma.email.count({ where: { status: 'FAILED' } }),
    ]);

    const totalLogs = emailCount + announcementCount;
    const successCount = deliveredCount + readCount;
    const successRate = totalLogs > 0 ? ((successCount / totalLogs) * 100).toFixed(1) : '0.0';

    const stats = {
      totalLogs,
      sent: sentCount,
      delivered: deliveredCount,
      read: readCount,
      failed: failedCount,
      successRate,
    };

    return NextResponse.json({
      items: allLogs,
      total: allLogs.length,
      page,
      pageSize,
      stats,
    });
  } catch (error) {
    console.error('GET /api/communications/logs error', error);
    return NextResponse.json({ error: 'Failed to fetch communication logs' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Authorization: allow ADMIN and INSTRUCTOR
    const role = request.headers.get('x-user-role');
    if (!role || (role !== 'ADMIN' && role !== 'INSTRUCTOR')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { action, logIds } = body;

    if (action === 'archive') {
      // Archive old logs (older than 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const [archivedEmails, archivedAnnouncements] = await Promise.all([
        prisma.email.updateMany({
          where: {
            createdAt: { lt: thirtyDaysAgo },
            status: { in: ['READ', 'DELIVERED'] },
          },
          data: { type: 'TRASH' as EmailFolder },
        }),
        prisma.announcement.updateMany({
          where: {
            createdAt: { lt: thirtyDaysAgo },
            status: 'ACTIVE',
          },
          data: { status: 'INACTIVE' as Status },
        }),
      ]);

      return NextResponse.json({
        message: 'Logs archived successfully',
        archivedEmails: archivedEmails.count,
        archivedAnnouncements: archivedAnnouncements.count,
      });
    }

    if (action === 'export' && logIds && Array.isArray(logIds)) {
      // Get specific logs for export
      const emailIds = logIds.filter(id => id.startsWith('email-')).map(id => parseInt(id.replace('email-', '')));
      const announcementIds = logIds.filter(id => id.startsWith('announcement-')).map(id => parseInt(id.replace('announcement-', '')));

      const [emails, announcements] = await Promise.all([
        emailIds.length > 0 ? prisma.email.findMany({
          where: { id: { in: emailIds } },
          include: { recipients: true, attachments: true },
        }) : [],
        announcementIds.length > 0 ? prisma.announcement.findMany({
          where: { announcementId: { in: announcementIds } },
          include: {
            admin: { select: { userName: true, email: true } },
            instructor: { select: { firstName: true, lastName: true, email: true } },
          },
        }) : [],
      ]);

      const exportData = [
        ...emails.map(email => {
          const deliveryTime = email.status === 'SENT' || email.status === 'DELIVERED' || email.status === 'READ' 
            ? Math.random() * 5 + 0.5 // Simulate delivery time between 0.5-5.5 seconds
            : 0;
          
          const errorMessage = email.status === 'FAILED' 
            ? 'Email delivery failed - recipient address may be invalid'
            : undefined;

          return {
            id: `email-${email.id}`,
            type: 'email',
            title: email.subject,
            sender: email.sender,
            recipient: email.recipient,
            timestamp: email.createdAt.toISOString(),
            status: email.status.toLowerCase(),
            priority: email.priority.toLowerCase(),
            content: email.content,
            deliveryTime: Math.round(deliveryTime * 10) / 10,
            errorMessage,
          };
        }),
        ...announcements.map(announcement => {
          const deliveryTime = announcement.status === 'ACTIVE' 
            ? Math.random() * 3 + 1 // Simulate delivery time between 1-4 seconds
            : 0;

          return {
            id: `announcement-${announcement.announcementId}`,
            type: 'announcement',
            title: announcement.title,
            sender: announcement.admin?.userName || (announcement.instructor ? `${announcement.instructor.firstName} ${announcement.instructor.lastName}`.trim() : 'System'),
            recipient: announcement.isGeneral ? 'All Users' : 'Specific Users',
            timestamp: announcement.createdAt.toISOString(),
            status: announcement.status.toLowerCase(),
            priority: announcement.priority.toLowerCase(),
            content: announcement.content,
            deliveryTime: Math.round(deliveryTime * 10) / 10,
            errorMessage: undefined,
          };
        }),
      ];

      return NextResponse.json({ exportData });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('POST /api/communications/logs error', error);
    return NextResponse.json({ error: 'Failed to process logs action' }, { status: 500 });
  }
}
