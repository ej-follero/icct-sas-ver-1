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
    
    // Check database connection first with timeout
    try {
      const dbStartTime = Date.now();
      await Promise.race([
        prisma.$queryRaw`SELECT 1`,
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Database connection timeout')), 2000)
        )
      ]);
      const dbTime = Date.now() - dbStartTime;
      console.log(`✅ [AUTH/ME] Database connection verified in ${dbTime}ms`);
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
      console.log('❌ [AUTH/ME] No token found - returning 401 immediately');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🔑 [AUTH/ME] Token found, verifying JWT...');
    const jwtStartTime = Date.now();
    let payload: { userId: number };
    try {
      payload = await Promise.race([
        Promise.resolve(jwt.verify(token, env.JWT_SECRET) as { userId: number }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('JWT verification timeout')), 3000)
        )
      ]) as { userId: number };
    } catch (jwtError) {
      console.error('❌ [AUTH/ME] JWT verification failed:', jwtError);
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    const jwtTime = Date.now() - jwtStartTime;
    console.log(`✅ [AUTH/ME] JWT verified for user ID: ${payload.userId} in ${jwtTime}ms`);

    console.log('👤 [AUTH/ME] Fetching user data from database...');
    const userStartTime = Date.now();
    const user = await Promise.race([
      prisma.user.findUnique({
        where: { userId: payload.userId },
        include: { Student: true },
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('User fetch timeout')), 3000)
      )
    ]) as any;
    const userTime = Date.now() - userStartTime;
    console.log(`✅ [AUTH/ME] User fetched in ${userTime}ms`);

    if (!user) {
      console.log('❌ [AUTH/ME] User not found in database');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('✅ [AUTH/ME] User found:', user.email, 'Role:', user.role);

    // For instructors, find the instructor record by email
    let instructor = null;
    if (user.role === 'INSTRUCTOR') {
      console.log('👨‍🏫 [AUTH/ME] Fetching instructor details...');
      const instructorStartTime = Date.now();
      try {
        instructor = await Promise.race([
          prisma.instructor.findUnique({
            where: { email: user.email }
          }),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Instructor fetch timeout')), 2000)
          )
        ]) as any;
        const instructorTime = Date.now() - instructorStartTime;
        console.log(`✅ [AUTH/ME] Instructor fetched in ${instructorTime}ms`);
      } catch (instructorError) {
        console.warn('⚠️ [AUTH/ME] Instructor fetch failed, continuing without instructor data:', instructorError);
        instructor = null;
      }
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


