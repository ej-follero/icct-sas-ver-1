import { NextResponse } from 'next/server';
import { cookies, headers } from 'next/headers';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { env } from '@/lib/env-validation';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = jwt.verify(token, env.JWT_SECRET) as { userId: number };
    const user = await prisma.user.findUnique({
      where: { userId: payload.userId },
      include: { Student: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // For instructors, find the instructor record by email
    let instructor = null;
    if (user.role === 'INSTRUCTOR') {
      instructor = await prisma.instructor.findUnique({
        where: { email: user.email }
      });
    }

    return NextResponse.json({
      id: user.userId,
      email: user.email,
      role: user.role, // e.g., ADMIN | INSTRUCTOR | STUDENT
      status: user.status,
      student: user.Student,
      instructor: instructor,
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (e) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}


