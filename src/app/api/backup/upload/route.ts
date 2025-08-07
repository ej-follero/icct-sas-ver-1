import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { BackupType, BackupStatus, BackupLocation } from "@prisma/client";
import * as fs from "fs/promises";
import * as path from "path";
import { createReadStream } from "fs";
import archiver from "archiver";

// Maximum file size: 500MB
const MAX_FILE_SIZE = 500 * 1024 * 1024;

// Allowed file types
const ALLOWED_EXTENSIONS = ['.zip', '.tar.gz', '.tar'];

interface UploadRequest {
  name: string;
  description?: string;
  createdBy: number;
  file: File;
}

export async function POST(request: Request) {
  try {
    console.log("Starting backup upload process...");
    
    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const createdBy = parseInt(formData.get('createdBy') as string);

    // Validate required fields
    if (!file || !name || !createdBy) {
      return NextResponse.json(
        { error: "Missing required fields: file, name, createdBy" },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File size exceeds maximum limit of ${MAX_FILE_SIZE / (1024 * 1024)}MB` },
        { status: 400 }
      );
    }

    // Validate file extension
    const fileExtension = path.extname(file.name).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(fileExtension)) {
      return NextResponse.json(
        { error: `Invalid file type. Allowed types: ${ALLOWED_EXTENSIONS.join(', ')}` },
        { status: 400 }
      );
    }

    // Create backup directory if it doesn't exist
    const backupDir = process.env.BACKUP_DIR || './backups';
    await fs.mkdir(backupDir, { recursive: true });

    // Generate unique backup ID and file path
    const backupId = Date.now().toString();
    const fileName = `${backupId}_${file.name}`;
    const filePath = path.join(backupDir, fileName);

    // Save uploaded file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await fs.writeFile(filePath, buffer);

    // Validate backup file structure
    const validationResult = await validateBackupFile(filePath);
    if (!validationResult.isValid) {
      // Clean up invalid file
      await fs.unlink(filePath);
      return NextResponse.json(
        { error: `Invalid backup file: ${validationResult.error}` },
        { status: 400 }
      );
    }

    // Calculate file size
    const stats = await fs.stat(filePath);
    const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
    const size = `${sizeInMB} MB`;

    // Create backup record in database
    const newBackup = await prisma.systemBackup.create({
      data: {
        name,
        description,
        type: BackupType.FULL, // Default to FULL for uploaded backups
        location: BackupLocation.LOCAL,
        status: BackupStatus.COMPLETED,
        size,
        filePath,
        createdBy,
        isEncrypted: false, // Uploaded backups are not encrypted by default
        retentionDays: 30,
        completedAt: new Date(),
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

    // Create a log entry
    await prisma.backupLog.create({
      data: {
        backupId: newBackup.id,
        action: "UPLOAD",
        status: "SUCCESS",
        message: `Backup uploaded successfully: ${name} (${size})`,
        createdBy,
      },
    });

    // Create a restore point for the uploaded backup
    await prisma.restorePoint.create({
      data: {
        name: `Restore Point - ${name}`,
        description: `Auto-generated restore point for uploaded backup: ${name}`,
        backupId: newBackup.id,
        status: "AVAILABLE",
        createdBy,
      },
    });

    console.log(`Backup uploaded successfully: ${newBackup.id}`);

    return NextResponse.json({
      success: true,
      message: "Backup uploaded successfully",
      data: {
        id: newBackup.id.toString(),
        name: newBackup.name,
        type: newBackup.type,
        size: newBackup.size,
        status: newBackup.status,
        createdAt: newBackup.createdAt.toISOString(),
        description: newBackup.description,
        retentionDays: newBackup.retentionDays,
        isEncrypted: newBackup.isEncrypted,
        location: newBackup.location,
        createdBy: newBackup.createdByUser?.userName || 'Unknown User',
        completedAt: newBackup.completedAt?.toISOString(),
        errorMessage: newBackup.errorMessage,
        filePath: newBackup.filePath,
      },
    });

  } catch (error) {
    console.error("Error uploading backup:", error);
    return NextResponse.json(
      { 
        error: "Failed to upload backup",
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    );
  }
}

// Helper function to validate backup file structure
async function validateBackupFile(filePath: string): Promise<{ isValid: boolean; error?: string }> {
  try {
    // For now, we'll do basic validation
    // In a real implementation, you'd want to:
    // 1. Check if it's a valid archive
    // 2. Verify it contains expected files (database.sql, files.zip, metadata.json)
    // 3. Validate file integrity
    
    const stats = await fs.stat(filePath);
    if (stats.size === 0) {
      return { isValid: false, error: "File is empty" };
    }

    // Basic archive validation (for ZIP files)
    if (filePath.endsWith('.zip')) {
      try {
        // This is a simplified check - in production you'd want more thorough validation
        const fileBuffer = await fs.readFile(filePath);
        const zipSignature = fileBuffer.slice(0, 4);
        const expectedSignature = Buffer.from([0x50, 0x4B, 0x03, 0x04]); // ZIP file signature
        
        if (!zipSignature.equals(expectedSignature)) {
          return { isValid: false, error: "Invalid ZIP file format" };
        }
      } catch (error) {
        return { isValid: false, error: "Failed to validate ZIP file" };
      }
    }

    return { isValid: true };
  } catch (error) {
    return { isValid: false, error: "Failed to validate backup file" };
  }
} 