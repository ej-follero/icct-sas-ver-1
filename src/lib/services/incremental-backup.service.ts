import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';
import { db } from '../db';
import { BackupType, BackupStatus } from '@prisma/client';
import { backupServerService } from './backup-server.service';

export interface FileChangeInfo {
  path: string;
  action: 'ADDED' | 'MODIFIED' | 'DELETED';
  size?: number;
  lastModified?: Date;
  checksum?: string;
}

export interface IncrementalBackupData {
  baseBackupId?: string;
  changes: FileChangeInfo[];
  totalFiles: number;
  totalSize: number;
  databaseChanges: boolean;
}

export interface IncrementalBackupOptions {
  baseBackupId?: string;
  includeDatabase: boolean;
  includeFiles: boolean;
  compressionLevel: number;
  excludePatterns: string[];
}

export class IncrementalBackupService {
  private static instance: IncrementalBackupService;
  private backupDir = process.env.BACKUP_DIR || './backups';
  private changeLogPath = path.join(this.backupDir, 'change-log.json');

  private constructor() {}

  static getInstance(): IncrementalBackupService {
    if (!IncrementalBackupService.instance) {
      IncrementalBackupService.instance = new IncrementalBackupService();
    }
    return IncrementalBackupService.instance;
  }

  /**
   * Detect changes since the last backup
   */
  async detectChanges(baseBackupId?: string): Promise<IncrementalBackupData> {
    try {
      console.log('Detecting changes for incremental backup...');
      
      const changes: FileChangeInfo[] = [];
      let totalSize = 0;
      let databaseChanges = false;

      // Get the base backup if specified
      let baseBackup = null;
      if (baseBackupId) {
        baseBackup = await db.systemBackup.findUnique({
          where: { id: parseInt(baseBackupId) }
        });
      }

      // If no base backup specified, find the most recent successful backup
      if (!baseBackup) {
        baseBackup = await db.systemBackup.findFirst({
          where: {
            status: BackupStatus.COMPLETED,
            type: { in: [BackupType.FULL, BackupType.INCREMENTAL] }
          },
          orderBy: { createdAt: 'desc' }
        });
      }

      if (baseBackup) {
        console.log(`Using base backup: ${baseBackup.name} (ID: ${baseBackup.id})`);
        
        // Load change log from base backup
        const baseChangeLog = await this.loadChangeLog(baseBackup.id.toString());
        
        // Scan current files
        const currentFiles = await this.scanCurrentFiles();
        
        // Compare with base backup
        const fileChanges = await this.compareFiles(currentFiles, baseChangeLog);
        changes.push(...fileChanges);
        
        // Calculate total size of changed files
        for (const change of changes) {
          if (change.action !== 'DELETED' && change.size) {
            totalSize += change.size;
          }
        }

        // Check for database changes
        databaseChanges = await this.checkDatabaseChanges(baseBackup.createdAt);
      } else {
        console.log('No base backup found, treating as full backup');
        // No base backup, treat as full backup
        const currentFiles = await this.scanCurrentFiles();
        for (const file of currentFiles) {
          changes.push({
            path: file.path,
            action: 'ADDED',
            size: file.size,
            lastModified: file.lastModified,
            checksum: file.checksum
          });
          totalSize += file.size || 0;
        }
        databaseChanges = true; // Assume database has changed
      }

      return {
        baseBackupId: baseBackup?.id.toString(),
        changes,
        totalFiles: changes.length,
        totalSize,
        databaseChanges
      };
    } catch (error) {
      console.error('Error detecting changes:', error);
      throw error;
    }
  }

  /**
   * Create an incremental backup
   */
  async createIncrementalBackup(
    backupId: string,
    backupData: any,
    options: IncrementalBackupOptions
  ): Promise<{ status: string; size: string; filePath: string; isEncrypted?: boolean }> {
    try {
      console.log(`Creating incremental backup: ${backupId}`);
      
      const backupPath = path.join(this.backupDir, `${backupId}_${Date.now()}`);
      const changesPath = `${backupPath}_changes.json`;
      const filesPath = `${backupPath}_files.zip`;
      const finalBackupPath = `${backupPath}.zip`;

      // Detect changes
      const changes = await this.detectChanges(options.baseBackupId);
      
      // Save changes log
      await fs.writeFile(changesPath, JSON.stringify(changes, null, 2));

      let finalSize = 0;
      let isEncrypted = false;

      // Backup changed files
      if (options.includeFiles && changes.changes.length > 0) {
        const changedFiles = changes.changes
          .filter(change => change.action !== 'DELETED')
          .map(change => change.path);

        if (changedFiles.length > 0) {
          await this.compressChangedFiles(changedFiles, filesPath, options.compressionLevel);
          const stats = await fs.stat(filesPath);
          finalSize += stats.size;
        }
      }

      // Backup database if needed
      if (options.includeDatabase && changes.databaseChanges) {
        const dbDumpPath = `${backupPath}_database.sql`;
        await this.exportDatabase(dbDumpPath);
        const stats = await fs.stat(dbDumpPath);
        finalSize += stats.size;
      }

      // Create final incremental backup archive
      await this.createIncrementalArchive(
        backupPath,
        changesPath,
        filesPath,
        finalBackupPath,
        changes
      );

      // Encrypt if enabled
      if (backupData.isEncrypted) {
        const encryptedPath = `${finalBackupPath}.enc`;
        const { encryptionService } = await import('./encryption.service');
        await encryptionService.encryptFile(finalBackupPath, encryptedPath);
        await fs.unlink(finalBackupPath);
        await fs.rename(encryptedPath, finalBackupPath);
        isEncrypted = true;
      }

      // Calculate final size
      const stats = await fs.stat(finalBackupPath);
      const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);

      // Cleanup temporary files
      await this.cleanupTempFiles([changesPath, filesPath]);

      return {
        status: 'COMPLETED',
        size: `${sizeInMB} MB`,
        filePath: finalBackupPath,
        isEncrypted
      };
    } catch (error) {
      console.error('Error creating incremental backup:', error);
      throw error;
    }
  }

  /**
   * Load change log from a previous backup
   */
  private async loadChangeLog(backupId: string): Promise<any> {
    try {
      const backup = await db.systemBackup.findUnique({
        where: { id: parseInt(backupId) }
      });

      if (!backup?.filePath) {
        return {};
      }

      // Extract and read change log from backup archive
      // This is a simplified implementation
      return {};
    } catch (error) {
      console.error('Error loading change log:', error);
      return {};
    }
  }

  /**
   * Scan current files in the project
   */
  private async scanCurrentFiles(): Promise<Array<{ path: string; size: number; lastModified: Date; checksum: string }>> {
    const files: Array<{ path: string; size: number; lastModified: Date; checksum: string }> = [];
    
    const directories = ['src', 'public', 'prisma', 'docs'];
    const excludePatterns = ['node_modules', '.git', 'backups', '.next', 'dist', 'build'];

    for (const dir of directories) {
      if (await this.directoryExists(dir)) {
        const dirFiles = await this.getAllFiles(dir, excludePatterns);
        for (const filePath of dirFiles) {
          try {
            const stats = await fs.stat(filePath);
            const content = await fs.readFile(filePath);
            const checksum = crypto.createHash('md5').update(content).digest('hex');
            
            files.push({
              path: filePath,
              size: stats.size,
              lastModified: stats.mtime,
              checksum
            });
          } catch (error) {
            console.warn(`Error reading file ${filePath}:`, error);
          }
        }
      }
    }

    return files;
  }

  /**
   * Compare current files with base backup
   */
  private async compareFiles(
    currentFiles: Array<{ path: string; size: number; lastModified: Date; checksum: string }>,
    baseChangeLog: any
  ): Promise<FileChangeInfo[]> {
    const changes: FileChangeInfo[] = [];
    const currentFileMap = new Map(currentFiles.map(f => [f.path, f]));
    const baseFileMap = new Map(Object.entries(baseChangeLog));

    // Check for added and modified files
    for (const [path, currentFile] of currentFileMap) {
      const baseFile = baseFileMap.get(path);
      
      if (!baseFile) {
        // New file
        changes.push({
          path,
          action: 'ADDED',
          size: currentFile.size,
          lastModified: currentFile.lastModified,
          checksum: currentFile.checksum
        });
      } else if (baseFile.checksum !== currentFile.checksum) {
        // Modified file
        changes.push({
          path,
          action: 'MODIFIED',
          size: currentFile.size,
          lastModified: currentFile.lastModified,
          checksum: currentFile.checksum
        });
      }
    }

    // Check for deleted files
    for (const [path] of baseFileMap) {
      if (!currentFileMap.has(path)) {
        changes.push({
          path,
          action: 'DELETED'
        });
      }
    }

    return changes;
  }

  /**
   * Check if database has changed since last backup
   */
  private async checkDatabaseChanges(lastBackupTime: Date): Promise<boolean> {
    try {
      // Check for recent database changes
      const recentChanges = await db.backupLog.findMany({
        where: {
          createdAt: {
            gt: lastBackupTime
          }
        },
        take: 1
      });

      return recentChanges.length > 0;
    } catch (error) {
      console.error('Error checking database changes:', error);
      return true; // Assume changes if we can't determine
    }
  }

  /**
   * Compress only changed files
   */
  private async compressChangedFiles(
    files: string[],
    outputPath: string,
    compressionLevel: number
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const output = fs.createWriteStream(outputPath);
      const archive = require('archiver')('zip', {
        zlib: { level: compressionLevel }
      });

      output.on('close', () => resolve());
      archive.on('error', (err: any) => reject(err));

      archive.pipe(output);

      for (const file of files) {
        if (fs.existsSync(file)) {
          archive.file(file, { name: file });
        }
      }

      archive.finalize();
    });
  }

  /**
   * Create incremental backup archive
   */
  private async createIncrementalArchive(
    backupPath: string,
    changesPath: string,
    filesPath: string,
    finalPath: string,
    changes: IncrementalBackupData
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const output = fs.createWriteStream(finalPath);
      const archive = require('archiver')('zip');

      output.on('close', () => resolve());
      archive.on('error', (err: any) => reject(err));

      archive.pipe(output);

      // Add metadata
      const metadata = {
        type: 'INCREMENTAL',
        baseBackupId: changes.baseBackupId,
        changes: changes.changes,
        totalFiles: changes.totalFiles,
        totalSize: changes.totalSize,
        databaseChanges: changes.databaseChanges,
        createdAt: new Date().toISOString()
      };

      archive.append(JSON.stringify(metadata, null, 2), { name: 'metadata.json' });

      // Add changes log
      if (fs.existsSync(changesPath)) {
        archive.file(changesPath, { name: 'changes.json' });
      }

      // Add changed files
      if (fs.existsSync(filesPath)) {
        archive.file(filesPath, { name: 'files.zip' });
      }

      // Add database dump if it exists
      const dbDumpPath = `${backupPath}_database.sql`;
      if (fs.existsSync(dbDumpPath)) {
        archive.file(dbDumpPath, { name: 'database.sql' });
      }

      archive.finalize();
    });
  }

  /**
   * Export database
   */
  private async exportDatabase(outputPath: string): Promise<void> {
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);

    try {
      const dbUrl = process.env.DATABASE_URL;
      if (!dbUrl) {
        throw new Error('DATABASE_URL not configured');
      }

      // Extract connection details from DATABASE_URL
      const url = new URL(dbUrl);
      const host = url.hostname;
      const port = url.port || '5432';
      const database = url.pathname.slice(1);
      const username = url.username;
      const password = url.password;

      const command = `PGPASSWORD="${password}" pg_dump -h ${host} -p ${port} -U ${username} -d ${database} -f "${outputPath}"`;

      await execAsync(command);
      console.log('Database exported successfully');
    } catch (error) {
      console.error('Error exporting database:', error);
      throw error;
    }
  }

  /**
   * Get all files in a directory recursively
   */
  private async getAllFiles(dirPath: string, excludePatterns: string[]): Promise<string[]> {
    const files: string[] = [];

    const shouldExclude = (path: string) => {
      return excludePatterns.some(pattern => path.includes(pattern));
    };

    const scanDirectory = async (currentPath: string) => {
      try {
        const entries = await fs.readdir(currentPath, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = path.join(currentPath, entry.name);
          
          if (shouldExclude(fullPath)) {
            continue;
          }

          if (entry.isDirectory()) {
            await scanDirectory(fullPath);
          } else {
            files.push(fullPath);
          }
        }
      } catch (error) {
        console.warn(`Error scanning directory ${currentPath}:`, error);
      }
    };

    await scanDirectory(dirPath);
    return files;
  }

  /**
   * Check if directory exists
   */
  private async directoryExists(dirPath: string): Promise<boolean> {
    try {
      const stats = await fs.stat(dirPath);
      return stats.isDirectory();
    } catch {
      return false;
    }
  }

  /**
   * Cleanup temporary files
   */
  private async cleanupTempFiles(files: string[]): Promise<void> {
    for (const file of files) {
      try {
        if (fs.existsSync(file)) {
          await fs.unlink(file);
        }
      } catch (error) {
        console.warn(`Error cleaning up file ${file}:`, error);
      }
    }
  }
}

export const incrementalBackupService = IncrementalBackupService.getInstance(); 