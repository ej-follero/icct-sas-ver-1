import { NextResponse } from 'next/server';
import { env } from '@/lib/env-validation';

export async function POST() {
  // Clear the auth token cookie
  const response = NextResponse.json({ success: true, message: 'Logged out successfully.' });
  response.cookies.set('token', '', {
    httpOnly: true,
    secure: env.SECURE_COOKIES,
    sameSite: 'strict',
    expires: new Date(0), // Expire immediately
    path: '/',
  });
  return response;
} 