import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

async function assertAdmin(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  if (!token) return { ok: false, res: NextResponse.json({ error: 'Authentication required' }, { status: 401 }) };
  try {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId as number;
    const user = await prisma.user.findUnique({ where: { userId }, select: { role: true } });
    if (!user || (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN')) {
      return { ok: false, res: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
    }
    return { ok: true } as const;
  } catch {
    return { ok: false, res: NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 }) };
  }
}

export async function GET(request: NextRequest) {
  try {
    const gate = await assertAdmin(request);
    if (!('ok' in gate) || gate.ok !== true) return gate.res;

    const backups = await prisma.backup.findMany({
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({
      success: true,
      items: backups,
      total: backups.length
    });
  } catch (error) {
    console.error('Error fetching backups:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch backups',
        items: [],
        total: 0
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const gate = await assertAdmin(request);
    if (!('ok' in gate) || gate.ok !== true) return gate.res;
    const body = await request.json();
    const { name, description, type, location, createdBy } = body;

    const backup = await prisma.backup.create({
      data: {
        name,
        description,
        type,
        location,
        createdBy,
        status: 'IN_PROGRESS',
        size: '0 MB'
      }
    });

    return NextResponse.json({
      success: true,
      item: backup
    });
  } catch (error) {
    console.error('Error creating backup:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create backup'
      },
      { status: 500 }
    );
  }
}