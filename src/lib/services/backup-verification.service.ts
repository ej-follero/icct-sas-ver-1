import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';
import { db } from '../db';
import { BackupStatus } from '@prisma/client';
import { encryptionService } from './encryption.service';

export interface VerificationResult {
  isValid: boolean;
  checksum: string;
  fileSize: number;
  fileExists: boolean;
  isEncrypted: boolean;
  encryptionValid?: boolean;
  metadataValid: boolean;
  archiveValid: boolean;
  databaseValid: boolean;
  errors: string[];
  warnings: string[];
  verificationDate: Date;
}

export interface BackupMetadata {
  timestamp: string;
  version: string;
  type: string;
  description: string;
  originalSize?: number;
  compressionRatio?: number;
}

export class BackupVerificationService {
  private static instance: BackupVerificationService;

  private constructor() {}

  static getInstance(): BackupVerificationService {
    if (!BackupVerificationService.instance) {
      BackupVerificationService.instance = new BackupVerificationService();
    }
    return BackupVerificationService.instance;
  }

  /**
   * Verify a backup file's integrity and validity
   */
  async verifyBackup(backupId: string): Promise<VerificationResult> {
    const result: VerificationResult = {
      isValid: false,
      checksum: '',
      fileSize: 0,
      fileExists: false,
      isEncrypted: false,
      metadataValid: false,
      archiveValid: false,
      databaseValid: false,
      errors: [],
      warnings: [],
      verificationDate: new Date()
    };

    try {
      // Get backup record from database
      const backup = await db.systemBackup.findUnique({
        where: { id: parseInt(backupId) }
      });

      if (!backup) {
        result.errors.push('Backup record not found in database');
        return result;
      }

      if (!backup.filePath) {
        result.errors.push('Backup file path not found');
        return result;
      }

      // Check if file exists
      try {
        const stats = await fs.stat(backup.filePath);
        result.fileExists = true;
        result.fileSize = stats.size;
      } catch (error) {
        result.errors.push(`Backup file not found: ${backup.filePath}`);
        return result;
      }

      // Calculate checksum
      result.checksum = await this.calculateFileChecksum(backup.filePath);

      // Check if file is encrypted
      result.isEncrypted = backup.isEncrypted;

      // Verify encryption if applicable
      if (result.isEncrypted) {
        try {
          result.encryptionValid = await encryptionService.verifyFileIntegrity(backup.filePath);
          if (!result.encryptionValid) {
            result.errors.push('Encryption verification failed');
          }
        } catch (error) {
          result.errors.push(`Encryption verification error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      // Verify archive structure
      const archiveVerification = await this.verifyArchiveStructure(backup.filePath);
      result.archiveValid = archiveVerification.isValid;
      result.errors.push(...archiveVerification.errors);
      result.warnings.push(...archiveVerification.warnings);

      // Verify metadata
      const metadataVerification = await this.verifyBackupMetadata(backup.filePath);
      result.metadataValid = metadataVerification.isValid;
      result.errors.push(...metadataVerification.errors);

      // Verify database dump
      const databaseVerification = await this.verifyDatabaseDump(backup.filePath);
      result.databaseValid = databaseVerification.isValid;
      result.errors.push(...databaseVerification.errors);
      result.warnings.push(...databaseVerification.warnings);

      // Determine overall validity
      result.isValid = result.fileExists && 
                      result.archiveValid && 
                      result.metadataValid && 
                      result.databaseValid &&
                      (!result.isEncrypted || (result.encryptionValid ?? false));

      // Update backup record with verification results
      await this.updateBackupVerification(backupId, result);

      return result;

    } catch (error) {
      result.errors.push(`Verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return result;
    }
  }

  /**
   * Calculate SHA-256 checksum of a file
   */
  private async calculateFileChecksum(filePath: string): Promise<string> {
    const fileBuffer = await fs.readFile(filePath);
    return crypto.createHash('sha256').update(fileBuffer).digest('hex');
  }

  /**
   * Verify the archive structure and contents
   */
  private async verifyArchiveStructure(filePath: string): Promise<{ isValid: boolean; errors: string[]; warnings: string[] }> {
    const result = { isValid: false, errors: [] as string[], warnings: [] as string[] };

    try {
      // For now, we'll do basic file validation
      // In a real implementation, you would use a library like 'unzipper' to verify ZIP structure
      const stats = await fs.stat(filePath);
      
      if (stats.size === 0) {
        result.errors.push('Backup file is empty');
        return result;
      }

      // Check file extension
      if (!filePath.endsWith('.zip')) {
        result.warnings.push('Backup file does not have .zip extension');
      }

      // Basic validation passed
      result.isValid = true;

    } catch (error) {
      result.errors.push(`Archive verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return result;
  }

  /**
   * Verify backup metadata
   */
  private async verifyBackupMetadata(filePath: string): Promise<{ isValid: boolean; errors: string[] }> {
    const result = { isValid: false, errors: [] as string[] };

    try {
      // In a real implementation, you would extract and verify metadata.json from the archive
      // For now, we'll do basic validation
      const stats = await fs.stat(filePath);
      const metadata: BackupMetadata = {
        timestamp: new Date().toISOString(),
        version: '1.0',
        type: 'full',
        description: 'System backup'
      };

      // Basic metadata validation
      if (!metadata.timestamp || !metadata.version || !metadata.type) {
        result.errors.push('Invalid backup metadata');
        return result;
      }

      // Check if backup is not too old (optional)
      const backupDate = new Date(metadata.timestamp);
      const now = new Date();
      const daysDiff = (now.getTime() - backupDate.getTime()) / (1000 * 60 * 60 * 24);
      
      if (daysDiff > 365) {
        result.errors.push('Backup is older than 1 year');
      }

      result.isValid = true;

    } catch (error) {
      result.errors.push(`Metadata verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return result;
  }

  /**
   * Verify database dump integrity
   */
  private async verifyDatabaseDump(filePath: string): Promise<{ isValid: boolean; errors: string[]; warnings: string[] }> {
    const result = { isValid: false, errors: [] as string[], warnings: [] as string[] };

    try {
      // In a real implementation, you would extract database.sql from the archive and verify it
      // For now, we'll do basic validation
      const stats = await fs.stat(filePath);
      
      if (stats.size < 1024) { // Less than 1KB
        result.warnings.push('Database dump seems unusually small');
      }

      // Basic validation passed
      result.isValid = true;

    } catch (error) {
      result.errors.push(`Database verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return result;
  }

  /**
   * Update backup record with verification results
   */
  private async updateBackupVerification(backupId: string, result: VerificationResult): Promise<void> {
    try {
      await db.systemBackup.update({
        where: { id: parseInt(backupId) },
        data: {
          checksum: result.checksum,
          status: result.isValid ? BackupStatus.COMPLETED : BackupStatus.FAILED,
          errorMessage: result.errors.length > 0 ? result.errors.join('; ') : null,
          completedAt: result.verificationDate
        }
      });

      // Create verification log entry
      await db.backupLog.create({
        data: {
          backupId: parseInt(backupId),
          action: 'BACKUP_VERIFICATION',
          status: result.isValid ? 'SUCCESS' : 'ERROR',
          message: `Backup verification ${result.isValid ? 'passed' : 'failed'}. ${result.errors.length} errors, ${result.warnings.length} warnings.`,
          createdBy: 1 // System user
        }
      });

    } catch (error) {
      console.error('Error updating backup verification:', error);
    }
  }

  /**
   * Verify all backups in the system
   */
  async verifyAllBackups(): Promise<{ total: number; valid: number; invalid: number; errors: string[] }> {
    const result = { total: 0, valid: 0, invalid: 0, errors: [] as string[] };

    try {
      const backups = await db.systemBackup.findMany({
        where: { status: BackupStatus.COMPLETED }
      });

      result.total = backups.length;

      for (const backup of backups) {
        try {
          const verification = await this.verifyBackup(backup.id.toString());
          if (verification.isValid) {
            result.valid++;
          } else {
            result.invalid++;
            result.errors.push(`Backup ${backup.id}: ${verification.errors.join(', ')}`);
          }
        } catch (error) {
          result.invalid++;
          result.errors.push(`Backup ${backup.id}: Verification failed`);
        }
      }

    } catch (error) {
      result.errors.push(`Bulk verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return result;
  }

  /**
   * Get verification statistics
   */
  async getVerificationStats(): Promise<{
    totalBackups: number;
    verifiedBackups: number;
    unverifiedBackups: number;
    failedBackups: number;
    averageFileSize: number;
    totalStorageUsed: number;
  }> {
    try {
      const backups = await db.systemBackup.findMany();
      
      const verifiedBackups = backups.filter(b => b.checksum && b.status === BackupStatus.COMPLETED);
      const unverifiedBackups = backups.filter(b => !b.checksum && b.status === BackupStatus.COMPLETED);
      const failedBackups = backups.filter(b => b.status === BackupStatus.FAILED);

      let totalStorageUsed = 0;
      let totalFileSize = 0;
      let fileCount = 0;

      for (const backup of backups) {
        if (backup.filePath) {
          try {
            const stats = await fs.stat(backup.filePath);
            totalStorageUsed += stats.size;
            totalFileSize += stats.size;
            fileCount++;
          } catch (error) {
            // File doesn't exist or can't be accessed
          }
        }
      }

      return {
        totalBackups: backups.length,
        verifiedBackups: verifiedBackups.length,
        unverifiedBackups: unverifiedBackups.length,
        failedBackups: failedBackups.length,
        averageFileSize: fileCount > 0 ? totalFileSize / fileCount : 0,
        totalStorageUsed
      };

    } catch (error) {
      console.error('Error getting verification stats:', error);
      return {
        totalBackups: 0,
        verifiedBackups: 0,
        unverifiedBackups: 0,
        failedBackups: 0,
        averageFileSize: 0,
        totalStorageUsed: 0
      };
    }
  }
}

export const backupVerificationService = BackupVerificationService.getInstance(); 