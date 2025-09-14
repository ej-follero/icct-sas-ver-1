interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

interface CacheConfig {
  defaultTTL: number; // Default time to live in milliseconds
  maxSize: number; // Maximum number of items in cache
}

class RFIDCache {
  private cache = new Map<string, CacheItem<any>>();
  private config: CacheConfig;

  constructor(config: CacheConfig = { defaultTTL: 5 * 60 * 1000, maxSize: 100 }) {
    this.config = config;
  }

  set<T>(key: string, data: T, ttl?: number): void {
    // Clean up expired items first
    this.cleanup();

    // Remove oldest items if cache is full
    if (this.cache.size >= this.config.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    const item: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.config.defaultTTL
    };

    this.cache.set(key, item);
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }

    // Check if item has expired
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    this.cleanup();
    return this.cache.size;
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key);
      }
    }
  }

  // Cache keys for different data types
  static getKeys() {
    return {
      dashboard: 'rfid:dashboard',
      stats: 'rfid:stats',
      recentScans: 'rfid:recent-scans',
      readerStatus: 'rfid:reader-status',
      tagActivity: 'rfid:tag-activity',
      scanTrends: 'rfid:scan-trends',
      locationActivity: 'rfid:location-activity'
    };
  }
}

// Create singleton instance
export const rfidCache = new RFIDCache();

// Cache utilities
export const cacheUtils = {
  // Generate cache key with parameters
  generateKey(baseKey: string, params?: Record<string, any>): string {
    if (!params) return baseKey;
    
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}=${params[key]}`)
      .join('&');
    
    return `${baseKey}:${sortedParams}`;
  },

  // Cache with automatic key generation
  setWithParams<T>(baseKey: string, data: T, params?: Record<string, any>, ttl?: number): void {
    const key = this.generateKey(baseKey, params);
    rfidCache.set(key, data, ttl);
  },

  // Get with automatic key generation
  getWithParams<T>(baseKey: string, params?: Record<string, any>): T | null {
    const key = this.generateKey(baseKey, params);
    return rfidCache.get<T>(key);
  },

  // Invalidate cache by pattern
  invalidatePattern(pattern: string): void {
    const keys = Array.from(rfidCache['cache'].keys());
    keys.forEach(key => {
      if (key.includes(pattern)) {
        rfidCache.delete(key);
      }
    });
  }
};

export default RFIDCache;
