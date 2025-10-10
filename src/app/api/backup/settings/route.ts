import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export interface BackupSettings {
  autoBackup: boolean;
  backupFrequency: "DAILY" | "WEEKLY" | "MONTHLY";
  retentionDays: number;
  encryptionEnabled: boolean;
  cloudStorage: boolean;
  compressionLevel: "NONE" | "LOW" | "MEDIUM" | "HIGH";
  maxBackupSize: number; // in GB
}

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

// GET - Retrieve backup settings
export async function GET(request: NextRequest) {
  try {
    const gate = await assertAdmin(request);
    if (!('ok' in gate) || gate.ok !== true) return gate.res;
    // Get the first (and should be only) backup settings record
    const settings = await prisma.backupSettings.findFirst();
    
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
    const gate = await assertAdmin(request);
    if (!('ok' in gate) || gate.ok !== true) return gate.res;
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
    const updatedSettings = await prisma.backupSettings.upsert({
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