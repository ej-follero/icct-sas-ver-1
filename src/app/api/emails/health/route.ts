import { NextRequest, NextResponse } from 'next/server';
import { EmailService } from '@/lib/services/email.service';

export async function GET(request: NextRequest) {
  try {
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
