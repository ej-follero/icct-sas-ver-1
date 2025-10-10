import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // JWT Authentication (SUPER_ADMIN, ADMIN, DEPARTMENT_HEAD, INSTRUCTOR)
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

    const user = await prisma.user.findUnique({
      where: { userId },
      select: { status: true, role: true }
    });
    if (!user || user.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'User not found or inactive' }, { status: 401 });
    }
    const allowedRoles = ['SUPER_ADMIN', 'ADMIN', 'DEPARTMENT_HEAD', 'INSTRUCTOR'];
    if (!allowedRoles.includes(user.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || undefined; // SemesterStatus
    const isActive = searchParams.get('isActive');
    const year = searchParams.get('year');

    const where: any = {};
    if (status && status !== 'all') where.status = status;
    if (isActive === 'true') where.isActive = true;
    if (isActive === 'false') where.isActive = false;
    if (year && !Number.isNaN(Number(year))) where.year = Number(year);
    
    const semesters = await prisma.semester.findMany({
      where,
      select: {
        semesterId: true,
        year: true,
        semesterType: true,
        status: true,
        isActive: true
      },
      orderBy: [
        { year: 'desc' },
        { semesterType: 'asc' }
      ],
    });

    return NextResponse.json({ data: semesters });
  } catch (error) {
    console.error('Error fetching semesters:', error);
    return NextResponse.json(
      { error: 'Failed to fetch semesters' },
      { status: 500 }
    );
  }
}
