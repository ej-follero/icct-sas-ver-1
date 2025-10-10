import { NextRequest, NextResponse } from 'next/server';
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

export async function GET(request: NextRequest) {
  try {
    // JWT Authentication - Admin only
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = Number((decoded as any)?.userId);
    if (!Number.isFinite(userId)) {
      return NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 });
    }

    // Check user exists and is active
    const user = await prisma.user.findUnique({
      where: { userId },
      select: { status: true, role: true }
    });

    if (!user || user.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'User not found or inactive' }, { status: 401 });
    }

    // Admin-only access control
    const adminRoles = ['SUPER_ADMIN', 'ADMIN'];
    if (!adminRoles.includes(user.role)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

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

export async function PUT(request: NextRequest) {
  try {
    // JWT Authentication - Admin only
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = Number((decoded as any)?.userId);
    if (!Number.isFinite(userId)) {
      return NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 });
    }

    // Check user exists and is active
    const user = await prisma.user.findUnique({
      where: { userId },
      select: { status: true, role: true }
    });

    if (!user || user.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'User not found or inactive' }, { status: 401 });
    }

    // Admin-only access control
    const adminRoles = ['SUPER_ADMIN', 'ADMIN'];
    if (!adminRoles.includes(user.role)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    
    // Validate the request body
    const validatedData = securitySettingsSchema.parse(body);

    // Update or create security settings
    const settings = await prisma.securitySettings.upsert({
      where: { id: 1 },
      update: {
        ...validatedData
      },
      create: {
        id: 1,
        ...validatedData
      }
    });

    // Log the security settings change (align with SecurityLog schema)
    await prisma.securityLog.create({
      data: {
        userId,
        level: 'INFO',
        module: 'SECURITY',
        action: 'UPDATE_SETTINGS',
        eventType: 'SECURITY_SETTINGS_CHANGED',
        severity: 'MEDIUM',
        message: 'Security settings updated',
        ipAddress: request.headers.get('x-forwarded-for') || undefined,
        userAgent: request.headers.get('user-agent') || undefined,
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