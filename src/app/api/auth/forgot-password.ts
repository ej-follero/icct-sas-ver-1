import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    if (!email) {
      return NextResponse.json({ error: 'Email is required.' }, { status: 400 });
    }
    const user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      // Generate a secure token
      const token = crypto.randomBytes(32).toString('hex');
      const expires = new Date(Date.now() + 1000 * 60 * 60); // 1 hour

      // Store token in DB
      await prisma.passwordResetToken.create({
        data: {
          token,
          userId: user.userId,
          expiresAt: expires,
        },
      });

      // Log the reset link (replace with email logic in production)
      const resetUrl = `https://yourdomain.com/reset-password?token=${token}`;
      console.log(`Password reset link for ${user.email}: ${resetUrl}`);
    }
    // Always return success for security
    return NextResponse.json({ message: 'If an account with that email exists, a reset link has been sent.' }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 