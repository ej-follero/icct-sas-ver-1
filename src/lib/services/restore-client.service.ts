export interface RestoreOptions {
  backupId: string;
  restorePointName?: string;
  restoreFiles?: boolean;
  restoreDatabase?: boolean;
  validateOnly?: boolean;
  previewOnly?: boolean;
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

export interface RestoreValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  conflicts: any[];
}

export interface RestorePoint {
  id: string;
  name: string;
  description?: string;
  backupId: string;
  status: string;
  createdAt: Date;
  createdBy: number;
  filesRestored?: number;
  databaseRestored?: boolean;
  validationErrors?: string[];
  warnings?: string[];
  duration?: number;
  size?: string;
}

export class RestoreClientService {
  private baseUrl = '/api/backup';

  /**
   * Get restore preview for a backup
   */
  async getRestorePreview(backupId: string): Promise<RestorePreview> {
    try {
      const response = await fetch(`${this.baseUrl}/restore?backupId=${backupId}&action=preview`);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to get restore preview');
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting restore preview:', error);
      throw error;
    }
  }

  /**
   * Validate restore operation
   */
  async validateRestore(backupId: string): Promise<RestoreValidation> {
    try {
      const response = await fetch(`${this.baseUrl}/restore?backupId=${backupId}&action=validate`);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to validate restore');
      }

      return await response.json();
    } catch (error) {
      console.error('Error validating restore:', error);
      throw error;
    }
  }

  /**
   * Perform restore operation
   */
  async performRestore(options: RestoreOptions): Promise<RestoreResult> {
    try {
      const response = await fetch(`${this.baseUrl}/restore`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(options),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to perform restore');
      }

      return await response.json();
    } catch (error) {
      console.error('Error performing restore:', error);
      throw error;
    }
  }

  /**
   * Get restore points
   */
  async getRestorePoints(params?: {
    status?: string;
    backupId?: string;
    page?: number;
    limit?: number;
  }) {
    try {
      const searchParams = new URLSearchParams();
      
      if (params?.status) searchParams.append('status', params.status);
      if (params?.backupId) searchParams.append('backupId', params.backupId);
      if (params?.page) searchParams.append('page', params.page.toString());
      if (params?.limit) searchParams.append('limit', params.limit.toString());

      const response = await fetch(`${this.baseUrl}/restore-points?${searchParams}`);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to get restore points');
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting restore points:', error);
      throw error;
    }
  }

  /**
   * Create restore point
   */
  async createRestorePoint(backupId: string, name: string, description?: string): Promise<RestorePoint> {
    try {
      const response = await fetch(`${this.baseUrl}/restore-points`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          backupId,
          name,
          description,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create restore point');
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating restore point:', error);
      throw error;
    }
  }

  /**
   * Rollback to restore point
   */
  async rollbackToRestorePoint(restorePointId: string, createdBy: number): Promise<RestoreResult> {
    try {
      const response = await fetch(`${this.baseUrl}/restore-points/${restorePointId}/rollback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          createdBy,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to rollback to restore point');
      }

      return await response.json();
    } catch (error) {
      console.error('Error rolling back to restore point:', error);
      throw error;
    }
  }
}

export const restoreClientService = new RestoreClientService(); 