import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import nodemailer from 'nodemailer';
import { EmailStatus, EmailFolder, Priority } from '@prisma/client';

async function assertRole(request: NextRequest, allowed: Array<'SUPER_ADMIN' | 'ADMIN' | 'INSTRUCTOR'>) {
  const token = request.cookies.get('token')?.value;
  const isDev = process.env.NODE_ENV !== 'production';
  if (!token) return isDev ? { ok: true, email: 'dev@example.com', role: 'ADMIN' } as const : { ok: false, res: NextResponse.json({ error: 'Authentication required' }, { status: 401 }) };
  try {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const role = decoded.role as string | undefined;
    const email = decoded.email as string | undefined;
    if (!role || !allowed.includes(role as any)) {
      return { ok: false, res: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
    }
    return { ok: true, role: role as any, email: email || 'system@icct.edu.ph' } as const;
  } catch {
    return { ok: false, res: NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 }) };
  }
}

const emailSchema = z.object({
  to: z.string().email(),
  subject: z.string().min(1).max(200),
  body: z.string().min(1),
  type: z.enum(['INBOX', 'SENT', 'DRAFT', 'FAILED']).optional(),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).optional(),
  attachments: z.array(z.object({
    filename: z.string(),
    content: z.string(),
    contentType: z.string()
  })).optional()
});

export async function GET(request: NextRequest) {
  try {
    const gate = await assertRole(request, ['SUPER_ADMIN', 'ADMIN', 'INSTRUCTOR']);
    if (!('ok' in gate) || gate.ok !== true) return gate.res;
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all';
    const status = searchParams.get('status') || 'all';
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const where: any = {};
    
    if (type !== 'all') {
      const upper = type.toUpperCase();
      if (upper in EmailFolder) where.type = upper as EmailFolder;
    }
    
    if (status !== 'all') {
      const upper = status.toUpperCase();
      if (upper in EmailStatus) where.status = upper as EmailStatus;
    }

    if (search) {
      where.OR = [
        { subject: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
        { recipient: { contains: search, mode: 'insensitive' } },
        { sender: { contains: search, mode: 'insensitive' } }
      ];
    }

    const emails = await prisma.email.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    });

    const total = await prisma.email.count({ where });

    return NextResponse.json({
      data: emails,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching emails:', error);
    return NextResponse.json(
      { error: 'Failed to fetch emails' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const gate = await assertRole(request, ['SUPER_ADMIN', 'ADMIN']);
    if (!('ok' in gate) || gate.ok !== true) return gate.res;
    const senderFromJwt = (gate as any).email as string;
    const body = await request.json();
    const validatedData = emailSchema.parse(body);

    // Create email record
    const email = await prisma.email.create({
      data: {
        recipient: validatedData.to,
        subject: validatedData.subject,
        content: validatedData.body,
        type: (validatedData.type || 'SENT') as EmailFolder,
        priority: (validatedData.priority || 'NORMAL') as Priority,
        status: EmailStatus.PENDING,
        sender: process.env.SMTP_FROM || senderFromJwt
      }
    });

    // Send email using nodemailer
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });

      const mailOptions = {
        from: process.env.SMTP_FROM,
        to: validatedData.to,
        subject: validatedData.subject,
        html: validatedData.body,
        attachments: validatedData.attachments?.map(att => ({
          filename: att.filename,
          content: att.content,
          contentType: att.contentType
        }))
      };

      await transporter.sendMail(mailOptions);

      // Update email status to sent
      await prisma.email.update({
        where: { id: email.id },
        data: { 
          status: EmailStatus.SENT
        }
      });

    } catch (emailError) {
      console.error('Error sending email:', emailError);
      
      // Update email status to failed
      await prisma.email.update({
        where: { id: email.id },
        data: { 
          status: EmailStatus.FAILED
        }
      });
    }

    return NextResponse.json({ data: email });
  } catch (error) {
    console.error('Error creating email:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid email data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create email' },
      { status: 500 }
    );
  }
}