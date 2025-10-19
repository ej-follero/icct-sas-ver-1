// Note: This service is designed for client-side use with API routes
// All database operations are handled through API endpoints


export interface BackupItem {
  id: string;
  name: string;
  description?: string;
  type: 'FULL' | 'INCREMENTAL' | 'DIFFERENTIAL';
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'SCHEDULED';
  size: string;
  location: 'LOCAL' | 'CLOUD';
  createdAt: string;
  completedAt?: string;
  createdBy: number;
  filePath?: string;
  errorMessage?: string;
  restorePointsCount: number;
  logsCount: number;
  retentionDays: number;
}

export interface RestorePoint {
  id: string;
  name: string;
  description?: string;
  backupId: string;
  status: 'AVAILABLE' | 'RESTORING' | 'FAILED';
  createdAt: string;
  size: string;
}

class BackupService {
  private progressCallbacks: Map<string, (progress: any) => void> = new Map();

  constructor() {
    // Client-side service - no database connection needed
  }

  async getBackups(): Promise<BackupItem[]> {
    try {
      const response = await fetch('/api/backups');
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch backups');
      }

      return data.items.map((backup: any) => ({
        id: backup.id.toString(),
        name: backup.name,
        description: backup.description,
        type: backup.type as any,
        status: backup.status as any,
        size: backup.size,
        location: backup.location as any,
        createdAt: backup.createdAt.toISOString(),
        completedAt: backup.completedAt?.toISOString(),
        createdBy: backup.createdBy,
        filePath: backup.filePath,
        errorMessage: backup.errorMessage,
        restorePointsCount: backup.restorePointsCount,
        logsCount: backup.logsCount,
        retentionDays: backup.retentionDays
      }));
    } catch (error) {
      console.error('Error fetching backups:', error);
      return [];
    }
  }

  async getRestorePoints(): Promise<RestorePoint[]> {
    try {
      const response = await fetch('/api/restore-points');
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch restore points');
      }

      return data.items.map((point: any) => ({
        id: point.id.toString(),
        name: point.name,
        description: point.description,
        backupId: point.backupId.toString(),
        status: point.status as any,
        createdAt: point.createdAt.toISOString(),
        size: point.size
      }));
    } catch (error) {
      console.error('Error fetching restore points:', error);
      return [];
    }
  }

  async createBackup(backupData: {
    name: string;
    description?: string;
    type: 'FULL' | 'INCREMENTAL' | 'DIFFERENTIAL';
    location: 'LOCAL' | 'CLOUD';
    createdBy: number;
  }): Promise<BackupItem> {
    try {
      const response = await fetch('/api/backups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(backupData),
      });

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to create backup');
      }

      return data.backup;
    } catch (error) {
      console.error('Error creating backup:', error);
      throw error;
    }
  }

  async startBackupProcess(backupId: string): Promise<boolean> {
    try {
      const response = await fetch(`/api/backups/${backupId}/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      return data.success;
    } catch (error) {
      console.error('Error starting backup process:', error);
      return false;
    }
  }


  async downloadBackup(backupId: string): Promise<boolean> {
    try {
      const response = await fetch(`/api/backups/${backupId}/download`, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error('Failed to download backup');
      }

      // Create download link
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup-${backupId}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      return true;
    } catch (error) {
      console.error('Error downloading backup:', error);
      return false;
    }
  }

  async deleteBackup(backupId: string): Promise<boolean> {
    try {
      const response = await fetch(`/api/backups/${backupId}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      return data.success;
    } catch (error) {
      console.error('Error deleting backup:', error);
      return false;
    }
  }

  async updateBackupStatus(backupId: string, status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'SCHEDULED', reason?: string): Promise<boolean> {
    try {
      const response = await fetch(`/api/backups/${backupId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status, reason }),
      });

      const data = await response.json();
      return data.success;
    } catch (error) {
      console.error('Error updating backup status:', error);
      return false;
    }
  }

  async restoreSystem(backupId: string): Promise<boolean> {
    try {
      const response = await fetch(`/api/backups/${backupId}/restore`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      return data.success;
    } catch (error) {
      console.error('Error restoring system:', error);
      return false;
    }
  }

  // Progress tracking
  onBackupProgress(backupId: string, callback: (progress: any) => void) {
    this.progressCallbacks.set(backupId, callback);
  }

  offBackupProgress(backupId: string) {
    this.progressCallbacks.delete(backupId);
  }

  private notifyProgress(backupId: string, progress: any) {
    const callback = this.progressCallbacks.get(backupId);
    if (callback) {
      callback(progress);
    }
  }
}

export const backupService = new BackupService();