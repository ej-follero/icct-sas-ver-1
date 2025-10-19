interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

interface CacheConfig {
  maxSize: number;
  defaultTTL: number;
}

class AnalyticsCache {
  private cache = new Map<string, CacheEntry<any>>();
  private config: CacheConfig;

  constructor(config: CacheConfig = { maxSize: 100, defaultTTL: 5 * 60 * 1000 }) {
    this.config = config;
  }

  set<T>(key: string, data: T, ttl?: number): void {
    // Remove oldest entries if cache is full
    if (this.cache.size >= this.config.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey !== undefined) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.config.defaultTTL
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }

  // Get cache statistics
  getStats() {
    const now = Date.now();
    const entries = Array.from(this.cache.entries()).map(([key, entry]) => ({
      key,
      age: now - entry.timestamp,
      ttl: entry.ttl,
      expired: now - entry.timestamp > entry.ttl
    }));

    return {
      size: this.cache.size,
      maxSize: this.config.maxSize,
      entries
    };
  }
}

// Create a singleton instance
export const analyticsCache = new AnalyticsCache();

// Utility functions for common cache operations
export const cacheKey = {
  analytics: (type: string, filters: Record<string, any>) => 
    `analytics:${type}:${JSON.stringify(filters)}`,
  chart: (chartType: string, dataHash: string) => 
    `chart:${chartType}:${dataHash}`,
  processed: (dataHash: string, operation: string) => 
    `processed:${operation}:${dataHash}`
};

export const withCache = <T>(
  key: string,
  fn: () => Promise<T> | T,
  ttl?: number
): Promise<T> | T => {
  const cached = analyticsCache.get<T>(key);
  if (cached !== null) {
    return cached;
  }

  const result = fn();
  
  if (result instanceof Promise) {
    return result.then(data => {
      analyticsCache.set(key, data, ttl);
      return data;
    });
  } else {
    analyticsCache.set(key, result, ttl);
    return result;
  }
}; 