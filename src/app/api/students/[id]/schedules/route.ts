import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    // JWT Authentication (SUPER_ADMIN, ADMIN, DEPARTMENT_HEAD, INSTRUCTOR)
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const reqUserId = Number((decoded as any)?.userId);
    if (!Number.isFinite(reqUserId)) {
      return NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 });
    }

    const reqUser = await prisma.user.findUnique({ where: { userId: reqUserId }, select: { status: true, role: true } });
    if (!reqUser || reqUser.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'User not found or inactive' }, { status: 401 });
    }
    const allowedRoles = ['SUPER_ADMIN', 'ADMIN', 'DEPARTMENT_HEAD', 'INSTRUCTOR'];
    if (!allowedRoles.includes(reqUser.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { scheduleId, notes } = await request.json();
    const studentId = Number(id);
    if (!studentId || !scheduleId) {
      return NextResponse.json({ error: 'studentId and scheduleId are required' }, { status: 400 });
    }

    // Validate entities
    const [student, schedule] = await Promise.all([
      prisma.student.findUnique({ where: { studentId } }),
      prisma.subjectSchedule.findUnique({ where: { subjectSchedId: Number(scheduleId) } }),
    ]);
    if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    if (!schedule) return NextResponse.json({ error: 'Schedule not found' }, { status: 404 });

    const upsert = await prisma.studentSchedule.upsert({
      where: { studentId_scheduleId: { studentId, scheduleId: Number(scheduleId) } },
      update: { status: 'ACTIVE', notes: notes || null },
      create: { studentId, scheduleId: Number(scheduleId), status: 'ACTIVE', notes: notes || null },
      include: { schedule: true },
    });

    return NextResponse.json({ success: true, data: upsert });
  } catch (error) {
    console.error('Add student schedule error:', error);
    return NextResponse.json({ error: 'Failed to assign schedule to student' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    // JWT Authentication (SUPER_ADMIN, ADMIN, DEPARTMENT_HEAD, INSTRUCTOR)
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const reqUserId = Number((decoded as any)?.userId);
    if (!Number.isFinite(reqUserId)) {
      return NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 });
    }

    const reqUser = await prisma.user.findUnique({ where: { userId: reqUserId }, select: { status: true, role: true } });
    if (!reqUser || reqUser.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'User not found or inactive' }, { status: 401 });
    }
    const allowedRoles = ['SUPER_ADMIN', 'ADMIN', 'DEPARTMENT_HEAD', 'INSTRUCTOR'];
    if (!allowedRoles.includes(reqUser.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const scheduleId = Number(searchParams.get('scheduleId'));
    const studentId = Number(id);
    if (!studentId || !scheduleId) {
      return NextResponse.json({ error: 'studentId and scheduleId are required' }, { status: 400 });
    }

    await prisma.studentSchedule.delete({
      where: { studentId_scheduleId: { studentId, scheduleId } },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Remove student schedule error:', error);
    return NextResponse.json({ error: 'Failed to remove schedule from student' }, { status: 500 });
  }
}


