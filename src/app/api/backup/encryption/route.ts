import { NextRequest, NextResponse } from "next/server";
import { encryptionService } from "@/lib/services/encryption.service";

// Helper: admin auth check
async function assertAdmin(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  if (!token) return { ok: false, res: NextResponse.json({ error: 'Authentication required' }, { status: 401 }) };
  try {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId as number;
    const { prisma } = await import('@/lib/prisma');
    const user = await prisma.user.findUnique({ where: { userId }, select: { role: true } });
    if (!user || (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN')) {
      return { ok: false, res: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
    }
    return { ok: true } as const;
  } catch {
    return { ok: false, res: NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 }) };
  }
}

// GET /api/backup/encryption - Get encryption status and statistics
export async function GET(request: NextRequest) {
  try {
    const gate = await assertAdmin(request);
    if (!('ok' in gate) || gate.ok !== true) return gate.res;
    const stats = encryptionService.getEncryptionStats();
    const keys = encryptionService.getKeys().map(key => ({
      id: key.id,
      createdAt: key.createdAt.toISOString(),
      isActive: key.isActive,
      iterations: key.iterations
    }));

    return NextResponse.json({
      success: true,
      data: {
        stats,
        keys,
        encryptionAvailable: encryptionService.isEncryptionAvailable()
      }
    });

  } catch (error) {
    console.error("Error fetching encryption status:", error);
    return NextResponse.json(
      { 
        error: "Failed to fetch encryption status",
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    );
  }
}

// POST /api/backup/encryption - Create new encryption key
export async function POST(request: NextRequest) {
  try {
    const gate = await assertAdmin(request);
    if (!('ok' in gate) || gate.ok !== true) return gate.res;
    const body = await request.json();
    const { keyId, password } = body;

    if (!keyId || !password) {
      return NextResponse.json(
        { error: "Missing required fields: keyId, password" },
        { status: 400 }
      );
    }

    const newKey = await encryptionService.generateNewKey(keyId, password);

    return NextResponse.json({
      success: true,
      message: "Encryption key created successfully",
      data: {
        id: newKey.id,
        createdAt: newKey.createdAt.toISOString(),
        isActive: newKey.isActive,
        iterations: newKey.iterations
      }
    });

  } catch (error) {
    console.error("Error creating encryption key:", error);
    return NextResponse.json(
      { 
        error: "Failed to create encryption key",
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    );
  }
}

// PUT /api/backup/encryption - Update encryption key status
export async function PUT(request: NextRequest) {
  try {
    const gate = await assertAdmin(request);
    if (!('ok' in gate) || gate.ok !== true) return gate.res;
    const body = await request.json();
    const { keyId, action } = body;

    if (!keyId || !action) {
      return NextResponse.json(
        { error: "Missing required fields: keyId, action" },
        { status: 400 }
      );
    }

    let success = false;
    let message = "";

    switch (action) {
      case "deactivate":
        success = encryptionService.deactivateKey(keyId);
        message = success ? "Key deactivated successfully" : "Key not found";
        break;
      case "reactivate":
        success = encryptionService.reactivateKey(keyId);
        message = success ? "Key reactivated successfully" : "Key not found";
        break;
      default:
        return NextResponse.json(
          { error: "Invalid action. Use 'deactivate' or 'reactivate'" },
          { status: 400 }
        );
    }

    if (!success) {
      return NextResponse.json(
        { error: message },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message
    });

  } catch (error) {
    console.error("Error updating encryption key:", error);
    return NextResponse.json(
      { 
        error: "Failed to update encryption key",
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    );
  }
} 