import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma, Priority, EmailStatus, EmailFolder } from '@prisma/client';
import { EmailService } from '@/lib/services/email.service';

export async function GET(request: NextRequest) {
  try {
    // Authorization: allow ADMIN and INSTRUCTOR (set by middleware header)
    const role = request.headers.get('x-user-role');
    // Allow unauthenticated access in development to avoid blocking local testing
    const isDev = process.env.NODE_ENV !== 'production';
    if (!isDev) {
      if (!role || (role !== 'ADMIN' && role !== 'INSTRUCTOR')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }
    const { searchParams } = new URL(request.url);
    const search = (searchParams.get('search') || '').trim();
    const status = searchParams.get('status') as EmailStatus | 'all' | null;
    const priority = searchParams.get('priority') as Priority | 'all' | null;
    const folder = searchParams.get('folder') as EmailFolder | 'all' | null;
    const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1);
    const pageSize = Math.min(Math.max(parseInt(searchParams.get('pageSize') || '20', 10), 1), 100);
    const sortByParam = (searchParams.get('sortBy') || 'timestamp') as string;
    const sortOrderParam = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc';

    const sortWhitelist: Record<string, true> = {
      timestamp: true,
      subject: true,
      sender: true,
      status: true,
      priority: true,
    };
    const sortBy = sortWhitelist[sortByParam] ? (sortByParam as any) : 'timestamp';
    const sortOrder = sortOrderParam === 'asc' ? 'asc' : 'desc';
    const skip = (page - 1) * pageSize;

    const where: Prisma.EmailWhereInput = {
      AND: [
        status && status !== 'all' ? { status } : {},
        priority && priority !== 'all' ? { priority } : {},
        folder && folder !== 'all' ? { type: folder as EmailFolder } : {},
        search
          ? {
              OR: [
                { subject: { contains: search, mode: 'insensitive' } },
                { sender: { contains: search, mode: 'insensitive' } },
                { recipient: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {},
      ],
    };

    const [items, total] = await Promise.all([
      prisma.email.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        take: pageSize,
        skip,
      }),
      prisma.email.count({ where }),
    ]);

    // Server-side stats (global, not limited by current filters)
    const [inbox, sentCount, draft, spam, trash, unread, failedTotal] = await Promise.all([
      prisma.email.count({ where: { type: 'INBOX' } }),
      prisma.email.count({ where: { type: 'SENT' } }),
      prisma.email.count({ where: { type: 'DRAFT' } }),
      prisma.email.count({ where: { type: 'SPAM' } }),
      prisma.email.count({ where: { type: 'TRASH' } }),
      prisma.email.count({ where: { isRead: false } }),
      prisma.email.count({ where: { status: 'FAILED' } }),
    ]);

    const stats = {
      totalAll: inbox + sentCount + draft + spam + trash,
      byFolder: { inbox, sent: sentCount, draft, spam, trash },
      unread,
      failed: failedTotal,
    };

    return NextResponse.json({ items, total, page, pageSize, stats });
  } catch (error) {
    console.error('GET /api/emails error', error);
    return NextResponse.json({ error: 'Failed to fetch emails' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Authorization: only ADMIN can create (adjust if instructors should also send)
    const role = request.headers.get('x-user-role');
    if (!role || role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const {
      subject,
      sender,
      recipient,
      content,
      priority = 'NORMAL',
      type = 'SENT',
      status = 'PENDING',
      recipients = [], // optional detailed recipients [{ address, rtype }]
      attachments = [], // optional attachments [{ name, url }]
    } = body as {
      subject: string;
      sender: string;
      recipient: string;
      content: string;
      priority?: Priority;
      type?: EmailFolder;
      status?: EmailStatus;
      recipients?: Array<{ address: string; rtype: 'TO' | 'CC' | 'BCC' }>;
      attachments?: Array<{ name: string; url: string }>;
    };

    if (!subject || !sender || !recipient || !content) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Create email record in database first
    const created = await prisma.email.create({
      data: {
        subject,
        sender,
        recipient,
        content,
        priority,
        type,
        status,
        recipients: recipients.length
          ? {
              createMany: {
                data: recipients.map((r) => ({ address: r.address, rtype: r.rtype })),
              },
            }
          : undefined,
        attachments: attachments.length
          ? {
              createMany: {
                data: attachments.map((a) => ({ name: a.name, url: a.url })),
              },
            }
          : undefined,
      },
    });

    // Send actual email if status is SENT or PENDING
    if (status === 'SENT' || status === 'PENDING') {
      try {
        const emailService = new EmailService();
        
        // Prepare recipients list for email sending
        const toRecipients = recipients.filter(r => r.rtype === 'TO').map(r => r.address);
        const ccRecipients = recipients.filter(r => r.rtype === 'CC').map(r => r.address);
        const bccRecipients = recipients.filter(r => r.rtype === 'BCC').map(r => r.address);
        
        // Combine all recipients for the "to" field
        const allRecipients = [...toRecipients, ...ccRecipients, ...bccRecipients];
        if (allRecipients.length === 0) {
          allRecipients.push(recipient); // fallback to main recipient
        }

        // Send email
        const emailSent = await emailService.sendEmail({
          to: allRecipients.join(', '),
          subject,
          html: content,
          from: sender,
        });

        // Update email status based on sending result
        const finalStatus = emailSent ? 'SENT' : 'FAILED';
        await prisma.email.update({
          where: { id: created.id },
          data: { status: finalStatus },
        });

        // Update the created object to reflect the final status
        created.status = finalStatus as EmailStatus;

      } catch (emailError) {
        console.error('Email sending failed:', emailError);
        
        // Update status to FAILED
        await prisma.email.update({
          where: { id: created.id },
          data: { status: 'FAILED' },
        });
        
        created.status = 'FAILED' as EmailStatus;
      }
    }

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error('POST /api/emails error', error);
    return NextResponse.json({ error: 'Failed to create email' }, { status: 500 });
  }
}


