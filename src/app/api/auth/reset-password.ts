import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const { token, newPassword } = await request.json();
    if (!token || !newPassword) {
      return NextResponse.json({ error: 'Token and new password are required.' }, { status: 400 });
    }
    // Find the reset token
    const resetToken = await prisma.passwordResetToken.findUnique({ where: { token } });
    if (!resetToken || resetToken.expiresAt < new Date()) {
      return NextResponse.json({ error: 'Invalid or expired token.' }, { status: 400 });
    }
    // Hash the new password
    const passwordHash = await bcrypt.hash(newPassword, 10);
    // Update the user's password
    await prisma.user.update({
      where: { userId: resetToken.userId },
      data: { passwordHash },
    });
    // Delete the token
    await prisma.passwordResetToken.delete({ where: { token } });
    return NextResponse.json({ message: 'Password has been reset successfully.' }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 