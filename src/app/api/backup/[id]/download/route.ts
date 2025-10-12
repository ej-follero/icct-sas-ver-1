import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import * as fsp from 'fs/promises';
import * as fs from 'fs';
import * as path from 'path';

// GET /api/backup/[id]/download - Download backup file
export const runtime = 'nodejs';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // Auth: only admins can download backups (SUPER_ADMIN or ADMIN)
    const token = req.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    try {
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const userId = decoded.userId as number;
      const user = await prisma.user.findUnique({ where: { userId }, select: { role: true } });
      if (!user || (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    } catch {
      return NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 });
    }
    
    // Get backup details from database
    const backup = await prisma.systemBackup.findUnique({
      where: { id: parseInt(id) },
    });

    if (!backup) {
      return NextResponse.json(
        { error: "Backup not found" },
        { status: 404 }
      );
    }

    if (backup.status !== "COMPLETED") {
      return NextResponse.json(
        { error: "Backup is not completed and cannot be downloaded" },
        { status: 400 }
      );
    }

    if (!backup.filePath) {
      return NextResponse.json(
        { error: "Backup file not found" },
        { status: 404 }
      );
    }

    // Check if file exists
    try {
      await fsp.access(backup.filePath);
    } catch (error) {
      return NextResponse.json(
        { error: "Backup file not found on disk" },
        { status: 404 }
      );
    }

    // Stream the file (avoid loading large files into memory)
    const stats = await fsp.stat(backup.filePath);
    const stream = fs.createReadStream(backup.filePath);
    
    // Create filename for download
    const filename = `${backup.name.replace(/[^a-zA-Z0-9]/g, '_')}_${backup.id}.zip`;

    return new NextResponse(stream as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': stats.size.toString(),
        'Cache-Control': 'no-store',
      },
    });

  } catch (error) {
    console.error("Error downloading backup:", error);
    return NextResponse.json(
      { 
        error: "Failed to download backup",
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    );
  }
} 