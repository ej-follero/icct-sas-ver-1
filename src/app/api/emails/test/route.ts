import { NextRequest, NextResponse } from 'next/server';
import { EmailService } from '@/lib/services/email.service';

async function assertAdmin(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const isDev = process.env.NODE_ENV !== 'production';
  if (!token) return isDev ? { ok: true, email: 'dev@example.com', role: 'ADMIN' } as const : { ok: false, res: NextResponse.json({ error: 'Authentication required' }, { status: 401 }) };
  try {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const role = decoded.role as string | undefined;
    const email = decoded.email as string | undefined;
    if (!role || (role !== 'SUPER_ADMIN' && role !== 'ADMIN')) {
      return { ok: false, res: NextResponse.json({ error: 'Only administrators can send test emails' }, { status: 403 }) };
    }
    return { ok: true, email: email || 'admin@example.com', role } as const;
  } catch {
    return { ok: false, res: NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 }) };
  }
}

export async function POST(request: NextRequest) {
  try {
    const gate = await assertAdmin(request);
    if (!('ok' in gate) || gate.ok !== true) return gate.res;
    const senderEmail = (gate as any).email as string;

    const body = await request.json();
    const { testEmail } = body;

    if (!testEmail) {
      return NextResponse.json({ error: 'Test email address is required' }, { status: 400 });
    }

    const emailService = new EmailService();
    
    // Send test email
    const success = await emailService.sendGeneralNotificationEmail(
      testEmail,
      'ICCT Smart Attendance System - Test Email',
      `This is a test email from the ICCT Smart Attendance System.\n\nIf you received this email, the email service is working correctly.\n\nSent by: ${senderEmail}\nTimestamp: ${new Date().toISOString()}`,
      'Test User'
    );

    if (success) {
      return NextResponse.json({
        success: true,
        message: 'Test email sent successfully',
        recipient: testEmail,
        timestamp: new Date().toISOString()
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'Failed to send test email',
        recipient: testEmail,
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Test email error:', error);
    return NextResponse.json({
      success: false,
      message: 'Test email failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
