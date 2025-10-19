import Redis from 'ioredis';

class RedisService {
  private redis: Redis | null = null;
  private isConnected = false;

  constructor() {
    this.initializeRedis();
  }

  private async initializeRedis() {
    try {
      if (process.env.REDIS_URL) {
        this.redis = new Redis(process.env.REDIS_URL, {
          maxRetriesPerRequest: 3,
          lazyConnect: true,
        });

        this.redis.on('connect', () => {
          console.log('Redis connected');
          this.isConnected = true;
        });

        this.redis.on('error', (error) => {
          console.error('Redis connection error:', error);
          this.isConnected = false;
        });

        this.redis.on('close', () => {
          console.log('Redis connection closed');
          this.isConnected = false;
        });

        // Test connection
        await this.redis.ping();
      }
    } catch (error) {
      console.error('Failed to initialize Redis:', error);
      this.isConnected = false;
    }
  }

  async getHealthStatus() {
    if (!this.redis || !this.isConnected) {
      return {
        status: 'unhealthy',
        responseTime: 'N/A',
        cacheSize: 0,
        cacheKeys: 0,
        memoryUsage: 'N/A',
        lastCheck: new Date().toISOString()
      };
    }

    try {
      const startTime = Date.now();
      
      // Test connection with ping
      await this.redis.ping();
      const responseTime = Date.now() - startTime;

      // Get cache statistics
      const info = await this.redis.info('memory');
      const dbSize = await this.redis.dbsize();
      
      // Parse memory info
      const memoryMatch = info.match(/used_memory:(\d+)/);
      const memoryUsage = memoryMatch ? parseInt(memoryMatch[1]) : 0;

      return {
        status: 'healthy',
        responseTime: `${responseTime}ms`,
        cacheSize: Math.round(memoryUsage / 1024 / 1024), // Convert to MB
        cacheKeys: dbSize,
        memoryUsage: `${Math.round(memoryUsage / 1024 / 1024)} MB`,
        lastCheck: new Date().toISOString()
      };
    } catch (error) {
      console.error('Redis health check failed:', error);
      return {
        status: 'unhealthy',
        responseTime: 'timeout',
        cacheSize: 0,
        cacheKeys: 0,
        memoryUsage: 'N/A',
        lastCheck: new Date().toISOString()
      };
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.redis || !this.isConnected) {
      return null;
    }

    try {
      const data = await this.redis.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Redis get error:', error);
      return null;
    }
  }

  async set(key: string, value: any, ttl: number = 300): Promise<boolean> {
    if (!this.redis || !this.isConnected) {
      return false;
    }

    try {
      await this.redis.setex(key, ttl, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Redis set error:', error);
      return false;
    }
  }

  async del(key: string): Promise<boolean> {
    if (!this.redis || !this.isConnected) {
      return false;
    }

    try {
      await this.redis.del(key);
      return true;
    } catch (error) {
      console.error('Redis delete error:', error);
      return false;
    }
  }

  async invalidatePattern(pattern: string): Promise<boolean> {
    if (!this.redis || !this.isConnected) {
      return false;
    }

    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
      return true;
    } catch (error) {
      console.error('Redis pattern invalidation error:', error);
      return false;
    }
  }

  isHealthy(): boolean {
    return this.isConnected && this.redis !== null;
  }

  async disconnect() {
    if (this.redis) {
      await this.redis.quit();
      this.redis = null;
      this.isConnected = false;
    }
  }
}

// Export singleton instance
export const redisService = new RedisService();
