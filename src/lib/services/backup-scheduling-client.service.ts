export interface CreateScheduleRequest {
  name: string;
  description?: string;
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'CUSTOM';
  interval: number;
  timeOfDay: string; // HH:MM format
  daysOfWeek?: string[];
  dayOfMonth?: number;
  backupType: 'FULL' | 'INCREMENTAL';
  location: 'LOCAL' | 'CLOUD' | 'HYBRID';
  isEncrypted: boolean;
  retentionDays: number;
  createdBy: number;
}

export interface ScheduleStats {
  totalSchedules: number;
  activeSchedules: number;
  inactiveSchedules: number;
  totalRuns: number;
  successfulRuns: number;
  failedRuns: number;
  nextScheduledRun?: Date;
}

export interface Schedule {
  id: number;
  name: string;
  description?: string;
  frequency: string;
  interval: number;
  timeOfDay: string;
  daysOfWeek: string[];
  dayOfMonth?: number;
  isActive: boolean;
  lastRun?: Date;
  nextRun?: Date;
  totalRuns: number;
  successfulRuns: number;
  failedRuns: number;
  backupType: string;
  location: string;
  isEncrypted: boolean;
  retentionDays: number;
  createdBy: number;
  createdAt: Date;
  updatedAt: Date;
  createdByUser: {
    userName: string;
    email: string;
  };
  scheduleLogs: ScheduleLog[];
}

export interface ScheduleLog {
  id: number;
  scheduleId: number;
  backupId?: number;
  status: string;
  scheduledAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  errorMessage?: string;
  createdBy: number;
  createdAt: Date;
  backup?: {
    id: number;
    name: string;
    status: string;
    size: string;
  };
}

class BackupSchedulingClientService {
  private static instance: BackupSchedulingClientService;

  private constructor() {}

  static getInstance(): BackupSchedulingClientService {
    if (!BackupSchedulingClientService.instance) {
      BackupSchedulingClientService.instance = new BackupSchedulingClientService();
    }
    return BackupSchedulingClientService.instance;
  }

  /**
   * Get all backup schedules
   */
  async getSchedules(params?: {
    isActive?: boolean;
    frequency?: string;
    page?: number;
    limit?: number;
    search?: string;
  }) {
    try {
      const searchParams = new URLSearchParams();
      
      if (params?.isActive !== undefined) {
        searchParams.append('isActive', params.isActive.toString());
      }
      
      if (params?.frequency) {
        searchParams.append('frequency', params.frequency);
      }
      
      if (params?.page) {
        searchParams.append('page', params.page.toString());
      }
      
      if (params?.limit) {
        searchParams.append('limit', params.limit.toString());
      }
      
      if (params?.search) {
        searchParams.append('search', params.search);
      }

      const response = await fetch(`/api/backup/schedules?${searchParams.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch schedules: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error fetching schedules:', error);
      throw error;
    }
  }

  /**
   * Get a specific backup schedule
   */
  async getSchedule(scheduleId: string) {
    try {
      const response = await fetch(`/api/backup/schedules/${scheduleId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch schedule: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error fetching schedule:', error);
      throw error;
    }
  }

  /**
   * Create a new backup schedule
   */
  async createSchedule(scheduleData: CreateScheduleRequest) {
    try {
      const response = await fetch('/api/backup/schedules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(scheduleData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create schedule');
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error creating schedule:', error);
      throw error;
    }
  }

  /**
   * Update a backup schedule
   */
  async updateSchedule(scheduleId: string, updateData: Partial<CreateScheduleRequest>) {
    try {
      const response = await fetch(`/api/backup/schedules/${scheduleId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update schedule');
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error updating schedule:', error);
      throw error;
    }
  }

  /**
   * Delete a backup schedule
   */
  async deleteSchedule(scheduleId: string) {
    try {
      const response = await fetch(`/api/backup/schedules/${scheduleId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete schedule');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error deleting schedule:', error);
      throw error;
    }
  }

  /**
   * Toggle schedule active status
   */
  async toggleScheduleStatus(scheduleId: string) {
    try {
      const response = await fetch(`/api/backup/schedules/${scheduleId}/toggle`, {
        method: 'PUT',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to toggle schedule status');
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error toggling schedule status:', error);
      throw error;
    }
  }

  /**
   * Execute a backup schedule
   */
  async executeSchedule(scheduleId: string) {
    try {
      const response = await fetch(`/api/backup/schedules/${scheduleId}/execute`, {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to execute schedule');
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error executing schedule:', error);
      throw error;
    }
  }

  /**
   * Get schedule statistics
   */
  async getScheduleStats(): Promise<ScheduleStats> {
    try {
      const response = await fetch('/api/backup/schedules/stats');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch schedule stats: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error fetching schedule stats:', error);
      throw error;
    }
  }
}

export const backupSchedulingClientService = BackupSchedulingClientService.getInstance(); 