import { NextResponse } from 'next/server';
import { cookies, headers } from 'next/headers';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { env } from '@/lib/env-validation';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const startTime = Date.now();
  
  try {
    console.log('🔍 [AUTH/ME] Starting user authentication check');
    
    // Check database connection first
    try {
      await prisma.$queryRaw`SELECT 1`;
      console.log('✅ [AUTH/ME] Database connection verified');
    } catch (dbError) {
      console.error('❌ [AUTH/ME] Database connection failed:', dbError);
      return NextResponse.json({ 
        error: 'Database connection failed',
        details: process.env.NODE_ENV === 'development' ? String(dbError) : undefined
      }, { status: 503 });
    }

    const cookieStore = await cookies();
    let token = cookieStore.get('token')?.value as string | undefined;
    
    if (!token) {
      const hdrs = await headers();
      const auth = hdrs.get('authorization');
      if (auth && auth.startsWith('Bearer ')) token = auth.slice(7);
      if (!token) {
        const cookieHeader = hdrs.get('cookie') || '';
        token = cookieHeader
          .split(';')
          .map((s: string) => s.trim())
          .find((s: string) => s.startsWith('token='))
          ?.split('=')[1];
      }
    }
    
    if (!token) {
      console.log('❌ [AUTH/ME] No token found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🔑 [AUTH/ME] Token found, verifying JWT...');
    const payload = jwt.verify(token, env.JWT_SECRET) as { userId: number };
    console.log('✅ [AUTH/ME] JWT verified for user ID:', payload.userId);

    console.log('👤 [AUTH/ME] Fetching user data from database...');
    const user = await prisma.user.findUnique({
      where: { userId: payload.userId },
      include: { Student: true },
    });

    if (!user) {
      console.log('❌ [AUTH/ME] User not found in database');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('✅ [AUTH/ME] User found:', user.email, 'Role:', user.role);

    // For instructors, find the instructor record by email
    let instructor = null;
    if (user.role === 'INSTRUCTOR') {
      console.log('👨‍🏫 [AUTH/ME] Fetching instructor details...');
      instructor = await prisma.instructor.findUnique({
        where: { email: user.email }
      });
    }

    const responseTime = Date.now() - startTime;
    console.log(`✅ [AUTH/ME] Request completed in ${responseTime}ms`);

    return NextResponse.json({
      id: user.userId,
      email: user.email,
      role: user.role, // e.g., ADMIN | INSTRUCTOR | STUDENT
      status: user.status,
      student: user.Student,
      instructor: instructor,
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (e: any) {
    const responseTime = Date.now() - startTime;
    console.error(`❌ [AUTH/ME] Error after ${responseTime}ms:`, e);
    
    // Provide more specific error information in development
    if (process.env.NODE_ENV === 'development') {
      return NextResponse.json({ 
        error: 'Authentication failed',
        details: e.message,
        responseTime: `${responseTime}ms`
      }, { status: 401 });
    }
    
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}


