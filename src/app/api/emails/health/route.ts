import { NextRequest, NextResponse } from 'next/server';
import { EmailService } from '@/lib/services/email.service';

async function assertAdmin(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const isDev = process.env.NODE_ENV !== 'production';
  if (!token) return isDev ? { ok: true } as const : { ok: false, res: NextResponse.json({ error: 'Authentication required' }, { status: 401 }) };
  try {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const role = decoded.role as string | undefined;
    if (!role || (role !== 'SUPER_ADMIN' && role !== 'ADMIN')) {
      return { ok: false, res: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
    }
    return { ok: true } as const;
  } catch {
    return { ok: false, res: NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 }) };
  }
}

export async function GET(request: NextRequest) {
  try {
    const gate = await assertAdmin(request);
    if (!('ok' in gate) || gate.ok !== true) return gate.res;
    // Check if email service is properly configured
    const emailService = new EmailService();
    
    // Test SMTP connection
    const isHealthy = await emailService.testConnection();
    
    if (isHealthy) {
      return NextResponse.json({
        status: 'healthy',
        message: 'Email service is properly configured and working',
        timestamp: new Date().toISOString()
      });
    } else {
      return NextResponse.json({
        status: 'unhealthy',
        message: 'Email service configuration issue',
        timestamp: new Date().toISOString()
      }, { status: 503 });
    }
  } catch (error) {
    console.error('Email health check failed:', error);
    return NextResponse.json({
      status: 'error',
      message: 'Email service health check failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
