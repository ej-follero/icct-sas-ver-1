import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { ComprehensiveAuditService } from '@/lib/services/comprehensive-audit.service';

// PUT /api/profile/pin  Body: { pin: string }
// Sets the caller's PIN (stored as a bcrypt hash in User.twoFactorSecret) and enables twoFactorEnabled.
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const pin = String(body?.pin || '').trim();
    
    // Auth: read userId from JWT cookie (align with other profile routes)
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    let userId: number;
    try {
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const userIdRaw = (decoded as any)?.userId;
      userId = Number(userIdRaw);
      if (!Number.isFinite(userId)) throw new Error('Invalid user id');
    } catch (e) {
      return NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 });
    }

    if (!pin || pin.length < 4 || pin.length > 10) {
      return NextResponse.json({ error: 'PIN must be 4-10 digits' }, { status: 400 });
    }
    if (!/^\d+$/.test(pin)) {
      return NextResponse.json({ error: 'PIN must be numeric' }, { status: 400 });
    }

    const targetUserId = userId;

    const hash = await bcrypt.hash(pin, 12);

    const updated = await prisma.user.update({
      where: { userId: targetUserId },
      data: { twoFactorSecret: hash, twoFactorEnabled: true }
    });

    // Audit
    const audit = new ComprehensiveAuditService();
    await audit.logEvent({
      userId: updated.userId,
      userEmail: updated.email,
      action: 'PIN_UPDATE',
      category: 'SECURITY',
      resource: 'USER_PIN',
      severity: 'MEDIUM',
      details: { userId: updated.userId },
      ipAddress: request.headers.get('x-real-ip') || request.headers.get('x-forwarded-for') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    } as any);

    return NextResponse.json({ ok: true, userId: updated.userId });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to set PIN' }, { status: 500 });
  }
}


