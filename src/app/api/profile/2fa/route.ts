import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';

const toggle2FASchema = z.object({
  enabled: z.boolean()
});

const verify2FASchema = z.object({
  token: z.string().min(6, 'Token must be at least 6 characters')
});

export async function GET(request: NextRequest) {
  try {
    // Get user ID from JWT token in cookies
    const token = request.cookies.get('token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verify JWT token and extract user ID
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userIdRaw = (decoded as any)?.userId;
    const userId = Number(userIdRaw);
    if (!Number.isFinite(userId)) {
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { userId },
      select: {
        twoFactorEnabled: true,
        twoFactorSecret: true
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      data: {
        enabled: user.twoFactorEnabled,
        hasSecret: !!user.twoFactorSecret
      }
    });

  } catch (error) {
    console.error('Error fetching 2FA status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch 2FA status' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { enabled } = toggle2FASchema.parse(body);
    
    // Get user ID from JWT token in cookies
    const token = request.cookies.get('token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verify JWT token and extract user ID
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userIdRaw = (decoded as any)?.userId;
    const userId = Number(userIdRaw);
    if (!Number.isFinite(userId)) {
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      );
    }

    if (enabled) {
      // Generate new 2FA secret
      // Fetch user to get email for label; token may not include email consistently
      const user = await prisma.user.findUnique({ where: { userId } });
      const emailLabel = user?.email || 'user';
      const secret = speakeasy.generateSecret({
        name: `ICCT Smart Attendance System (${emailLabel})`,
        issuer: 'ICCT Smart Attendance System'
      });

      // Generate QR code
      const qrCodeUrl = secret.otpauth_url ? await QRCode.toDataURL(secret.otpauth_url) : undefined;

      // Update user with 2FA secret
      await prisma.user.update({
        where: { userId },
        data: {
          twoFactorSecret: secret.base32,
          twoFactorEnabled: false // Will be enabled after verification
        }
      });

      return NextResponse.json({
        data: {
          secret: secret.base32,
          qrCodeUrl,
          manualEntryKey: secret.base32
        },
        message: '2FA setup initiated. Please scan the QR code or enter the manual key.'
      });

    } else {
      // Disable 2FA
      await prisma.user.update({
        where: { userId },
        data: {
          twoFactorEnabled: false,
          twoFactorSecret: null
        }
      });

      return NextResponse.json({
        data: { enabled: false },
        message: '2FA has been disabled successfully.'
      });
    }

  } catch (error) {
    console.error('Error toggling 2FA:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to toggle 2FA' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = verify2FASchema.parse(body);
    
    // Get user ID from JWT token in cookies
    const authToken = request.cookies.get('token')?.value;
    
    if (!authToken) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verify JWT token and extract user ID
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(authToken, process.env.JWT_SECRET);
    const userIdRaw = (decoded as any)?.userId;
    const userId = Number(userIdRaw);
    if (!Number.isFinite(userId)) {
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { userId },
      select: { twoFactorSecret: true }
    });

    if (!user || !user.twoFactorSecret) {
      return NextResponse.json(
        { error: '2FA not set up' },
        { status: 400 }
      );
    }

    // Verify the token
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token,
      window: 2
    });

    if (verified) {
      // Enable 2FA
      await prisma.user.update({
        where: { userId },
        data: { twoFactorEnabled: true }
      });

      return NextResponse.json({
        data: { enabled: true },
        message: '2FA has been enabled successfully.'
      });
    } else {
      return NextResponse.json(
        { error: 'Invalid verification code' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Error verifying 2FA:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to verify 2FA' },
      { status: 500 }
    );
  }
}
