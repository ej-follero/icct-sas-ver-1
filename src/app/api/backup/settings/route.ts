import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export interface BackupSettings {
  autoBackup: boolean;
  backupFrequency: "DAILY" | "WEEKLY" | "MONTHLY";
  retentionDays: number;
  encryptionEnabled: boolean;
  cloudStorage: boolean;
  compressionLevel: "NONE" | "LOW" | "MEDIUM" | "HIGH";
  maxBackupSize: number; // in GB
}

// GET - Retrieve backup settings
export async function GET() {
  try {
    // Get the first (and should be only) backup settings record
    const settings = await db.backupSettings.findFirst();
    
    if (!settings) {
      // Return default settings if none exist
      const defaultSettings: BackupSettings = {
        autoBackup: true,
        backupFrequency: "WEEKLY",
        retentionDays: 30,
        encryptionEnabled: true,
        cloudStorage: false,
        compressionLevel: "MEDIUM",
        maxBackupSize: 10
      };
      
      return NextResponse.json(defaultSettings);
    }

    return NextResponse.json({
      autoBackup: settings.autoBackup,
      backupFrequency: settings.backupFrequency,
      retentionDays: settings.retentionDays,
      encryptionEnabled: settings.encryptionEnabled,
      cloudStorage: settings.cloudStorage,
      compressionLevel: settings.compressionLevel,
      maxBackupSize: settings.maxBackupSize
    });
  } catch (error) {
    console.error("Error fetching backup settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch backup settings" },
      { status: 500 }
    );
  }
}

// POST - Update backup settings
export async function POST(request: NextRequest) {
  try {
    const body: BackupSettings = await request.json();
    
    // Validate required fields
    if (typeof body.autoBackup !== 'boolean' ||
        !['DAILY', 'WEEKLY', 'MONTHLY'].includes(body.backupFrequency) ||
        typeof body.retentionDays !== 'number' ||
        typeof body.encryptionEnabled !== 'boolean' ||
        typeof body.cloudStorage !== 'boolean' ||
        !['NONE', 'LOW', 'MEDIUM', 'HIGH'].includes(body.compressionLevel) ||
        typeof body.maxBackupSize !== 'number') {
      return NextResponse.json(
        { error: "Invalid backup settings data" },
        { status: 400 }
      );
    }

    // Validate ranges
    if (body.retentionDays < 1 || body.retentionDays > 365) {
      return NextResponse.json(
        { error: "Retention days must be between 1 and 365" },
        { status: 400 }
      );
    }

    if (body.maxBackupSize < 1 || body.maxBackupSize > 100) {
      return NextResponse.json(
        { error: "Maximum backup size must be between 1 and 100 GB" },
        { status: 400 }
      );
    }

    // Upsert settings (create if doesn't exist, update if it does)
    const updatedSettings = await db.backupSettings.upsert({
      where: { id: 1 }, // Assuming we only have one settings record
      update: {
        autoBackup: body.autoBackup,
        backupFrequency: body.backupFrequency,
        retentionDays: body.retentionDays,
        encryptionEnabled: body.encryptionEnabled,
        cloudStorage: body.cloudStorage,
        compressionLevel: body.compressionLevel,
        maxBackupSize: body.maxBackupSize,
        updatedAt: new Date()
      },
      create: {
        id: 1,
        autoBackup: body.autoBackup,
        backupFrequency: body.backupFrequency,
        retentionDays: body.retentionDays,
        encryptionEnabled: body.encryptionEnabled,
        cloudStorage: body.cloudStorage,
        compressionLevel: body.compressionLevel,
        maxBackupSize: body.maxBackupSize
      }
    });

    return NextResponse.json({
      message: "Backup settings updated successfully",
      settings: {
        autoBackup: updatedSettings.autoBackup,
        backupFrequency: updatedSettings.backupFrequency,
        retentionDays: updatedSettings.retentionDays,
        encryptionEnabled: updatedSettings.encryptionEnabled,
        cloudStorage: updatedSettings.cloudStorage,
        compressionLevel: updatedSettings.compressionLevel,
        maxBackupSize: updatedSettings.maxBackupSize
      }
    });
  } catch (error) {
    console.error("Error updating backup settings:", error);
    return NextResponse.json(
      { error: "Failed to update backup settings" },
      { status: 500 }
    );
  }
} 