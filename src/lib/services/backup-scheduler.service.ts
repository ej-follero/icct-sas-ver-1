import { db } from '../db';
import { BackupStatus } from '@prisma/client';
import { backupServerService } from './backup-server.service';

interface ScheduledBackup {
  id: string;
  name: string;
  type: "FULL" | "INCREMENTAL" | "DIFFERENTIAL";
  frequency: "DAILY" | "WEEKLY" | "MONTHLY";
  nextRun: Date;
  lastRun?: Date;
  isActive: boolean;
}

class BackupSchedulerService {
  private scheduler: NodeJS.Timeout | null = null;
  private isRunning = false;

  constructor() {
    // Delay startup to ensure Prisma client is properly initialized
    setTimeout(() => {
      this.startScheduler();
    }, 5000); // 5 second delay
  }

  private async startScheduler() {
    if (this.isRunning) return;
    
    try {
      // Test database connection first
      await db.$connect();
      await db.$disconnect();
      
      this.isRunning = true;
      console.log('Backup scheduler started');
      
      // Check for scheduled backups every minute
      this.scheduler = setInterval(async () => {
        await this.checkScheduledBackups();
      }, 60000); // 1 minute
    } catch (error) {
      console.error('Failed to start backup scheduler:', error);
      // Retry after 30 seconds
      setTimeout(() => {
        this.startScheduler();
      }, 30000);
    }
  }

  private async checkScheduledBackups() {
    try {
      // Ensure database connection
      await db.$connect();
      
      // Get backup settings
      const settings = await db.backupSettings.findFirst();
      if (!settings || !settings.autoBackup) {
        return; // Auto backup is disabled
      }

      const now = new Date();
      const lastBackup = await db.systemBackup.findFirst({
        where: {
          status: "COMPLETED"
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      // Check if it's time for a new backup
      if (this.shouldRunBackup(settings.backupFrequency, lastBackup?.createdAt)) {
        await this.createAutomatedBackup(settings);
      }

      // Clean up old backups based on retention policy
      await this.cleanupOldBackups(settings.retentionDays);

    } catch (error) {
      console.error('Error in backup scheduler:', error);
    } finally {
      // Always disconnect to prevent connection leaks
      try {
        await db.$disconnect();
      } catch (disconnectError) {
        console.warn('Error disconnecting from database:', disconnectError);
      }
    }
  }

  private shouldRunBackup(frequency: string, lastBackupDate?: Date): boolean {
    if (!lastBackupDate) {
      return true; // No previous backup, run immediately
    }

    const now = new Date();
    const timeSinceLastBackup = now.getTime() - lastBackupDate.getTime();
    const oneDay = 24 * 60 * 60 * 1000;
    const oneWeek = 7 * oneDay;
    const oneMonth = 30 * oneDay;

    switch (frequency) {
      case 'DAILY':
        return timeSinceLastBackup >= oneDay;
      case 'WEEKLY':
        return timeSinceLastBackup >= oneWeek;
      case 'MONTHLY':
        return timeSinceLastBackup >= oneMonth;
      default:
        return false;
    }
  }

  private async createAutomatedBackup(settings: any) {
    try {
      console.log('Creating automated backup...');

      // Ensure database connection
      await db.$connect();

      // Create backup record
      const backup = await db.systemBackup.create({
        data: {
          name: `Automated Backup - ${new Date().toLocaleDateString()}`,
          description: `Automated backup created by scheduler (${settings.backupFrequency})`,
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
          action: "AUTOMATED_BACKUP_STARTED",
          status: "IN_PROGRESS",
          message: `Automated backup started (${settings.backupFrequency})`,
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
              status: result.status as BackupStatus,
              size: result.size,
              filePath: result.filePath,
              completedAt: new Date(),
            }
          });

          // Create completion log
          await db.backupLog.create({
            data: {
              backupId: backup.id,
              action: "AUTOMATED_BACKUP_COMPLETED",
              status: "SUCCESS",
              message: `Automated backup completed successfully: ${result.size}`,
              createdBy: 1,
            }
          });

          console.log(`Automated backup ${backup.id} completed: ${result.size}`);
        })
        .catch(async (error) => {
          console.error(`Automated backup ${backup.id} failed:`, error);

          // Update backup record with error
          await db.systemBackup.update({
            where: { id: backup.id },
            data: {
              status: BackupStatus.FAILED,
              errorMessage: error.message || "Automated backup failed",
              completedAt: new Date(),
            }
          });

          // Create error log
          await db.backupLog.create({
            data: {
              backupId: backup.id,
              action: "AUTOMATED_BACKUP_FAILED",
              status: "ERROR",
              message: `Automated backup failed: ${error.message}`,
              createdBy: 1,
            }
          });
        });

    } catch (error) {
      console.error('Error creating automated backup:', error);
    } finally {
      // Always disconnect to prevent connection leaks
      try {
        await db.$disconnect();
      } catch (disconnectError) {
        console.warn('Error disconnecting from database:', disconnectError);
      }
    }
  }

  private async cleanupOldBackups(retentionDays: number) {
    try {
      // Ensure database connection
      await db.$connect();
      
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      // Find old backups to delete
      const oldBackups = await db.systemBackup.findMany({
        where: {
          status: BackupStatus.COMPLETED,
          createdAt: {
            lt: cutoffDate
          }
        }
      });

      for (const backup of oldBackups) {
        try {
          // Delete backup file if it exists
          if (backup.filePath) {
            const fs = require('fs').promises;
            try {
              await fs.unlink(backup.filePath);
            } catch (fileError) {
              console.warn(`Could not delete backup file ${backup.filePath}:`, fileError);
            }
          }

          // Delete backup record (cascades to logs and restore points)
          await db.systemBackup.delete({
            where: { id: backup.id }
          });

          console.log(`Deleted old backup ${backup.id} (older than ${retentionDays} days)`);
        } catch (error) {
          console.error(`Error deleting old backup ${backup.id}:`, error);
        }
      }
    } catch (error) {
      console.error('Error cleaning up old backups:', error);
    } finally {
      // Always disconnect to prevent connection leaks
      try {
        await db.$disconnect();
      } catch (disconnectError) {
        console.warn('Error disconnecting from database:', disconnectError);
      }
    }
  }

  public async getSchedulerStatus() {
    try {
      // Ensure database connection
      await db.$connect();
      
      const settings = await db.backupSettings.findFirst();
      const lastBackup = await db.systemBackup.findFirst({
      where: { status: "COMPLETED" },
      orderBy: { createdAt: 'desc' }
    });

          return {
        isRunning: this.isRunning,
        autoBackupEnabled: settings?.autoBackup || false,
        frequency: settings?.backupFrequency || 'WEEKLY',
        retentionDays: settings?.retentionDays || 30,
        lastBackup: lastBackup?.createdAt,
        nextBackup: lastBackup ? this.calculateNextBackup(settings?.backupFrequency || 'WEEKLY', lastBackup.createdAt) : null,
      };
    } catch (error) {
      console.error('Error getting scheduler status:', error);
      return {
        isRunning: this.isRunning,
        autoBackupEnabled: false,
        frequency: 'WEEKLY',
        retentionDays: 30,
        lastBackup: null,
        nextBackup: null,
      };
    } finally {
      // Always disconnect to prevent connection leaks
      try {
        await db.$disconnect();
      } catch (disconnectError) {
        console.warn('Error disconnecting from database:', disconnectError);
      }
    }
  }

  private calculateNextBackup(frequency: string, lastBackupDate: Date): Date {
    const nextBackup = new Date(lastBackupDate);
    
    switch (frequency) {
      case 'DAILY':
        nextBackup.setDate(nextBackup.getDate() + 1);
        break;
      case 'WEEKLY':
        nextBackup.setDate(nextBackup.getDate() + 7);
        break;
      case 'MONTHLY':
        nextBackup.setMonth(nextBackup.getMonth() + 1);
        break;
    }
    
    return nextBackup;
  }

  public stopScheduler() {
    if (this.scheduler) {
      clearInterval(this.scheduler);
      this.scheduler = null;
    }
    this.isRunning = false;
    console.log('Backup scheduler stopped');
  }
}

export const backupSchedulerService = new BackupSchedulerService(); 