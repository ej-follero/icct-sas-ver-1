import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { backupServerService } from "@/lib/services/backup-server.service";

// POST - Test automated backup
export async function POST(request: NextRequest) {
  try {
    console.log('Testing automated backup...');

    // Get backup settings
    const settings = await db.backupSettings.findFirst();
    if (!settings) {
      return NextResponse.json(
        { error: "No backup settings found" },
        { status: 400 }
      );
    }

    // Create backup record
    const backup = await db.systemBackup.create({
      data: {
        name: `Test Automated Backup - ${new Date().toLocaleDateString()}`,
        description: `Test automated backup created manually`,
        type: "FULL",
        size: "0 MB",
        status: "IN_PROGRESS",
        location: "LOCAL",
        isEncrypted: settings.encryptionEnabled,
        retentionDays: settings.retentionDays,
        createdBy: 1, // System user
      }
    });

    // Create backup log entry
    await db.backupLog.create({
      data: {
        backupId: backup.id,
        action: "TEST_AUTOMATED_BACKUP_STARTED",
        status: "IN_PROGRESS",
        message: "Test automated backup started manually",
        createdBy: 1,
      }
    });

    // Start the actual backup process
    const backupData = {
      name: backup.name,
      description: backup.description,
      type: backup.type,
      location: backup.location,
      createdBy: backup.createdBy,
    };

    // Run backup in background
    backupServerService.performBackup(backup.id.toString(), backupData)
      .then(async (result) => {
        // Update backup record with results
        await db.systemBackup.update({
          where: { id: backup.id },
          data: {
            status: result.status,
            size: result.size,
            filePath: result.filePath,
            completedAt: new Date(),
          }
        });

        // Create completion log
        await db.backupLog.create({
          data: {
            backupId: backup.id,
            action: "TEST_AUTOMATED_BACKUP_COMPLETED",
            status: "SUCCESS",
            message: `Test automated backup completed successfully: ${result.size}`,
            createdBy: 1,
          }
        });

        console.log(`Test automated backup ${backup.id} completed: ${result.size}`);
      })
      .catch(async (error) => {
        console.error(`Test automated backup ${backup.id} failed:`, error);

        // Update backup record with error
        await db.systemBackup.update({
          where: { id: backup.id },
          data: {
            status: "FAILED",
            errorMessage: error.message || "Test automated backup failed",
            completedAt: new Date(),
          }
        });

        // Create error log
        await db.backupLog.create({
          data: {
            backupId: backup.id,
            action: "TEST_AUTOMATED_BACKUP_FAILED",
            status: "ERROR",
            message: `Test automated backup failed: ${error.message}`,
            createdBy: 1,
          }
        });
      });

    return NextResponse.json({
      success: true,
      message: "Test automated backup started successfully",
      data: {
        backupId: backup.id,
        status: "IN_PROGRESS"
      }
    });

  } catch (error) {
    console.error("Error testing automated backup:", error);
    return NextResponse.json(
      { error: "Failed to test automated backup" },
      { status: 500 }
    );
  }
} 