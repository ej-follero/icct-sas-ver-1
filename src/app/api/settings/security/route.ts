import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { SecurityLogger } from '@/lib/services/security-logger.service';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const settings = await prisma.securitySettings.findUnique({ 
      where: { id: 1 } 
    });
    
    if (!settings) {
      return NextResponse.json(
        { error: 'Security settings not found' }, 
        { status: 404 }
      );
    }
    
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching security settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch security settings' }, 
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const data = await req.json();
    
    // Validate required fields
    const requiredFields = [
      'minPasswordLength', 'requireUppercase', 'requireLowercase', 
      'requireNumbers', 'requireSpecialChars', 'passwordExpiryDays',
      'sessionTimeoutMinutes', 'maxConcurrentSessions', 
      'forceLogoutOnPasswordChange', 'twoFactorEnabled', 'twoFactorMethod',
      'backupCodesEnabled', 'maxLoginAttempts', 'lockoutDurationMinutes',
      'ipWhitelistEnabled', 'ipWhitelist', 'auditLoggingEnabled',
      'loginNotificationsEnabled', 'suspiciousActivityAlerts',
      'sslEnforcement', 'apiRateLimiting', 'dataEncryptionAtRest'
    ];
    
    for (const field of requiredFields) {
      if (data[field] === undefined) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` }, 
          { status: 400 }
        );
      }
    }
    
    const updated = await prisma.securitySettings.update({
      where: { id: 1 },
      data: {
        minPasswordLength: data.minPasswordLength,
        requireUppercase: data.requireUppercase,
        requireLowercase: data.requireLowercase,
        requireNumbers: data.requireNumbers,
        requireSpecialChars: data.requireSpecialChars,
        passwordExpiryDays: data.passwordExpiryDays,
        sessionTimeoutMinutes: data.sessionTimeoutMinutes,
        maxConcurrentSessions: data.maxConcurrentSessions,
        forceLogoutOnPasswordChange: data.forceLogoutOnPasswordChange,
        twoFactorEnabled: data.twoFactorEnabled,
        twoFactorMethod: data.twoFactorMethod,
        backupCodesEnabled: data.backupCodesEnabled,
        maxLoginAttempts: data.maxLoginAttempts,
        lockoutDurationMinutes: data.lockoutDurationMinutes,
        ipWhitelistEnabled: data.ipWhitelistEnabled,
        ipWhitelist: data.ipWhitelist,
        auditLoggingEnabled: data.auditLoggingEnabled,
        loginNotificationsEnabled: data.loginNotificationsEnabled,
        suspiciousActivityAlerts: data.suspiciousActivityAlerts,
        sslEnforcement: data.sslEnforcement,
        apiRateLimiting: data.apiRateLimiting,
        dataEncryptionAtRest: data.dataEncryptionAtRest,
      },
    });

    // Log the settings update
    try {
      const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
      await SecurityLogger.logSettingsUpdate(
        1, // Assuming admin user ID, you might want to get this from session
        ['Security settings updated'],
        ipAddress
      );
    } catch (error) {
      console.error('Failed to log settings update:', error);
    }
    
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating security settings:', error);
    return NextResponse.json(
      { error: 'Failed to update security settings' }, 
      { status: 500 }
    );
  }
} 