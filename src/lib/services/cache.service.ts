import Redis from 'ioredis';

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  prefix?: string;
}

export interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
  totalKeys: number;
  memoryUsage: string;
}

export class CacheService {
  private redis: Redis;
  private stats = {
    hits: 0,
    misses: 0,
  };

  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });

    this.redis.on('error', (err) => {
      console.error('Redis connection error:', err);
    });

    this.redis.on('connect', () => {
      console.log('Redis connected successfully');
    });
  }

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.redis.get(key);
      if (value) {
        this.stats.hits++;
        return JSON.parse(value);
      } else {
        this.stats.misses++;
        return null;
      }
    } catch (error) {
      console.error('Cache get error:', error);
      this.stats.misses++;
      return null;
    }
  }

  /**
   * Set value in cache
   */
  async set(key: string, value: any, options: CacheOptions = {}): Promise<boolean> {
    try {
      const serializedValue = JSON.stringify(value);
      const ttl = options.ttl || 3600; // Default 1 hour
      
      await this.redis.setex(key, ttl, serializedValue);
      return true;
    } catch (error) {
      console.error('Cache set error:', error);
      return false;
    }
  }

  /**
   * Delete key from cache
   */
  async delete(key: string): Promise<boolean> {
    try {
      const result = await this.redis.del(key);
      return result > 0;
    } catch (error) {
      console.error('Cache delete error:', error);
      return false;
    }
  }

  /**
   * Delete multiple keys
   */
  async deleteMany(keys: string[]): Promise<number> {
    try {
      if (keys.length === 0) return 0;
      const result = await this.redis.del(...keys);
      return result;
    } catch (error) {
      console.error('Cache delete many error:', error);
      return 0;
    }
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.redis.exists(key);
      return result === 1;
    } catch (error) {
      console.error('Cache exists error:', error);
      return false;
    }
  }

  /**
   * Get or set pattern (cache-aside pattern)
   */
  async getOrSet<T>(
    key: string, 
    fetchFn: () => Promise<T>, 
    options: CacheOptions = {}
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const fresh = await fetchFn();
    await this.set(key, fresh, options);
    return fresh;
  }

  /**
   * Invalidate cache by pattern
   */
  async invalidatePattern(pattern: string): Promise<number> {
    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length === 0) return 0;
      
      const result = await this.redis.del(...keys);
      return result;
    } catch (error) {
      console.error('Cache invalidate pattern error:', error);
      return 0;
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<CacheStats> {
    try {
      const info = await this.redis.info('memory');
      const totalKeys = await this.redis.dbsize();
      
      const hitRate = this.stats.hits + this.stats.misses > 0 
        ? (this.stats.hits / (this.stats.hits + this.stats.misses)) * 100 
        : 0;

      // Extract memory usage from Redis info
      const memoryMatch = info.match(/used_memory_human:([^\r\n]+)/);
      const memoryUsage = memoryMatch ? memoryMatch[1] : 'Unknown';

      return {
        hits: this.stats.hits,
        misses: this.stats.misses,
        hitRate: Math.round(hitRate * 100) / 100,
        totalKeys,
        memoryUsage,
      };
    } catch (error) {
      console.error('Cache stats error:', error);
      return {
        hits: this.stats.hits,
        misses: this.stats.misses,
        hitRate: 0,
        totalKeys: 0,
        memoryUsage: 'Error',
      };
    }
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<boolean> {
    try {
      await this.redis.flushdb();
      return true;
    } catch (error) {
      console.error('Cache clear error:', error);
      return false;
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      const result = await this.redis.ping();
      return result === 'PONG';
    } catch (error) {
      console.error('Cache health check error:', error);
      return false;
    }
  }

  /**
   * Close Redis connection
   */
  async close(): Promise<void> {
    try {
      await this.redis.quit();
    } catch (error) {
      console.error('Cache close error:', error);
    }
  }
}

// Singleton instance
export const cacheService = new CacheService();

// Cache key generators
export const CacheKeys = {
  // Student cache keys
  student: (id: number) => `student:${id}`,
  studentsByDepartment: (departmentId: number) => `students:department:${departmentId}`,
  studentsByCourse: (courseId: number) => `students:course:${courseId}`,
  
  // Attendance cache keys
  attendanceByStudent: (studentId: number, date?: string) => 
    `attendance:student:${studentId}${date ? `:${date}` : ''}`,
  attendanceBySection: (sectionId: number, date?: string) => 
    `attendance:section:${sectionId}${date ? `:${date}` : ''}`,
  attendanceStats: (studentId: number) => `attendance:stats:${studentId}`,
  
  // Section cache keys
  section: (id: number) => `section:${id}`,
  sectionsByCourse: (courseId: number) => `sections:course:${courseId}`,
  
  // Subject schedule cache keys
  schedule: (id: number) => `schedule:${id}`,
  schedulesByInstructor: (instructorId: number) => `schedules:instructor:${instructorId}`,
  schedulesByRoom: (roomId: number) => `schedules:room:${roomId}`,
  
  // Analytics cache keys
  analytics: (type: string, filters: Record<string, any>) => 
    `analytics:${type}:${JSON.stringify(filters)}`,
  
  // System cache keys
  systemStats: () => 'system:stats',
  userPermissions: (userId: number) => `user:permissions:${userId}`,
  
  // Email cache keys
  emailsByUser: (userId: number) => `emails:user:${userId}`,
  emailStats: () => 'emails:stats',
};

// Cache TTL constants (in seconds)
export const CacheTTL = {
  SHORT: 300,      // 5 minutes
  MEDIUM: 1800,    // 30 minutes
  LONG: 3600,      // 1 hour
  VERY_LONG: 86400, // 24 hours
};
