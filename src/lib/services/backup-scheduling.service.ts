import { db } from '../db';
import { ScheduleFrequency, ScheduleLogStatus, BackupType, BackupLocation, DayOfWeek } from '@prisma/client';
import { backupServerService } from './backup-server.service';
import { backupService } from './backup.service';
// import { logger } from './logger.service';

// Temporary logger implementation
const logger = {
  info: (message: string, ...args: any[]) => console.log(`[INFO] ${message}`, ...args),
  error: (message: string, ...args: any[]) => console.error(`[ERROR] ${message}`, ...args),
  warn: (message: string, ...args: any[]) => console.warn(`[WARN] ${message}`, ...args)
};

export interface CreateScheduleRequest {
  name: string;
  description?: string;
  frequency: ScheduleFrequency;
  interval: number;
  timeOfDay: string; // HH:MM format
  daysOfWeek?: string[];
  dayOfMonth?: number;
  backupType: BackupType;
  location: BackupLocation;
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

export class BackupSchedulingService {
  private static instance: BackupSchedulingService;

  private constructor() {}

  static getInstance(): BackupSchedulingService {
    if (!BackupSchedulingService.instance) {
      BackupSchedulingService.instance = new BackupSchedulingService();
    }
    return BackupSchedulingService.instance;
  }

  /**
   * Create a new backup schedule
   */
  async createSchedule(scheduleData: CreateScheduleRequest) {
    try {
      // Validate input data
      if (!scheduleData.name || !scheduleData.frequency || !scheduleData.createdBy) {
        throw new Error('Missing required fields: name, frequency, and createdBy are required');
      }

      if (scheduleData.interval <= 0) {
        throw new Error('Interval must be greater than 0');
      }

      if (scheduleData.retentionDays < 0) {
        throw new Error('Retention days cannot be negative');
      }

      const nextRun = this.calculateNextRun(
        scheduleData.frequency,
        scheduleData.interval,
        scheduleData.timeOfDay,
        scheduleData.daysOfWeek,
        scheduleData.dayOfMonth
      );

      const schedule = await db.backupSchedule.create({
        data: {
          name: scheduleData.name,
          description: scheduleData.description,
          frequency: scheduleData.frequency,
          interval: scheduleData.interval,
          timeOfDay: scheduleData.timeOfDay,
          daysOfWeek: (scheduleData.daysOfWeek || []) as DayOfWeek[],
          dayOfMonth: scheduleData.dayOfMonth,
          backupType: scheduleData.backupType,
          location: scheduleData.location,
          isEncrypted: scheduleData.isEncrypted,
          retentionDays: scheduleData.retentionDays,
          createdBy: scheduleData.createdBy,
          nextRun
        }
      });

      // Create initial schedule log
      await db.backupScheduleLog.create({
        data: {
          scheduleId: schedule.id,
          status: ScheduleLogStatus.PENDING,
          scheduledAt: nextRun,
          createdBy: scheduleData.createdBy
        }
      });

      logger.info(`Backup schedule created: ${schedule.name} (ID: ${schedule.id})`);
      return schedule;
    } catch (error) {
      logger.error('Error creating backup schedule:', error);
      throw error;
    }
  }

  /**
   * Get all backup schedules
   */
  async getSchedules(params?: {
    isActive?: boolean;
    frequency?: ScheduleFrequency;
    page?: number;
    limit?: number;
    search?: string;
  }) {
    try {
      // Validate pagination parameters
      const page = Math.max(1, params?.page || 1);
      const limit = Math.min(100, Math.max(1, params?.limit || 10));
      const skip = (page - 1) * limit;

      const where: any = {};
      
      if (params?.isActive !== undefined) {
        where.isActive = params.isActive;
      }
      
      if (params?.frequency) {
        where.frequency = params.frequency;
      }
      
      if (params?.search) {
        where.OR = [
          { name: { contains: params.search, mode: 'insensitive' } },
          { description: { contains: params.search, mode: 'insensitive' } }
        ];
      }

      const [schedules, total] = await Promise.all([
        db.backupSchedule.findMany({
          where,
          include: {
            createdByUser: {
              select: {
                userName: true,
                email: true
              }
            },
            scheduleLogs: {
              orderBy: { createdAt: 'desc' },
              take: 5
            }
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit
        }),
        db.backupSchedule.count({ where })
      ]);

      logger.info(`Fetched ${schedules.length} backup schedules (page ${page}/${Math.ceil(total / limit)})`);
      
      return {
        schedules,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Error fetching backup schedules:', error);
      throw error;
    }
  }

  /**
   * Get a specific backup schedule
   */
  async getSchedule(scheduleId: string) {
    try {
      // Validate schedule ID
      const id = parseInt(scheduleId);
      if (isNaN(id) || id <= 0) {
        throw new Error('Invalid schedule ID');
      }

      const schedule = await db.backupSchedule.findUnique({
        where: { id },
        include: {
          createdByUser: {
            select: {
              userName: true,
              email: true
            }
          },
          scheduleLogs: {
            orderBy: { createdAt: 'desc' },
            include: {
              backup: {
                select: {
                  id: true,
                  name: true,
                  status: true,
                  size: true
                }
              }
            }
          }
        }
      });

      if (!schedule) {
        throw new Error('Schedule not found');
      }

      logger.info(`Fetched backup schedule: ${schedule.name} (ID: ${schedule.id})`);
      return schedule;
    } catch (error) {
      logger.error('Error fetching backup schedule:', error);
      throw error;
    }
  }

  /**
   * Update a backup schedule
   */
  async updateSchedule(scheduleId: string, updateData: Partial<CreateScheduleRequest>) {
    try {
      // Validate schedule ID
      const id = parseInt(scheduleId);
      if (isNaN(id) || id <= 0) {
        throw new Error('Invalid schedule ID');
      }

      // Check if schedule exists
      const existingSchedule = await db.backupSchedule.findUnique({
        where: { id }
      });

      if (!existingSchedule) {
        throw new Error('Schedule not found');
      }

      // Validate update data
      if (updateData.interval !== undefined && updateData.interval <= 0) {
        throw new Error('Interval must be greater than 0');
      }

      if (updateData.retentionDays !== undefined && updateData.retentionDays < 0) {
        throw new Error('Retention days cannot be negative');
      }

      const nextRun = updateData.frequency ? this.calculateNextRun(
        updateData.frequency,
        updateData.interval || existingSchedule.interval,
        updateData.timeOfDay || existingSchedule.timeOfDay,
        updateData.daysOfWeek,
        updateData.dayOfMonth
      ) : undefined;

      const { createdBy, daysOfWeek, ...updateDataWithoutCreatedBy } = updateData;
      const schedule = await db.backupSchedule.update({
        where: { id },
        data: {
          ...updateDataWithoutCreatedBy,
          daysOfWeek: daysOfWeek ? (daysOfWeek as DayOfWeek[]) : undefined,
          nextRun,
          updatedAt: new Date()
        }
      });

      logger.info(`Updated backup schedule: ${schedule.name} (ID: ${schedule.id})`);
      return schedule;
    } catch (error) {
      logger.error('Error updating backup schedule:', error);
      throw error;
    }
  }

  /**
   * Delete a backup schedule
   */
  async deleteSchedule(scheduleId: string) {
    try {
      // Validate schedule ID
      const id = parseInt(scheduleId);
      if (isNaN(id) || id <= 0) {
        throw new Error('Invalid schedule ID');
      }

      // Check if schedule exists
      const existingSchedule = await db.backupSchedule.findUnique({
        where: { id }
      });

      if (!existingSchedule) {
        throw new Error('Schedule not found');
      }

      await db.backupSchedule.delete({
        where: { id }
      });

      logger.info(`Deleted backup schedule: ${existingSchedule.name} (ID: ${id})`);
      return true;
    } catch (error) {
      logger.error('Error deleting backup schedule:', error);
      throw error;
    }
  }

  /**
   * Toggle schedule active status
   */
  async toggleScheduleStatus(scheduleId: string) {
    try {
      // Validate schedule ID
      const id = parseInt(scheduleId);
      if (isNaN(id) || id <= 0) {
        throw new Error('Invalid schedule ID');
      }

      const schedule = await db.backupSchedule.findUnique({
        where: { id }
      });

      if (!schedule) {
        throw new Error('Schedule not found');
      }

      const updatedSchedule = await db.backupSchedule.update({
        where: { id },
        data: {
          isActive: !schedule.isActive,
          updatedAt: new Date()
        }
      });

      logger.info(`Toggled schedule status: ${schedule.name} (ID: ${id}) - ${updatedSchedule.isActive ? 'Active' : 'Inactive'}`);
      return updatedSchedule;
    } catch (error) {
      logger.error('Error toggling schedule status:', error);
      throw error;
    }
  }

  /**
   * Execute a scheduled backup
   */
  async executeScheduledBackup(scheduleId: string) {
    try {
      // Validate schedule ID
      const id = parseInt(scheduleId);
      if (isNaN(id) || id <= 0) {
        throw new Error('Invalid schedule ID');
      }

      const schedule = await db.backupSchedule.findUnique({
        where: { id }
      });

      if (!schedule) {
        throw new Error('Schedule not found');
      }

      if (!schedule.isActive) {
        throw new Error('Schedule is inactive');
      }

      logger.info(`Executing scheduled backup: ${schedule.name} (ID: ${id})`);

      // Create schedule log entry
      const scheduleLog = await db.backupScheduleLog.create({
        data: {
          scheduleId: id,
          status: ScheduleLogStatus.RUNNING,
          scheduledAt: new Date(),
          startedAt: new Date(),
          createdBy: schedule.createdBy
        }
      });

      try {
        // Create the backup
        const backup = await backupService.createBackup({
          name: `Scheduled: ${schedule.name}`,
          description: `Automated backup from schedule: ${schedule.name}`,
          type: schedule.backupType,
          location: schedule.location === 'HYBRID' ? 'LOCAL' : schedule.location,
          createdBy: schedule.createdBy
        });

        if (backup) {
          // Update schedule log with backup info
          await db.backupScheduleLog.update({
            where: { id: scheduleLog.id },
            data: {
              backupId: parseInt(backup.id),
              status: ScheduleLogStatus.COMPLETED,
              completedAt: new Date()
            }
          });

          // Update schedule statistics
          await db.backupSchedule.update({
            where: { id },
            data: {
              lastRun: new Date(),
              nextRun: this.calculateNextRun(
                schedule.frequency,
                schedule.interval,
                schedule.timeOfDay,
                schedule.daysOfWeek,
                schedule.dayOfMonth || undefined
              ),
              totalRuns: { increment: 1 },
              successfulRuns: { increment: 1 }
            }
          });

          logger.info(`Successfully executed scheduled backup: ${schedule.name} (ID: ${id})`);
          return backup;
        } else {
          throw new Error('Failed to create backup');
        }
      } catch (error) {
        // Update schedule log with error
        await db.backupScheduleLog.update({
          where: { id: scheduleLog.id },
          data: {
            status: ScheduleLogStatus.FAILED,
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
            completedAt: new Date()
          }
        });

        // Update schedule statistics
        await db.backupSchedule.update({
          where: { id },
          data: {
            lastRun: new Date(),
            totalRuns: { increment: 1 },
            failedRuns: { increment: 1 }
          }
        });

        logger.error(`Failed to execute scheduled backup: ${schedule.name} (ID: ${id})`, error);
        throw error;
      }
    } catch (error) {
      logger.error('Error executing scheduled backup:', error);
      throw error;
    }
  }

  /**
   * Get schedules that need to be executed
   */
  async getSchedulesToExecute() {
    try {
      const now = new Date();
      
      const schedules = await db.backupSchedule.findMany({
        where: {
          isActive: true,
          nextRun: {
            lte: now
          }
        },
        orderBy: {
          nextRun: 'asc'
        }
      });

      logger.info(`Found ${schedules.length} schedules ready for execution`);
      return schedules;
    } catch (error) {
      logger.error('Error fetching schedules to execute:', error);
      throw error;
    }
  }

  /**
   * Get scheduling statistics
   */
  async getScheduleStats(): Promise<ScheduleStats> {
    try {
      const [
        totalSchedules,
        activeSchedules,
        inactiveSchedules,
        totalRuns,
        successfulRuns,
        failedRuns,
        nextScheduledRun
      ] = await Promise.all([
        db.backupSchedule.count(),
        db.backupSchedule.count({ where: { isActive: true } }),
        db.backupSchedule.count({ where: { isActive: false } }),
        db.backupSchedule.aggregate({
          _sum: { totalRuns: true }
        }),
        db.backupSchedule.aggregate({
          _sum: { successfulRuns: true }
        }),
        db.backupSchedule.aggregate({
          _sum: { failedRuns: true }
        }),
        db.backupSchedule.findFirst({
          where: { isActive: true },
          orderBy: { nextRun: 'asc' },
          select: { nextRun: true }
        })
      ]);

      const stats = {
        totalSchedules,
        activeSchedules,
        inactiveSchedules,
        totalRuns: totalRuns._sum.totalRuns || 0,
        successfulRuns: successfulRuns._sum.successfulRuns || 0,
        failedRuns: failedRuns._sum.failedRuns || 0,
        nextScheduledRun: nextScheduledRun?.nextRun || undefined
      };

      logger.info(`Retrieved schedule statistics: ${stats.totalSchedules} total, ${stats.activeSchedules} active`);
      return stats;
    } catch (error) {
      logger.error('Error getting schedule stats:', error);
      throw error;
    }
  }

  /**
   * Calculate the next run time for a schedule
   */
  private calculateNextRun(
    frequency: ScheduleFrequency,
    interval: number,
    timeOfDay: string,
    daysOfWeek?: string[],
    dayOfMonth?: number
  ): Date {
    try {
      const now = new Date();
      
      // Validate time format
      const timeMatch = timeOfDay.match(/^(\d{1,2}):(\d{2})$/);
      if (!timeMatch) {
        throw new Error('Invalid time format. Expected HH:MM');
      }
      
      const hours = parseInt(timeMatch[1], 10);
      const minutes = parseInt(timeMatch[2], 10);
      
      if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
        throw new Error('Invalid time values');
      }
      
      let nextRun = new Date(now);
      nextRun.setHours(hours, minutes, 0, 0);

      // If the time has already passed today, move to the next occurrence
      if (nextRun <= now) {
        nextRun.setDate(nextRun.getDate() + 1);
      }

      switch (frequency) {
        case ScheduleFrequency.DAILY:
          nextRun.setDate(nextRun.getDate() + (interval - 1));
          break;
        
        case ScheduleFrequency.WEEKLY:
          if (daysOfWeek && daysOfWeek.length > 0) {
            // Find the next occurrence of any of the specified days
            const currentDay = nextRun.getDay();
            const targetDays = daysOfWeek.map(day => this.getDayNumber(day));
            const nextDay = targetDays.find(day => day > currentDay) || targetDays[0];
            
            if (nextDay > currentDay) {
              nextRun.setDate(nextRun.getDate() + (nextDay - currentDay));
            } else {
              nextRun.setDate(nextRun.getDate() + (7 - currentDay + nextDay));
            }
          } else {
            nextRun.setDate(nextRun.getDate() + (7 * interval));
          }
          break;
        
        case ScheduleFrequency.MONTHLY:
          if (dayOfMonth) {
            if (dayOfMonth < 1 || dayOfMonth > 31) {
              throw new Error('Invalid day of month');
            }
            nextRun.setDate(dayOfMonth);
            if (nextRun <= now) {
              nextRun.setMonth(nextRun.getMonth() + interval);
            }
          } else {
            nextRun.setMonth(nextRun.getMonth() + interval);
          }
          break;
        
        case ScheduleFrequency.CUSTOM:
          // For custom schedules, use the interval as days
          nextRun.setDate(nextRun.getDate() + interval);
          break;
      }

      return nextRun;
    } catch (error) {
      logger.error('Error calculating next run time:', error);
      throw error;
    }
  }

  /**
   * Convert day string to day number
   */
  private getDayNumber(day: string): number {
    const dayMap: { [key: string]: number } = {
      'SUNDAY': 0,
      'MONDAY': 1,
      'TUESDAY': 2,
      'WEDNESDAY': 3,
      'THURSDAY': 4,
      'FRIDAY': 5,
      'SATURDAY': 6
    };
    
    const dayNumber = dayMap[day.toUpperCase()];
    if (dayNumber === undefined) {
      logger.warn(`Invalid day string: ${day}, defaulting to Sunday (0)`);
      return 0;
    }
    
    return dayNumber;
  }
}

export const backupSchedulingService = BackupSchedulingService.getInstance(); 