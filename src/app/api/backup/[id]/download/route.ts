import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import * as fs from 'fs/promises';
import * as path from 'path';

// GET /api/backup/[id]/download - Download backup file
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
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
      await fs.access(backup.filePath);
    } catch (error) {
      return NextResponse.json(
        { error: "Backup file not found on disk" },
        { status: 404 }
      );
    }

    // Read the file
    const fileBuffer = await fs.readFile(backup.filePath);
    
    // Get file stats for content length
    const stats = await fs.stat(backup.filePath);
    
    // Create filename for download
    const filename = `${backup.name.replace(/[^a-zA-Z0-9]/g, '_')}_${backup.id}.zip`;

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': stats.size.toString(),
        'Cache-Control': 'no-cache',
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