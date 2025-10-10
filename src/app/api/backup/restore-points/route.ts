import { NextRequest, NextResponse } from "next/server";
import { restoreService } from "@/lib/services/restore.service";
import { prisma } from "@/lib/prisma";
// Note: These imports are commented out as they may not exist in the current setup
// import { getServerSession } from "next-auth";
// import { authOptions } from "@/lib/auth";

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
    return { ok: true, userId } as const;
  } catch {
    return { ok: false, res: NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 }) };
  }
}

export async function GET(request: NextRequest) {
  try {
    const gate = await assertAdmin(request);
    if (!('ok' in gate) || gate.ok !== true) return gate.res;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const backupId = searchParams.get('backupId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const result = await restoreService.getRestorePoints({
      status: status as any || undefined,
      backupId: backupId || undefined,
      page,
      limit
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in restore points GET:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const gate = await assertAdmin(request);
    if (!('ok' in gate) || gate.ok !== true) return gate.res;

    const body = await request.json();
    const { backupId, name, description } = body;

    if (!backupId || !name) {
      return NextResponse.json({ error: "Backup ID and name are required" }, { status: 400 });
    }

    const restorePoint = await restoreService.createRestorePoint(
      backupId,
      name,
      (gate as any).userId,
      description
    );

    return NextResponse.json(restorePoint);
  } catch (error) {
    console.error('Error in restore points POST:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
} 