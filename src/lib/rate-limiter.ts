/**
 * Rate Limiting Implementation
 * Provides configurable rate limiting for API endpoints
 */

import { NextRequest, NextResponse } from 'next/server';
import { env } from './env-validation';

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  message?: string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (request: NextRequest) => string;
}

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

class InMemoryRateLimitStore {
  private store: RateLimitStore = {};
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Clean up expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  private cleanup(): void {
    const now = Date.now();
    Object.keys(this.store).forEach(key => {
      if (this.store[key].resetTime <= now) {
        delete this.store[key];
      }
    });
  }

  get(key: string): { count: number; resetTime: number } | undefined {
    const entry = this.store[key];
    if (!entry) return undefined;
    
    if (entry.resetTime <= Date.now()) {
      delete this.store[key];
      return undefined;
    }
    
    return entry;
  }

  set(key: string, count: number, resetTime: number): void {
    this.store[key] = { count, resetTime };
  }

  increment(key: string, windowMs: number): { count: number; resetTime: number } {
    const now = Date.now();
    const resetTime = now + windowMs;
    const existing = this.get(key);
    
    if (!existing) {
      this.set(key, 1, resetTime);
      return { count: 1, resetTime };
    }
    
    const newCount = existing.count + 1;
    this.set(key, newCount, existing.resetTime);
    return { count: newCount, resetTime: existing.resetTime };
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.store = {};
  }
}

export class RateLimiter {
  private config: RateLimitConfig;
  public store: InMemoryRateLimitStore;

  constructor(config: RateLimitConfig) {
    this.config = config;
    this.store = new InMemoryRateLimitStore();
  }

  private getKey(request: NextRequest): string {
    if (this.config.keyGenerator) {
      return this.config.keyGenerator(request);
    }

    // Default key generation: IP + User-Agent hash for better uniqueness
    const ip = this.getClientIP(request);
    const userAgent = request.headers.get('user-agent') || '';
    
    // Use Web Crypto API for better compatibility
    let uaHash = '';
    try {
      if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
        // Browser environment - use a simple hash
        uaHash = this.simpleHash(userAgent);
      } else {
        // Node.js environment - use crypto module
        const crypto = require('crypto');
        uaHash = crypto.createHash('md5').update(userAgent).digest('hex').substring(0, 8);
      }
    } catch (error) {
      // Fallback to simple hash
      uaHash = this.simpleHash(userAgent);
    }
    
    return `${ip}:${uaHash}`;
  }

  private simpleHash(str: string): string {
    let hash = 0;
    if (str.length === 0) return hash.toString();
    
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return Math.abs(hash).toString(16).substring(0, 8);
  }

  private getClientIP(request: NextRequest): string {
    // Try various headers to get real client IP
    const headers = [
      'x-forwarded-for',
      'x-real-ip',
      'x-client-ip',
      'cf-connecting-ip', // Cloudflare
      'x-forwarded', 
      'forwarded-for',
      'forwarded'
    ];

    for (const header of headers) {
      const value = request.headers.get(header);
      if (value) {
        // x-forwarded-for can contain multiple IPs, take the first one
        const ip = value.split(',')[0].trim();
        if (this.isValidIP(ip)) {
          return ip;
        }
      }
    }

    // Fallback to a generic identifier
    return 'unknown';
  }

  private isValidIP(ip: string): boolean {
    // Basic IP validation (IPv4 and IPv6)
    const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
    
    return ipv4Regex.test(ip) || ipv6Regex.test(ip);
  }

  async checkLimit(request: NextRequest): Promise<{
    allowed: boolean;
    limit: number;
    remaining: number;
    resetTime: number;
    retryAfter?: number;
  }> {
    try {
      const key = this.getKey(request);
      const result = this.store.increment(key, this.config.windowMs);
      
      const allowed = result.count <= this.config.maxRequests;
      const remaining = Math.max(0, this.config.maxRequests - result.count);
      const retryAfter = allowed ? undefined : Math.ceil((result.resetTime - Date.now()) / 1000);

      return {
        allowed,
        limit: this.config.maxRequests,
        remaining,
        resetTime: result.resetTime,
        retryAfter
      };
    } catch (error) {
      console.error('Rate limiter error:', error);
      // On error, allow the request to prevent blocking legitimate users
      return {
        allowed: true,
        limit: this.config.maxRequests,
        remaining: this.config.maxRequests,
        resetTime: Date.now() + this.config.windowMs
      };
    }
  }

  middleware() {
    return async (request: NextRequest): Promise<NextResponse | null> => {
      try {
        const result = await this.checkLimit(request);
        
        if (!result.allowed) {
          const response = NextResponse.json(
            {
              error: 'Too many requests',
              message: this.config.message || `Too many requests. Limit: ${this.config.maxRequests} per ${this.config.windowMs / 1000} seconds.`,
              retryAfter: result.retryAfter
            },
            { status: 429 }
          );

          // Add rate limit headers
          response.headers.set('X-RateLimit-Limit', result.limit.toString());
          response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
          response.headers.set('X-RateLimit-Reset', Math.ceil(result.resetTime / 1000).toString());
          response.headers.set('Retry-After', result.retryAfter?.toString() || '60');

          return response;
        }

        return null; // Continue processing
      } catch (error) {
        console.error('Rate limiter middleware error:', error);
        // On error, allow the request to prevent blocking legitimate users
        return null;
      }
    };
  }

  addHeadersToResponse(response: NextResponse, request: NextRequest): Promise<void> {
    return this.checkLimit(request).then(result => {
      response.headers.set('X-RateLimit-Limit', result.limit.toString());
      response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
      response.headers.set('X-RateLimit-Reset', Math.ceil(result.resetTime / 1000).toString());
    });
  }
}

// Pre-configured rate limiters for different endpoint types
export const rateLimiters = {
  // General API endpoints
  api: new RateLimiter({
    windowMs: env.RATE_LIMIT_WINDOW,
    maxRequests: env.RATE_LIMIT_MAX_REQUESTS,
    message: 'Too many API requests'
  }),

  // Authentication endpoints (stricter limits)
  auth: new RateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
    message: 'Too many authentication attempts. Please try again later.'
  }),

  // Password reset (very strict)
  passwordReset: new RateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3,
    message: 'Too many password reset requests. Please try again later.'
  }),

  // File upload endpoints
  upload: new RateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10,
    message: 'Too many upload requests'
  }),

  // Search endpoints
  search: new RateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60,
    message: 'Too many search requests'
  }),

  // Backup operations (limited due to resource intensity)
  backup: new RateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 5,
    message: 'Too many backup requests'
  }),

  // Security-sensitive operations
  security: new RateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 10,
    message: 'Too many security-related requests'
  })
};

// Helper function to apply rate limiting to specific endpoints
export function getRateLimiterForPath(pathname: string): RateLimiter | null {
  if (pathname.includes('/auth/')) {
    return rateLimiters.auth;
  }
  
  if (pathname.includes('/reset-password') || pathname.includes('/forgot-password')) {
    return rateLimiters.passwordReset;
  }
  
  if (pathname.includes('/upload')) {
    return rateLimiters.upload;
  }
  
  if (pathname.includes('/search')) {
    return rateLimiters.search;
  }
  
  if (pathname.includes('/backup')) {
    return rateLimiters.backup;
  }
  
  if (pathname.includes('/security')) {
    return rateLimiters.security;
  }
  
  if (pathname.startsWith('/api/')) {
    return rateLimiters.api;
  }
  
  return null;
}

// Cleanup function for graceful shutdown
export function cleanupRateLimiters(): void {
  Object.values(rateLimiters).forEach(limiter => {
    if (limiter && limiter.store && 'destroy' in limiter.store) {
      (limiter.store as any).destroy();
    }
  });
}
