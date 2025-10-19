import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { EmailStatus, EmailFolder, Priority } from '@prisma/client';

async function assertRole(request: NextRequest, allowed: Array<'SUPER_ADMIN' | 'ADMIN' | 'INSTRUCTOR'>) {
  const token = request.cookies.get('token')?.value;
  const isDev = process.env.NODE_ENV !== 'production';
  if (!token) return isDev ? { ok: true, role: undefined } as const : { ok: false, res: NextResponse.json({ error: 'Authentication required' }, { status: 401 }) };
  try {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const role = decoded.role as string | undefined;
    if (!role || !allowed.includes(role as any)) {
      return { ok: false, res: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
    }
    return { ok: true, role: role as 'SUPER_ADMIN' | 'ADMIN' | 'INSTRUCTOR' } as const;
  } catch {
    return { ok: false, res: NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 }) };
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Authorization: SUPER_ADMIN, ADMIN, INSTRUCTOR
    const gate = await assertRole(request, ['SUPER_ADMIN', 'ADMIN', 'INSTRUCTOR']);
    if (!('ok' in gate) || gate.ok !== true) return gate.res;
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
    // Authorization: SUPER_ADMIN, ADMIN, INSTRUCTOR (non-admin cannot alter status/priority)
    const gate = await assertRole(request, ['SUPER_ADMIN', 'ADMIN', 'INSTRUCTOR']);
    if (!('ok' in gate) || gate.ok !== true) return gate.res;
    const role = (gate as any).role as 'SUPER_ADMIN' | 'ADMIN' | 'INSTRUCTOR' | undefined;
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
    if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
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


