import { db } from '../db';
import { ScheduleFrequency, ScheduleLogStatus, BackupType, BackupLocation, DayOfWeek } from '@prisma/client';
import { backupServerService } from './backup-server.service';
import { backupService } from './backup.service';

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

      return schedule;
    } catch (error) {
      console.error('Error creating backup schedule:', error);
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

      const page = params?.page || 1;
      const limit = params?.limit || 10;
      const skip = (page - 1) * limit;

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
      console.error('Error fetching backup schedules:', error);
      throw error;
    }
  }

  /**
   * Get a specific backup schedule
   */
  async getSchedule(scheduleId: string) {
    try {
      const schedule = await db.backupSchedule.findUnique({
        where: { id: parseInt(scheduleId) },
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

      return schedule;
    } catch (error) {
      console.error('Error fetching backup schedule:', error);
      throw error;
    }
  }

  /**
   * Update a backup schedule
   */
  async updateSchedule(scheduleId: string, updateData: Partial<CreateScheduleRequest>) {
    try {
      const nextRun = updateData.frequency ? this.calculateNextRun(
        updateData.frequency,
        updateData.interval || 1,
        updateData.timeOfDay || '02:00',
        updateData.daysOfWeek,
        updateData.dayOfMonth
      ) : undefined;

      const { createdBy, daysOfWeek, ...updateDataWithoutCreatedBy } = updateData;
      const schedule = await db.backupSchedule.update({
        where: { id: parseInt(scheduleId) },
        data: {
          ...updateDataWithoutCreatedBy,
          daysOfWeek: daysOfWeek ? (daysOfWeek as DayOfWeek[]) : undefined,
          nextRun,
          updatedAt: new Date()
        }
      });

      return schedule;
    } catch (error) {
      console.error('Error updating backup schedule:', error);
      throw error;
    }
  }

  /**
   * Delete a backup schedule
   */
  async deleteSchedule(scheduleId: string) {
    try {
      await db.backupSchedule.delete({
        where: { id: parseInt(scheduleId) }
      });

      return true;
    } catch (error) {
      console.error('Error deleting backup schedule:', error);
      throw error;
    }
  }

  /**
   * Toggle schedule active status
   */
  async toggleScheduleStatus(scheduleId: string) {
    try {
      const schedule = await db.backupSchedule.findUnique({
        where: { id: parseInt(scheduleId) }
      });

      if (!schedule) {
        throw new Error('Schedule not found');
      }

      const updatedSchedule = await db.backupSchedule.update({
        where: { id: parseInt(scheduleId) },
        data: {
          isActive: !schedule.isActive,
          updatedAt: new Date()
        }
      });

      return updatedSchedule;
    } catch (error) {
      console.error('Error toggling schedule status:', error);
      throw error;
    }
  }

  /**
   * Execute a scheduled backup
   */
  async executeScheduledBackup(scheduleId: string) {
    try {
      const schedule = await db.backupSchedule.findUnique({
        where: { id: parseInt(scheduleId) }
      });

      if (!schedule) {
        throw new Error('Schedule not found');
      }

      if (!schedule.isActive) {
        throw new Error('Schedule is inactive');
      }

      // Create schedule log entry
      const scheduleLog = await db.backupScheduleLog.create({
        data: {
          scheduleId: parseInt(scheduleId),
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
          location: schedule.location,
          isEncrypted: schedule.isEncrypted,
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
            where: { id: parseInt(scheduleId) },
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
          where: { id: parseInt(scheduleId) },
          data: {
            lastRun: new Date(),
            totalRuns: { increment: 1 },
            failedRuns: { increment: 1 }
          }
        });

        throw error;
      }
    } catch (error) {
      console.error('Error executing scheduled backup:', error);
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
        }
      });

      return schedules;
    } catch (error) {
      console.error('Error fetching schedules to execute:', error);
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

      return {
        totalSchedules,
        activeSchedules,
        inactiveSchedules,
        totalRuns: totalRuns._sum.totalRuns || 0,
        successfulRuns: successfulRuns._sum.successfulRuns || 0,
        failedRuns: failedRuns._sum.failedRuns || 0,
        nextScheduledRun: nextScheduledRun?.nextRun || undefined
      };
    } catch (error) {
      console.error('Error getting schedule stats:', error);
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
    const now = new Date();
    const [hours, minutes] = timeOfDay.split(':').map(Number);
    
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
    return dayMap[day] || 0;
  }
}

export const backupSchedulingService = BackupSchedulingService.getInstance(); 