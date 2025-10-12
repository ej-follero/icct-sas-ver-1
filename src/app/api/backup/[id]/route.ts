import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// PUT /api/backup/[id] - Update backup status
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // AuthN/AuthZ: only SUPER_ADMIN or ADMIN can update backups
    const token = (request as any).cookies?.get?.('token')?.value || (request as any).headers?.get?.('cookie');
    const cookieToken = token && typeof token === 'string' && token.includes('token=')
      ? (token.split('token=')[1].split(';')[0])
      : (typeof token === 'string' ? token : undefined);
    if (!cookieToken) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    try {
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(cookieToken, process.env.JWT_SECRET);
      const userId = decoded.userId as number;
      const user = await prisma.user.findUnique({ where: { userId }, select: { role: true } });
      if (!user || (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    } catch {
      return NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 });
    }
    const body = await request.json();
    const { status, errorMessage, size, completedAt, filePath } = body;

    // Validate status against schema enum
    const allowedStatuses = new Set(['SCHEDULED','IN_PROGRESS','COMPLETED','FAILED','CANCELLED']);
    const statusUpdate = status && allowedStatuses.has(String(status).toUpperCase())
      ? String(status).toUpperCase()
      : undefined;

    // Coerce size to string per schema
    const sizeUpdate = typeof size === 'number' ? String(size) : (typeof size === 'string' ? size : undefined);

    const updatedBackup = await prisma.systemBackup.update({
      where: { id: parseInt(id) },
      data: {
        ...(statusUpdate ? { status: statusUpdate as any } : {}),
        ...(typeof errorMessage === 'string' ? { errorMessage } : {}),
        ...(sizeUpdate ? { size: sizeUpdate } : {}),
        ...(typeof filePath === 'string' ? { filePath } : {}),
        ...(completedAt ? { completedAt: new Date(completedAt) } : {}),
      },
      include: {
        createdByUser: {
          select: {
            userId: true,
            userName: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: updatedBackup.id.toString(),
        name: updatedBackup.name,
        type: updatedBackup.type,
        status: updatedBackup.status,
        createdAt: updatedBackup.createdAt.toISOString(),
        description: updatedBackup.description,
        retentionDays: updatedBackup.retentionDays,
        isEncrypted: updatedBackup.isEncrypted,
        location: updatedBackup.location,
        size: updatedBackup.size,
        createdBy: updatedBackup.createdByUser.userName,
        completedAt: updatedBackup.completedAt?.toISOString(),
        errorMessage: updatedBackup.errorMessage,
        filePath: updatedBackup.filePath,
      },
    });
  } catch (error) {
    console.error("Error updating backup:", error);
    return NextResponse.json(
      { 
        error: "Failed to update backup",
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    );
  }
}

// DELETE /api/backup/[id] - Delete backup
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // AuthN/AuthZ: only SUPER_ADMIN or ADMIN can delete backups
    const token = (request as any).cookies?.get?.('token')?.value || (request as any).headers?.get?.('cookie');
    const cookieToken = token && typeof token === 'string' && token.includes('token=')
      ? (token.split('token=')[1].split(';')[0])
      : (typeof token === 'string' ? token : undefined);
    if (!cookieToken) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    try {
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(cookieToken, process.env.JWT_SECRET);
      const userId = decoded.userId as number;
      const user = await prisma.user.findUnique({ where: { userId }, select: { role: true } });
      if (!user || (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    } catch {
      return NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 });
    }

    await prisma.systemBackup.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({
      success: true,
      message: "Backup deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting backup:", error);
    return NextResponse.json(
      { 
        error: "Failed to delete backup",
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    );
  }
} 