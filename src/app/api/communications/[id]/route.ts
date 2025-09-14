import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma, Priority, EmailStatus, EmailFolder, Status, Role } from '@prisma/client';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authorization: allow ADMIN and INSTRUCTOR
    const role = request.headers.get('x-user-role');
    const isDev = process.env.NODE_ENV !== 'production';
    if (!isDev) {
      if (!role || (role !== 'ADMIN' && role !== 'INSTRUCTOR')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    const { id } = params;
    const [type, originalId] = id.split('-');

    if (type === 'email') {
      const email = await prisma.email.findUnique({
        where: { id: parseInt(originalId) },
        include: {
          recipients: true,
          attachments: true,
        },
      });

      if (!email) {
        return NextResponse.json({ error: 'Email not found' }, { status: 404 });
      }

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
        readCount: email.isRead ? 1 : 0,
        totalRecipients: email.recipients?.length || 1,
        avatar: `/api/avatar/${email.sender}`,
        originalData: email,
      });
    } else if (type === 'announcement') {
      const announcement = await prisma.announcement.findUnique({
        where: { announcementId: parseInt(originalId) },
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
      });

      if (!announcement) {
        return NextResponse.json({ error: 'Announcement not found' }, { status: 404 });
      }

      return NextResponse.json({
        id: `announcement-${announcement.announcementId}`,
        type: 'announcement',
        title: announcement.title,
        content: announcement.content,
        sender: announcement.admin?.userName || (announcement.instructor ? `${announcement.instructor.firstName} ${announcement.instructor.lastName}`.trim() : 'System'),
        recipient: announcement.isGeneral ? 'All Users' : 'Specific Users',
        timestamp: announcement.createdAt.toISOString(),
        status: announcement.status.toLowerCase(),
        priority: announcement.priority.toLowerCase(),
        readCount: 0,
        totalRecipients: announcement.isGeneral ? 100 : 1,
        avatar: `/api/avatar/${announcement.admin?.userName || 'system'}`,
        originalData: announcement,
      });
    }

    return NextResponse.json({ error: 'Invalid communication type' }, { status: 400 });
  } catch (error) {
    console.error('GET /api/communications/[id] error', error);
    return NextResponse.json({ error: 'Failed to fetch communication' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authorization: only ADMIN can update
    const role = request.headers.get('x-user-role');
    if (!role || role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = params;
    const [type, originalId] = id.split('-');
    const body = await request.json();

    if (type === 'email') {
      const email = await prisma.email.update({
        where: { id: parseInt(originalId) },
        data: {
          ...(body.subject && { subject: body.subject }),
          ...(body.content && { content: body.content }),
          ...(body.status && { status: body.status as EmailStatus }),
          ...(body.priority && { priority: body.priority as Priority }),
        },
        include: {
          recipients: true,
          attachments: true,
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
      });
    } else if (type === 'announcement') {
      const announcement = await prisma.announcement.update({
        where: { announcementId: parseInt(originalId) },
        data: {
          ...(body.title && { title: body.title }),
          ...(body.content && { content: body.content }),
          ...(body.status && { status: body.status as Status }),
          ...(body.priority && { priority: body.priority as Priority }),
        },
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
      });

      return NextResponse.json({
        id: `announcement-${announcement.announcementId}`,
        type: 'announcement',
        title: announcement.title,
        content: announcement.content,
        sender: announcement.admin?.userName || (announcement.instructor ? `${announcement.instructor.firstName} ${announcement.instructor.lastName}`.trim() : 'System'),
        recipient: announcement.isGeneral ? 'All Users' : 'Specific Users',
        timestamp: announcement.createdAt.toISOString(),
        status: announcement.status.toLowerCase(),
        priority: announcement.priority.toLowerCase(),
        originalData: announcement,
      });
    }

    return NextResponse.json({ error: 'Invalid communication type' }, { status: 400 });
  } catch (error) {
    console.error('PATCH /api/communications/[id] error', error);
    return NextResponse.json({ error: 'Failed to update communication' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authorization: only ADMIN can delete
    const role = request.headers.get('x-user-role');
    if (!role || role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = params;
    const [type, originalId] = id.split('-');

    if (type === 'email') {
      await prisma.email.delete({
        where: { id: parseInt(originalId) },
      });
    } else if (type === 'announcement') {
      await prisma.announcement.delete({
        where: { announcementId: parseInt(originalId) },
      });
    } else {
      return NextResponse.json({ error: 'Invalid communication type' }, { status: 400 });
    }

    return NextResponse.json({ message: 'Communication deleted successfully' });
  } catch (error) {
    console.error('DELETE /api/communications/[id] error', error);
    return NextResponse.json({ error: 'Failed to delete communication' }, { status: 500 });
  }
}
