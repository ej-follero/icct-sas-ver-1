import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';
import * as archiver from 'archiver';
import { spawn } from 'child_process';
const extract = require('extract-zip');
import { db } from '../db';
import { RestoreStatus, BackupStatus } from '@prisma/client';

export interface RestoreOptions {
  backupId: string;
  restorePointName?: string;
  restoreFiles?: boolean;
  restoreDatabase?: boolean;
  validateOnly?: boolean;
  previewOnly?: boolean;
  createdBy: number;
}

export interface RestoreResult {
  success: boolean;
  restorePointId?: string;
  filesRestored?: number;
  databaseRestored?: boolean;
  validationErrors?: string[];
  warnings?: string[];
  duration?: number;
  size?: string;
}

export interface RestorePoint {
  id: string;
  name: string;
  description?: string;
  backupId: string;
  status: RestoreStatus;
  createdAt: Date;
  createdBy: number;
  filesRestored?: number;
  databaseRestored?: boolean;
  validationErrors?: string[];
  warnings?: string[];
  duration?: number;
  size?: string;
}

export interface RestorePreview {
  backupInfo: {
    name: string;
    size: string;
    createdAt: Date;
    type: string;
  };
  filesToRestore: {
    path: string;
    size: number;
    lastModified: Date;
  }[];
  databaseInfo: {
    tables: string[];
    recordCount: number;
    size: string;
  };
  conflicts: {
    type: 'file' | 'database';
    path?: string;
    table?: string;
    description: string;
  }[];
}

export class RestoreService {
  private static instance: RestoreService;

  private constructor() {}

  static getInstance(): RestoreService {
    if (!RestoreService.instance) {
      RestoreService.instance = new RestoreService();
    }
    return RestoreService.instance;
  }

  /**
   * Create a restore point from a backup
   */
  async createRestorePoint(backupId: string, name: string, createdBy: number, description?: string): Promise<RestorePoint> {
    try {
      const backup = await db.systemBackup.findUnique({
        where: { id: parseInt(backupId) }
      });

      if (!backup) {
        throw new Error('Backup not found');
      }

      const restorePoint = await db.restorePoint.create({
        data: {
          name,
          description,
          backupId: parseInt(backupId),
          status: RestoreStatus.AVAILABLE,
          createdBy
        }
      });

      return {
        id: restorePoint.id.toString(),
        name: restorePoint.name,
        description: restorePoint.description || undefined,
        backupId: backupId,
        status: restorePoint.status,
        createdAt: restorePoint.createdAt,
        createdBy: restorePoint.createdBy
      };
    } catch (error) {
      console.error('Error creating restore point:', error);
      throw error;
    }
  }

  /**
   * Get restore preview for a backup
   */
  async getRestorePreview(backupId: string): Promise<RestorePreview> {
    try {
      const backup = await db.systemBackup.findUnique({
        where: { id: parseInt(backupId) }
      });

      if (!backup) {
        throw new Error('Backup not found');
      }

              const backupPath = backup.filePath || '';
        if (!backupPath || !await this.fileExists(backupPath)) {
        throw new Error('Backup file not found');
      }

      // Extract backup to temporary directory for preview
      const tempDir = path.join(process.cwd(), 'temp', `preview_${backupId}_${Date.now()}`);
      await fs.mkdir(tempDir, { recursive: true });

      try {
        // Extract backup archive
        await this.extractArchive(backupPath, tempDir);

        // Read metadata
        const metadataPath = path.join(tempDir, 'metadata.json');
        const metadata = JSON.parse(await fs.readFile(metadataPath, 'utf-8'));

        // Analyze files to restore
        const filesToRestore = await this.analyzeFilesToRestore(tempDir);

        // Analyze database info
        const databaseInfo = await this.analyzeDatabaseInfo(tempDir);

        // Check for conflicts
        const conflicts = await this.checkRestoreConflicts(filesToRestore, databaseInfo);

        return {
          backupInfo: {
            name: backup.name,
            size: backup.size,
            createdAt: backup.createdAt,
            type: backup.type
          },
          filesToRestore,
          databaseInfo,
          conflicts
        };
      } finally {
        // Cleanup temp directory
        await this.cleanupTempFiles(tempDir);
      }
    } catch (error) {
      console.error('Error getting restore preview:', error);
      throw error;
    }
  }

  /**
   * Perform restore operation
   */
  async performRestore(options: RestoreOptions): Promise<RestoreResult> {
    const startTime = Date.now();
    const result: RestoreResult = {
      success: false,
      validationErrors: [],
      warnings: []
    };

    try {
      const backup = await db.systemBackup.findUnique({
        where: { id: parseInt(options.backupId) }
      });

      if (!backup) {
        throw new Error('Backup not found');
      }

      if (!backup.filePath || !await this.fileExists(backup.filePath)) {
        throw new Error('Backup file not found');
      }

      // Create restore point if requested
      let restorePointId: string | undefined;
      if (options.restorePointName) {
        const restorePoint = await this.createRestorePoint(
          options.backupId,
          options.restorePointName,
          options.createdBy,
          `Restore from ${backup.name}`
        );
        restorePointId = restorePoint.id;
      }

      // Extract backup to temporary directory
      const tempDir = path.join(process.cwd(), 'temp', `restore_${options.backupId}_${Date.now()}`);
      await fs.mkdir(tempDir, { recursive: true });

      try {
        // Extract backup archive
        await this.extractArchive(backup.filePath, tempDir);

        // Read metadata
        const metadataPath = path.join(tempDir, 'metadata.json');
        const metadata = JSON.parse(await fs.readFile(metadataPath, 'utf-8'));

        // Restore files if requested
        if (options.restoreFiles) {
          result.filesRestored = await this.restoreFiles(tempDir, metadata);
        }

        // Restore database if requested
        if (options.restoreDatabase) {
          result.databaseRestored = await this.restoreDatabase(tempDir, metadata);
        }

        // Update restore point with results
        if (restorePointId) {
          await db.restorePoint.update({
            where: { id: parseInt(restorePointId) },
            data: {
              status: RestoreStatus.COMPLETED
            }
          });
        }

        result.success = true;
        result.restorePointId = restorePointId;
        result.duration = Date.now() - startTime;
        result.size = backup.size;

        return result;
      } finally {
        // Cleanup temp directory
        await this.cleanupTempFiles(tempDir);
      }
    } catch (error) {
      console.error('Error performing restore:', error);
      
      // Update restore point with error
      if (result.restorePointId) {
        await db.restorePoint.update({
          where: { id: parseInt(result.restorePointId) },
          data: {
            status: RestoreStatus.FAILED
          }
        });
      }

      result.validationErrors = [error instanceof Error ? error.message : 'Unknown error'];
      return result;
    }
  }

  /**
   * Get all restore points
   */
  async getRestorePoints(params?: {
    status?: RestoreStatus;
    backupId?: string;
    page?: number;
    limit?: number;
  }) {
    try {
      const where: any = {};
      
      if (params?.status) {
        where.status = params.status;
      }
      
      if (params?.backupId) {
        where.backupId = parseInt(params.backupId);
      }

      const page = params?.page || 1;
      const limit = params?.limit || 10;
      const skip = (page - 1) * limit;

      const [restorePoints, total] = await Promise.all([
        db.restorePoint.findMany({
          where,
          include: {
            backup: {
              select: {
                name: true,
                size: true,
                type: true
              }
            },
            createdByUser: {
              select: {
                userName: true,
                email: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit
        }),
        db.restorePoint.count({ where })
      ]);

      return {
        restorePoints,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('Error fetching restore points:', error);
      throw error;
    }
  }

  /**
   * Rollback to a restore point
   */
  async rollbackToRestorePoint(restorePointId: string, createdBy: number): Promise<RestoreResult> {
    try {
      const restorePoint = await db.restorePoint.findUnique({
        where: { id: parseInt(restorePointId) },
        include: {
          backup: true
        }
      });

      if (!restorePoint) {
        throw new Error('Restore point not found');
      }

      if (restorePoint.status !== RestoreStatus.COMPLETED) {
        throw new Error('Restore point is not in completed status');
      }

      // Perform restore using the backup from this restore point
      return await this.performRestore({
        backupId: restorePoint.backupId.toString(),
        restorePointName: `Rollback: ${restorePoint.name}`,
        restoreFiles: true,
        restoreDatabase: true,
        createdBy
      });
    } catch (error) {
      console.error('Error rolling back to restore point:', error);
      throw error;
    }
  }

  /**
   * Validate restore operation
   */
  async validateRestore(backupId: string): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
    conflicts: any[];
  }> {
    try {
      const backup = await db.systemBackup.findUnique({
        where: { id: parseInt(backupId) }
      });

      if (!backup) {
        return {
          isValid: false,
          errors: ['Backup not found'],
          warnings: [],
          conflicts: []
        };
      }

      if (!backup.filePath || !await this.fileExists(backup.filePath)) {
        return {
          isValid: false,
          errors: ['Backup file not found'],
          warnings: [],
          conflicts: []
        };
      }

      const errors: string[] = [];
      const warnings: string[] = [];
      const conflicts: any[] = [];

      // Check backup file integrity
      try {
        const tempDir = path.join(process.cwd(), 'temp', `validate_${backupId}_${Date.now()}`);
        await fs.mkdir(tempDir, { recursive: true });

        try {
          await this.extractArchive(backup.filePath!, tempDir);
          
          // Validate metadata
          const metadataPath = path.join(tempDir, 'metadata.json');
          if (!await this.fileExists(metadataPath)) {
            errors.push('Backup metadata not found');
          } else {
            const metadata = JSON.parse(await fs.readFile(metadataPath, 'utf-8'));
            
            // Validate required files exist
            if (metadata.database && !await this.fileExists(path.join(tempDir, 'database.sql'))) {
              errors.push('Database dump not found in backup');
            }
            
            if (metadata.files && !await this.fileExists(path.join(tempDir, 'files.zip'))) {
              errors.push('Files archive not found in backup');
            }
          }
        } finally {
          await this.cleanupTempFiles(tempDir);
        }
      } catch (error) {
        errors.push(`Backup file is corrupted: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

      // Check system requirements
      if (backup.type === 'INCREMENTAL') {
        const baseBackup = await db.systemBackup.findFirst({
          where: {
            id: { not: parseInt(backupId) },
            status: BackupStatus.COMPLETED,
            type: 'FULL'
          },
          orderBy: { createdAt: 'desc' }
        });

        if (!baseBackup) {
          warnings.push('No full backup found for incremental restore');
        }
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        conflicts
      };
    } catch (error) {
      console.error('Error validating restore:', error);
      return {
        isValid: false,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        warnings: [],
        conflicts: []
      };
    }
  }

  /**
   * Extract archive to directory
   */
  private async extractArchive(archivePath: string, extractPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      extract(archivePath, { dir: extractPath })
        .then(() => resolve())
        .catch((error: any) => reject(error));
    });
  }

  /**
   * Restore files from backup
   */
  private async restoreFiles(tempDir: string, metadata: any): Promise<number> {
    const filesZipPath = path.join(tempDir, 'files.zip');
    if (!await this.fileExists(filesZipPath)) {
      throw new Error('Files archive not found in backup');
    }

    // Extract files to project root
    const projectRoot = process.cwd();
    await this.extractArchive(filesZipPath, projectRoot);

    // Count restored files
    const fileList = metadata.files || [];
    return fileList.length;
  }

  /**
   * Restore database from backup
   */
  private async restoreDatabase(tempDir: string, metadata: any): Promise<boolean> {
    const databasePath = path.join(tempDir, 'database.sql');
    if (!await this.fileExists(databasePath)) {
      throw new Error('Database dump not found in backup');
    }

    // Restore database using psql
    return new Promise((resolve, reject) => {
      const databaseUrl = process.env.DATABASE_URL;
      if (!databaseUrl) {
        reject(new Error('DATABASE_URL not configured'));
        return;
      }

      const psql = spawn('psql', [databaseUrl, '-f', databasePath]);
      
      psql.on('close', (code) => {
        if (code === 0) {
          resolve(true);
        } else {
          reject(new Error(`Database restore failed with code ${code}`));
        }
      });

      psql.on('error', (error) => {
        reject(error);
      });
    });
  }

  /**
   * Analyze files to restore
   */
  private async analyzeFilesToRestore(tempDir: string): Promise<any[]> {
    const filesZipPath = path.join(tempDir, 'files.zip');
    if (!await this.fileExists(filesZipPath)) {
      return [];
    }

    // Extract files list from metadata
    const metadataPath = path.join(tempDir, 'metadata.json');
    const metadata = JSON.parse(await fs.readFile(metadataPath, 'utf-8'));
    
    return metadata.files || [];
  }

  /**
   * Analyze database info
   */
  private async analyzeDatabaseInfo(tempDir: string): Promise<any> {
    const databasePath = path.join(tempDir, 'database.sql');
    if (!await this.fileExists(databasePath)) {
      return { tables: [], recordCount: 0, size: '0 B' };
    }

    const stats = await fs.stat(databasePath);
    const content = await fs.readFile(databasePath, 'utf-8');
    
    // Simple analysis of SQL content
    const tables = content.match(/CREATE TABLE [^;]+/g) || [];
    const inserts = content.match(/INSERT INTO [^;]+/g) || [];

    return {
      tables: tables.map((table: string) => {
        const match = table.match(/CREATE TABLE "?([^"(\s]+)"?/);
        return match ? match[1] : 'unknown';
      }),
      recordCount: inserts.length,
      size: this.formatBytes(stats.size)
    };
  }

  /**
   * Check for restore conflicts
   */
  private async checkRestoreConflicts(filesToRestore: any[], databaseInfo: any): Promise<any[]> {
    const conflicts: any[] = [];

    // Check for file conflicts
    for (const file of filesToRestore) {
      const filePath = path.join(process.cwd(), file.path);
      if (await this.fileExists(filePath)) {
        conflicts.push({
          type: 'file',
          path: file.path,
          description: 'File already exists and will be overwritten'
        });
      }
    }

    // Check for database conflicts
    if (databaseInfo.tables.length > 0) {
      conflicts.push({
        type: 'database',
        description: 'Database tables will be restored (existing data may be affected)'
      });
    }

    return conflicts;
  }

  /**
   * Check if file exists
   */
  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Cleanup temporary files
   */
  private async cleanupTempFiles(dir: string): Promise<void> {
    try {
      await fs.rm(dir, { recursive: true, force: true });
    } catch (error) {
      console.warn('Failed to cleanup temp files:', error);
    }
  }

  /**
   * Format bytes to human readable string
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

export const restoreService = RestoreService.getInstance(); 