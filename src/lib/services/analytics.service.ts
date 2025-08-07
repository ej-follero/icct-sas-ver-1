import { prisma } from '@/lib/prisma';

export interface AnalyticsFilters {
  startDate?: string;
  endDate?: string;
  departmentId?: number;
  courseId?: number;
  yearLevel?: string;
  limit?: number;
}

export interface CacheEntry {
  data: any;
  timestamp: number;
  expiresAt: number;
}

// Data validation utilities
const safeNumber = (value: any): number => {
  if (typeof value === 'number' && !isNaN(value) && isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    if (!isNaN(parsed) && isFinite(parsed)) {
      return parsed;
    }
  }
  return 0;
};

const safePercentage = (value: any): number => {
  const num = safeNumber(value);
  return Math.max(0, Math.min(100, num)); // Clamp between 0-100
};

const validateChartData = (data: any[]): any[] => {
  if (!Array.isArray(data)) {
    return [];
  }

  return data.map(item => {
    if (typeof item === 'object' && item !== null) {
      const validated = { ...item };
      
      // Validate common chart data properties
      if ('value' in validated) {
        validated.value = safeNumber(validated.value);
      }
      if ('percentage' in validated) {
        validated.percentage = safePercentage(validated.percentage);
      }
      if ('count' in validated) {
        validated.count = safeNumber(validated.count);
      }
      if ('average' in validated) {
        validated.average = safeNumber(validated.average);
      }
      if ('total' in validated) {
        validated.total = safeNumber(validated.total);
      }
      if ('present' in validated) {
        validated.present = safeNumber(validated.present);
      }
      if ('absent' in validated) {
        validated.absent = safeNumber(validated.absent);
      }
      if ('late' in validated) {
        validated.late = safeNumber(validated.late);
      }
      if ('attendanceRate' in validated) {
        validated.attendanceRate = safePercentage(validated.attendanceRate);
      }
      if ('riskScore' in validated) {
        validated.riskScore = safeNumber(validated.riskScore);
      }
      
      return validated;
    }
    return item;
  });
};

export class AnalyticsService {
  private cache = new Map<string, CacheEntry>();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  private readonly MAX_CACHE_SIZE = 100;
  private readonly API_BASE = '/api/attendance/analytics';

  // Cache management
  private generateCacheKey(type: string, filters: AnalyticsFilters): string {
    return `${type}:${JSON.stringify(filters)}`;
  }

  private getCachedData(key: string): any | null {
    const entry = this.cache.get(key);
    if (entry && Date.now() < entry.expiresAt) {
      return entry.data;
    }
    if (entry) {
      this.cache.delete(key);
    }
    return null;
  }

  private setCachedData(key: string, data: any): void {
    // Implement LRU cache eviction
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + this.CACHE_DURATION
    });
  }

  public getCacheStats() {
    return {
      size: this.cache.size,
      maxSize: this.MAX_CACHE_SIZE,
      duration: this.CACHE_DURATION
    };
  }

  public clearCache(): void {
    this.cache.clear();
  }

  // Helper method to make API calls
  private async makeApiCall(endpoint: string, params: Record<string, any> = {}): Promise<any> {
    try {
      const url = new URL(`${this.API_BASE}${endpoint}`, window.location.origin);
      
      // Add query parameters
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, value.toString());
        }
      });

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`API call failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'API call failed');
      }

      return result.data;
    } catch (error) {
      console.error(`Analytics API call failed for ${endpoint}:`, error);
      throw error;
    }
  }

  // Trends Analytics
  async getTrends(type: 'weekly' | 'monthly' | 'yearly' | 'timeOfDay' | 'dayOfWeek', filters: AnalyticsFilters) {
    const cacheKey = this.generateCacheKey(`trends:${type}`, filters);
    const cached = this.getCachedData(cacheKey);
    if (cached) return validateChartData(cached);

    try {
      const data = await this.makeApiCall('/trends', {
        type,
        ...this.sanitizeFilters(filters)
      });
      
      const validatedData = validateChartData(data);
      this.setCachedData(cacheKey, validatedData);
      return validatedData;
    } catch (error) {
      console.error('Failed to fetch trends data:', error);
      // Return empty array as fallback
      return [];
    }
  }

  // Comparisons Analytics
  async getComparisons(type: 'department' | 'course' | 'yearLevel' | 'section', filters: AnalyticsFilters) {
    const cacheKey = this.generateCacheKey(`comparisons:${type}`, filters);
    const cached = this.getCachedData(cacheKey);
    if (cached) return validateChartData(cached);

    try {
      const data = await this.makeApiCall('/comparisons', {
        type,
        ...this.sanitizeFilters(filters)
      });
      
      const validatedData = validateChartData(data);
      this.setCachedData(cacheKey, validatedData);
      return validatedData;
    } catch (error) {
      console.error('Failed to fetch comparisons data:', error);
      // Return empty array as fallback
      return [];
    }
  }

  // Breakdown Analytics
  async getBreakdown(type: 'attendance' | 'riskLevel', filters: AnalyticsFilters) {
    const cacheKey = this.generateCacheKey(`breakdown:${type}`, filters);
    const cached = this.getCachedData(cacheKey);
    if (cached) return validateChartData(cached);

    try {
      const data = await this.makeApiCall('/breakdown', {
        type,
        ...this.sanitizeFilters(filters)
      });
      
      const validatedData = validateChartData(data);
      this.setCachedData(cacheKey, validatedData);
      return validatedData;
    } catch (error) {
      console.error('Failed to fetch breakdown data:', error);
      // Return empty array as fallback
      return [];
    }
  }

  // Rankings Analytics
  async getRankings(type: 'performance' | 'goalAchievement' | 'statistical', filters: AnalyticsFilters) {
    const cacheKey = this.generateCacheKey(`rankings:${type}`, filters);
    const cached = this.getCachedData(cacheKey);
    if (cached) return validateChartData(cached);

    try {
      const data = await this.makeApiCall('/rankings', {
        type,
        ...this.sanitizeFilters(filters)
      });
      
      const validatedData = validateChartData(data);
      this.setCachedData(cacheKey, validatedData);
      return validatedData;
    } catch (error) {
      console.error('Failed to fetch rankings data:', error);
      // Return empty array as fallback
      return [];
    }
  }

  // Subject Analytics
  async getSubjectAnalytics(type: 'performance' | 'trends' | 'timeAnalysis' | 'comparison' | 'riskAnalysis' | 'patterns', filters: AnalyticsFilters) {
    const cacheKey = this.generateCacheKey(`subjects:${type}`, filters);
    const cached = this.getCachedData(cacheKey);
    if (cached) return validateChartData(cached);

    try {
      const data = await this.makeApiCall('/subjects', {
        type,
        ...this.sanitizeFilters(filters)
      });
      
      const validatedData = validateChartData(data);
      this.setCachedData(cacheKey, validatedData);
      return validatedData;
    } catch (error) {
      console.error('Failed to fetch subject analytics data:', error);
      // Return empty array as fallback
      return [];
    }
  }

  // Helper method to sanitize filters for API calls
  private sanitizeFilters(filters: AnalyticsFilters): Record<string, any> {
    const sanitized: Record<string, any> = {};
    
    if (filters.startDate) sanitized.startDate = filters.startDate;
    if (filters.endDate) sanitized.endDate = filters.endDate;
    if (filters.departmentId) sanitized.departmentId = filters.departmentId;
    if (filters.courseId) sanitized.courseId = filters.courseId;
    if (filters.yearLevel) sanitized.yearLevel = filters.yearLevel;
    if (filters.limit) sanitized.limit = filters.limit;
    
    return sanitized;
  }

  // Real-time stats (this might still need local computation for real-time updates)
  async getRealTimeStats(filters: AnalyticsFilters) {
    const cacheKey = this.generateCacheKey('realtime', filters);
    const cached = this.getCachedData(cacheKey);
    if (cached) return this.validateRealTimeData(cached);

    try {
      const data = await this.makeApiCall('/real-time', this.sanitizeFilters(filters));
      
      const validatedData = this.validateRealTimeData(data);
      this.setCachedData(cacheKey, validatedData);
      return validatedData;
    } catch (error) {
      console.error('Failed to fetch real-time stats:', error);
      // Return default stats as fallback
      return {
        totalStudents: 0,
        presentToday: 0,
        absentToday: 0,
        lateToday: 0,
        attendanceRate: 0
      };
    }
  }

  // Validate real-time data
  private validateRealTimeData(data: any): any {
    if (typeof data !== 'object' || data === null) {
      return {
        totalStudents: 0,
        presentToday: 0,
        absentToday: 0,
        lateToday: 0,
        attendanceRate: 0
      };
    }

    return {
      totalStudents: safeNumber(data.totalStudents),
      presentToday: safeNumber(data.presentToday),
      absentToday: safeNumber(data.absentToday),
      lateToday: safeNumber(data.lateToday),
      attendanceRate: safePercentage(data.attendanceRate),
      trends: data.trends ? {
        today: safePercentage(data.trends.today),
        weekly: safePercentage(data.trends.weekly),
        monthly: safePercentage(data.trends.monthly),
        trend: data.trends.trend || 'stable'
      } : { today: 0, weekly: 0, monthly: 0, trend: 'stable' },
      recentActivity: Array.isArray(data.recentActivity) ? data.recentActivity : []
    };
  }

  // Method to refresh cache for specific data type
  async refreshCache(type: string, filters: AnalyticsFilters) {
    const cacheKey = this.generateCacheKey(type, filters);
    this.cache.delete(cacheKey);
    
    // Re-fetch the data
    switch (type.split(':')[0]) {
      case 'trends':
        return await this.getTrends(type.split(':')[1] as any, filters);
      case 'comparisons':
        return await this.getComparisons(type.split(':')[1] as any, filters);
      case 'breakdown':
        return await this.getBreakdown(type.split(':')[1] as any, filters);
      case 'rankings':
        return await this.getRankings(type.split(':')[1] as any, filters);
      case 'subjects':
        return await this.getSubjectAnalytics(type.split(':')[1] as any, filters);
      default:
        throw new Error(`Unknown cache type: ${type}`);
    }
  }
}

// Export singleton instance
export const analyticsService = new AnalyticsService(); 