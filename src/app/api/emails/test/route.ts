import { NextRequest, NextResponse } from 'next/server';
import { EmailService } from '@/lib/services/email.service';

export async function POST(request: NextRequest) {
  try {
    // Get user info from middleware headers
    const userId = request.headers.get('x-user-id');
    const userEmail = request.headers.get('x-user-email');
    const userRole = request.headers.get('x-user-role');
    
    if (!userId || !userEmail) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

    // Only allow ADMIN users to send test emails
    if (userRole !== 'ADMIN') {
      return NextResponse.json({ error: 'Only administrators can send test emails' }, { status: 403 });
    }

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
      `This is a test email from the ICCT Smart Attendance System.\n\nIf you received this email, the email service is working correctly.\n\nSent by: ${userEmail}\nTimestamp: ${new Date().toISOString()}`,
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
