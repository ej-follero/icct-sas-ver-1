import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { EmailStatus, EmailFolder, Priority, Prisma } from '@prisma/client';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Authorization: allow ADMIN and INSTRUCTOR
    const role = _request.headers.get('x-user-role');
    // Allow unauthenticated access in development to avoid blocking local testing
    const isDev = process.env.NODE_ENV !== 'production';
    if (!isDev) {
      if (!role || (role !== 'ADMIN' && role !== 'INSTRUCTOR')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }
    const { id } = await params;
    const item = await prisma.email.findUnique({ 
      where: { id }, 
      include: { 
        recipients: true, 
        attachments: true 
      } 
    });
    if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(item);
  } catch (error) {
    console.error('GET /api/emails/[id] error', error);
    return NextResponse.json({ error: 'Failed to fetch email' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Authorization: allow ADMIN and INSTRUCTOR to update read/star/folder; restrict status
    const role = request.headers.get('x-user-role');
    // Allow unauthenticated access in development to avoid blocking local testing
    const isDev = process.env.NODE_ENV !== 'production';
    if (!isDev) {
      if (!role || (role !== 'ADMIN' && role !== 'INSTRUCTOR')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }
    const { id } = await params;
    const body = await request.json();
    const data: Partial<{ status: EmailStatus; type: EmailFolder; isRead: boolean; isStarred: boolean; isImportant: boolean; priority: Priority }>
      = {};

    if (typeof body.status === 'string') data.status = body.status as EmailStatus;
    if (typeof body.type === 'string') data.type = body.type as EmailFolder;
    if (typeof body.isRead === 'boolean') data.isRead = body.isRead;
    if (typeof body.isStarred === 'boolean') data.isStarred = body.isStarred;
    if (typeof body.isImportant === 'boolean') data.isImportant = body.isImportant;
    if (typeof body.priority === 'string') data.priority = body.priority as Priority;

    // If non-admin, prevent modifying certain fields (e.g., status, priority)
    if (role !== 'ADMIN') {
      delete (data as any).status;
      delete (data as any).priority;
    }

    const updated = await prisma.email.update({ where: { id }, data });
    return NextResponse.json(updated);
  } catch (error) {
    console.error('PATCH /api/emails/[id] error', error);
    return NextResponse.json({ error: 'Failed to update email' }, { status: 500 });
  }
}


