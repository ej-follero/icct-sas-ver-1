import { NextRequest, NextResponse } from "next/server";
import { backupVerificationService } from "@/lib/services/backup-verification.service";
import { prisma } from "@/lib/prisma";

// GET /api/backup/verification - Get verification statistics
export async function GET() {
  try {
    const stats = await backupVerificationService.getVerificationStats();
    
    return NextResponse.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error("Error fetching verification stats:", error);
    return NextResponse.json(
      { 
        error: "Failed to fetch verification statistics",
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    );
  }
}

// POST /api/backup/verification - Verify a specific backup
export async function POST(request: NextRequest) {
  try {
    // JWT Authentication - Admin only
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
    const reqUser = await prisma.user.findUnique({ where: { userId: reqUserId }, select: { role: true, status: true } });
    if (!reqUser || reqUser.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'User not found or inactive' }, { status: 401 });
    }
    const adminRoles = ['SUPER_ADMIN', 'ADMIN'];
    if (!adminRoles.includes(reqUser.role)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
    const body = await request.json();
    const { backupId } = body;

    if (!backupId) {
      return NextResponse.json(
        { error: "Missing required field: backupId" },
        { status: 400 }
      );
    }

    const verification = await backupVerificationService.verifyBackup(backupId);

    return NextResponse.json({
      success: true,
      data: verification
    });

  } catch (error) {
    console.error("Error verifying backup:", error);
    return NextResponse.json(
      { 
        error: "Failed to verify backup",
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    );
  }
}

// PUT /api/backup/verification - Verify all backups
export async function PUT() {
  try {
    const result = await backupVerificationService.verifyAllBackups();

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error("Error verifying all backups:", error);
    return NextResponse.json(
      { 
        error: "Failed to verify all backups",
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    );
  }
} 