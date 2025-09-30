import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const securitySettingsSchema = z.object({
  minPasswordLength: z.number().min(6).max(32),
  requireUppercase: z.boolean(),
  requireLowercase: z.boolean(),
  requireNumbers: z.boolean(),
  requireSpecialChars: z.boolean(),
  passwordExpiryDays: z.number().min(30).max(365),
  sessionTimeoutMinutes: z.number().min(5).max(480),
  maxConcurrentSessions: z.number().min(1).max(10),
  forceLogoutOnPasswordChange: z.boolean(),
  twoFactorEnabled: z.boolean(),
  twoFactorMethod: z.enum(['EMAIL', 'APP']),
  backupCodesEnabled: z.boolean(),
  maxLoginAttempts: z.number().min(3).max(10),
  lockoutDurationMinutes: z.number().min(5).max(1440),
  ipWhitelistEnabled: z.boolean(),
  ipWhitelist: z.array(z.string()),
  auditLoggingEnabled: z.boolean(),
  loginNotificationsEnabled: z.boolean(),
  suspiciousActivityAlerts: z.boolean(),
  sslEnforcement: z.boolean(),
  apiRateLimiting: z.boolean(),
  dataEncryptionAtRest: z.boolean()
});

export async function GET() {
  try {
    const settings = await prisma.securitySettings.findUnique({
      where: { id: 1 }
    });

    if (!settings) {
      // Return default settings if none exist
      const defaultSettings = {
        minPasswordLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: false,
        passwordExpiryDays: 90,
        sessionTimeoutMinutes: 30,
        maxConcurrentSessions: 3,
        forceLogoutOnPasswordChange: true,
        twoFactorEnabled: false,
        twoFactorMethod: 'APP',
        backupCodesEnabled: true,
        maxLoginAttempts: 5,
        lockoutDurationMinutes: 15,
        ipWhitelistEnabled: false,
        ipWhitelist: [],
        auditLoggingEnabled: true,
        loginNotificationsEnabled: true,
        suspiciousActivityAlerts: true,
        sslEnforcement: true,
        apiRateLimiting: true,
        dataEncryptionAtRest: true
      };

      return NextResponse.json(defaultSettings);
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

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    
    // Validate the request body
    const validatedData = securitySettingsSchema.parse(body);

    // Update or create security settings
    const settings = await prisma.securitySettings.upsert({
      where: { id: 1 },
      update: {
        ...validatedData,
        updatedAt: new Date()
      },
      create: {
        id: 1,
        ...validatedData,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    // Log the security settings change
    await prisma.securityLog.create({
      data: {
        userId: 1, // TODO: Get from session
        eventType: 'SECURITY_SETTINGS_CHANGED',
        severity: 'MEDIUM',
        description: 'Security settings updated',
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      }
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error updating security settings:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid security settings data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update security settings' },
      { status: 500 }
    );
  }
}