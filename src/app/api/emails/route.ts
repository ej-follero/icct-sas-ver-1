import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import nodemailer from 'nodemailer';

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
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all';
    const status = searchParams.get('status') || 'all';
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const where: any = {};
    
    if (type !== 'all') {
      where.type = type;
    }
    
    if (status !== 'all') {
      where.status = status;
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
    const body = await request.json();
    const validatedData = emailSchema.parse(body);

    // Create email record
    const email = await prisma.email.create({
      data: {
        recipient: validatedData.to,
        subject: validatedData.subject,
        content: validatedData.body,
        type: validatedData.type || 'SENT',
        priority: validatedData.priority || 'NORMAL',
        status: 'PENDING',
        sender: 'system@icct.edu.ph' // TODO: Get from session
      }
    });

    // Send email using nodemailer
    try {
      const transporter = nodemailer.createTransporter({
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
          status: 'SENT'
        }
      });

    } catch (emailError) {
      console.error('Error sending email:', emailError);
      
      // Update email status to failed
      await prisma.email.update({
        where: { id: email.id },
        data: { 
          status: 'FAILED'
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