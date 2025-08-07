import { toast } from "sonner";

export interface BackupItem {
  id: string;
  name: string;
  type: "FULL" | "INCREMENTAL" | "DIFFERENTIAL";
  size: string;
  status: "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "FAILED" | "CANCELLED";
  createdAt: string;
  description?: string;
  retentionDays: number;
  isEncrypted: boolean;
  location: "LOCAL" | "CLOUD" | "HYBRID";
  createdBy: string;
  completedAt?: string;
  errorMessage?: string;
  restorePointsCount: number;
  logsCount: number;
  filePath?: string; // Path to actual backup file
}

export interface RestorePoint {
  id: string;
  name: string;
  backupId: string;
  backupName: string;
  backupType: string;
  backupSize: string;
  status: "AVAILABLE" | "RESTORING" | "FAILED" | "COMPLETED";
  createdAt: string;
  description?: string;
  createdBy: string;
  restoredAt?: string;
  errorMessage?: string;
}

export interface CreateBackupRequest {
  name: string;
  description?: string;
  type: "FULL" | "INCREMENTAL" | "DIFFERENTIAL";
  location: "LOCAL" | "CLOUD" | "HYBRID";
  isEncrypted?: boolean;
  baseBackupId?: string;
  createdBy: number;
}

export interface CreateRestorePointRequest {
  name: string;
  description?: string;
  backupId: string;
  createdBy: number;
}

interface BackupProgress {
  percentage: number;
  currentTask: string;
  filesProcessed: number;
  totalFiles: number;
  bytesProcessed: number;
  totalBytes: number;
}

class BackupService {
  private baseUrl = '/api/backup';
  private cache = new Map<string, { data: any; timestamp: number }>();
  private cacheTimeout = 5000; // 5 seconds
  private progressCallbacks = new Map<string, (progress: BackupProgress) => void>();

  private getCachedData(key: string) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    return null;
  }

  private setCachedData(key: string, data: any) {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  // Public methods
  async getBackups(): Promise<BackupItem[]> {
    try {
      // Check cache first
      const cached = this.getCachedData('backups');
      if (cached) {
        return cached;
      }

      const response = await fetch(this.baseUrl, {
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
      
      if (!response.ok) {
        // If it's a 500 error, it might be because there are no backups or database issues
        if (response.status === 500) {
          console.warn('Server error fetching backups - likely no data available or database issue');
          return [];
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      const result = data.data || [];
      
      // Cache the result
      this.setCachedData('backups', result);
      
      return result;
    } catch (error) {
      console.error('Error fetching backups:', error);
      toast.error('Failed to fetch backups');
      return [];
    }
  }

  async createBackup(backupData: CreateBackupRequest): Promise<BackupItem | null> {
    try {
      // Route to appropriate endpoint based on backup type
      const endpoint = backupData.type === 'INCREMENTAL' ? `${this.baseUrl}/incremental` : this.baseUrl;
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(backupData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create backup');
      }

      const data = await response.json();
      const backup = data.data?.backup || data.data;
      
      // Clear cache after creating backup
      this.cache.delete('backups');
      
      toast.success(data.message || 'Backup created successfully');
      
      return backup;
    } catch (error) {
      console.error('Error creating backup:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create backup');
      return null;
    }
  }

  async updateBackupStatus(backupId: string, status: string, errorMessage?: string, size?: string, filePath?: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/${backupId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status,
          errorMessage,
          size,
          filePath,
          completedAt: status === 'COMPLETED' || status === 'FAILED' ? new Date().toISOString() : undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update backup status');
      }

      // Clear cache after updating backup
      this.cache.delete('backups');
      
      toast.success(`Backup ${status.toLowerCase()} successfully`);
      return true;
    } catch (error) {
      console.error('Error updating backup status:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update backup status');
      return false;
    }
  }

  async deleteBackup(backupId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/${backupId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete backup');
      }

      // Clear cache after deleting backup
      this.cache.delete('backups');
      
      toast.success('Backup deleted successfully');
      return true;
    } catch (error) {
      console.error('Error deleting backup:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete backup');
      return false;
    }
  }

  async getRestorePoints(): Promise<RestorePoint[]> {
    try {
      // Check cache first
      const cached = this.getCachedData('restorePoints');
      if (cached) {
        return cached;
      }

      const response = await fetch(`${this.baseUrl}/restore-points`, {
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
      
      if (!response.ok) {
        // If it's a 500 error, it might be because there are no restore points
        if (response.status === 500) {
          console.warn('Server error fetching restore points - likely no data available');
          return [];
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      const result = data.data || [];
      
      // Cache the result
      this.setCachedData('restorePoints', result);
      
      return result;
    } catch (error) {
      console.error('Error fetching restore points:', error);
      // Don't show error toast for empty restore points
      if (error instanceof Error && error.message.includes('500')) {
        console.warn('No restore points available');
        return [];
      }
      toast.error('Failed to fetch restore points');
      return [];
    }
  }

  async createRestorePoint(restorePointData: CreateRestorePointRequest): Promise<RestorePoint | null> {
    try {
      const response = await fetch(`${this.baseUrl}/restore-points`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(restorePointData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create restore point');
      }

      const data = await response.json();
      toast.success(data.message || 'Restore point created successfully');
      return data.data;
    } catch (error) {
      console.error('Error creating restore point:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create restore point');
      return null;
    }
  }

  async restoreSystem(restorePointId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/restore-points/${restorePointId}/restore`, {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to restore system');
      }

      toast.success('System restore started successfully');
      return true;
    } catch (error) {
      console.error('Error restoring system:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to restore system');
      return false;
    }
  }

  async getBackupLogs(params?: {
    backupId?: string;
    action?: string;
    status?: string;
    page?: number;
    limit?: number;
    search?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<{
    logs: any[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
    stats: {
      total: number;
      byStatus: Record<string, number>;
    };
  }> {
    try {
      const searchParams = new URLSearchParams();
      
      if (params?.backupId) searchParams.append('backupId', params.backupId);
      if (params?.action) searchParams.append('action', params.action);
      if (params?.status) searchParams.append('status', params.status);
      if (params?.page) searchParams.append('page', params.page.toString());
      if (params?.limit) searchParams.append('limit', params.limit.toString());
      if (params?.search) searchParams.append('search', params.search);
      if (params?.startDate) searchParams.append('startDate', params.startDate);
      if (params?.endDate) searchParams.append('endDate', params.endDate);
      
      const url = `${this.baseUrl}/logs?${searchParams.toString()}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data.data || {
        logs: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
        stats: { total: 0, byStatus: {} }
      };
    } catch (error) {
      console.error('Error fetching backup logs:', error);
      toast.error('Failed to fetch backup logs');
      return {
        logs: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
        stats: { total: 0, byStatus: {} }
      };
    }
  }

  async createBackupLog(logData: {
    backupId?: string;
    action: string;
    status: string;
    message?: string;
    details?: any;
    createdBy: number;
  }): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/logs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(logData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create backup log');
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error creating backup log:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create backup log');
      return null;
    }
  }

  async downloadBackup(backupId: string): Promise<boolean> {
    try {
      // Show loading toast
      const loadingToast = toast.loading('Preparing download...');
      
      const response = await fetch(`${this.baseUrl}/${backupId}/download`, {
        method: 'GET',
      });

      if (!response.ok) {
        const errorData = await response.json();
        toast.dismiss(loadingToast);
        throw new Error(errorData.error || 'Failed to download backup');
      }

      // Get the filename from the response headers
      const contentDisposition = response.headers.get('content-disposition');
      let filename = `backup-${backupId}.zip`;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      // Get content length for progress tracking
      const contentLength = response.headers.get('content-length');
      const totalSize = contentLength ? parseInt(contentLength) : 0;

      // Create a readable stream for progress tracking
      const reader = response.body?.getReader();
      if (!reader) {
        toast.dismiss(loadingToast);
        throw new Error('Failed to create download stream');
      }

      const chunks: Uint8Array[] = [];
      let receivedLength = 0;

      // Read the stream with progress tracking
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        chunks.push(value);
        receivedLength += value.length;
        
        // Update progress
        if (totalSize > 0) {
          const progress = Math.round((receivedLength / totalSize) * 100);
          toast.loading(`Downloading... ${progress}%`, { id: loadingToast });
        }
      }

      // Combine chunks into a single blob
      const blob = new Blob(chunks, { type: 'application/zip' });
      
      // Create a download link and trigger download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.dismiss(loadingToast);
      toast.success(`Backup downloaded successfully: ${filename}`);
      return true;
    } catch (error) {
      console.error('Error downloading backup:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to download backup');
      return false;
    }
  }

  async uploadBackup(
    file: File, 
    name: string, 
    description?: string, 
    createdBy?: number,
    onProgress?: (progress: number) => void
  ): Promise<BackupItem | null> {
    try {
      // Show loading toast
      const loadingToast = toast.loading('Preparing upload...');
      
      // Validate file
      if (!file) {
        toast.dismiss(loadingToast);
        throw new Error('No file selected');
      }

      // Check file size (500MB limit)
      const maxSize = 500 * 1024 * 1024; // 500MB
      if (file.size > maxSize) {
        toast.dismiss(loadingToast);
        throw new Error(`File size exceeds maximum limit of ${maxSize / (1024 * 1024)}MB`);
      }

      // Check file type
      const allowedTypes = ['.zip', '.tar.gz', '.tar'];
      const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
      if (!allowedTypes.includes(fileExtension)) {
        toast.dismiss(loadingToast);
        throw new Error(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`);
      }

      // Create form data
      const formData = new FormData();
      formData.append('file', file);
      formData.append('name', name);
      if (description) {
        formData.append('description', description);
      }
      formData.append('createdBy', (createdBy || 149647).toString()); // Use default user ID if not provided

      // Upload with progress tracking
      const xhr = new XMLHttpRequest();
      
      return new Promise((resolve, reject) => {
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 100);
            onProgress?.(progress);
            toast.loading(`Uploading... ${progress}%`, { id: loadingToast });
          }
        });

        xhr.addEventListener('load', async () => {
          try {
            if (xhr.status === 200) {
              const response = JSON.parse(xhr.responseText);
              toast.dismiss(loadingToast);
              toast.success('Backup uploaded successfully');
              
              // Clear cache after uploading backup
              this.cache.delete('backups');
              this.cache.delete('restorePoints');
              
              resolve(response.data);
            } else {
              const errorData = JSON.parse(xhr.responseText);
              toast.dismiss(loadingToast);
              reject(new Error(errorData.error || 'Upload failed'));
            }
          } catch (error) {
            toast.dismiss(loadingToast);
            reject(error);
          }
        });

        xhr.addEventListener('error', () => {
          toast.dismiss(loadingToast);
          reject(new Error('Network error during upload'));
        });

        xhr.addEventListener('abort', () => {
          toast.dismiss(loadingToast);
          reject(new Error('Upload was cancelled'));
        });

        // Start upload
        xhr.open('POST', `${this.baseUrl}/upload`);
        xhr.send(formData);
      });

    } catch (error) {
      console.error('Error uploading backup:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to upload backup');
      return null;
    }
  }

  // Progress tracking
  onBackupProgress(backupId: string, callback: (progress: BackupProgress) => void): void {
    this.progressCallbacks.set(backupId, callback);
  }

  offBackupProgress(backupId: string): void {
    this.progressCallbacks.delete(backupId);
  }

  // Verification methods
  async verifyBackup(backupId: string): Promise<any> {
    try {
      const response = await fetch('/api/backup/verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ backupId }),
      });

      if (!response.ok) {
        throw new Error(`Verification failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error verifying backup:', error);
      throw error;
    }
  }

  async verifyAllBackups(): Promise<any> {
    try {
      const response = await fetch('/api/backup/verification', {
        method: 'PUT',
      });

      if (!response.ok) {
        throw new Error(`Bulk verification failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error verifying all backups:', error);
      throw error;
    }
  }

  async getVerificationStats(): Promise<any> {
    try {
      const response = await fetch('/api/backup/verification');

      if (!response.ok) {
        throw new Error(`Failed to get verification stats: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error getting verification stats:', error);
      throw error;
    }
  }

  // Incremental backup methods
  async detectChanges(baseBackupId?: string): Promise<any> {
    try {
      const params = baseBackupId ? `?baseBackupId=${baseBackupId}` : '';
      const response = await fetch(`${this.baseUrl}/incremental${params}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to detect changes');
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error detecting changes:', error);
      throw error;
    }
  }

  async createIncrementalBackup(incrementalData: {
    name: string;
    description?: string;
    baseBackupId: string;
    detectChanges?: boolean;
    createdBy: number;
  }): Promise<BackupItem | null> {
    try {
      const response = await fetch(`${this.baseUrl}/incremental`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(incrementalData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create incremental backup');
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error creating incremental backup:', error);
      throw error;
    }
  }
}

export const backupService = new BackupService(); 