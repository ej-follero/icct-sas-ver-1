/**
 * CSRF Protection Implementation
 * Provides Cross-Site Request Forgery protection for API endpoints
 */

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { env } from './env-validation';

const CSRF_TOKEN_HEADER = 'x-csrf-token';
const CSRF_COOKIE_NAME = 'csrf-token';
const CSRF_SECRET_HEADER = 'x-csrf-secret';

// Methods that require CSRF protection
const PROTECTED_METHODS = ['POST', 'PUT', 'DELETE', 'PATCH'];

// Endpoints that are exempt from CSRF protection
const CSRF_EXEMPT_PATHS = [
  '/api/auth/login',
  '/api/auth/logout',
  '/api/health',
  '/api/ping',
];

export interface CSRFConfig {
  secret?: string;
  cookieName?: string;
  headerName?: string;
  exemptPaths?: string[];
  sameSite?: 'strict' | 'lax' | 'none';
  secure?: boolean;
}

export class CSRFProtection {
  private secret: string;
  private cookieName: string;
  private headerName: string;
  private exemptPaths: string[];
  private sameSite: 'strict' | 'lax' | 'none';
  private secure: boolean;

  constructor(config: CSRFConfig = {}) {
    this.secret = config.secret || env.CSRF_SECRET || env.SESSION_SECRET;
    this.cookieName = config.cookieName || CSRF_COOKIE_NAME;
    this.headerName = config.headerName || CSRF_TOKEN_HEADER;
    this.exemptPaths = config.exemptPaths || CSRF_EXEMPT_PATHS;
    this.sameSite = config.sameSite || 'strict';
    this.secure = config.secure ?? env.SECURE_COOKIES;
  }

  /**
   * Generate a CSRF token
   */
  generateToken(): string {
    const timestamp = Date.now().toString();
    const randomBytes = crypto.randomBytes(16).toString('hex');
    const payload = `${timestamp}.${randomBytes}`;
    
    const hmac = crypto.createHmac('sha256', this.secret);
    hmac.update(payload);
    const signature = hmac.digest('hex');
    
    return `${payload}.${signature}`;
  }

  /**
   * Verify a CSRF token
   */
  verifyToken(token: string): boolean {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        return false;
      }

      const [timestamp, randomBytes, signature] = parts;
      const payload = `${timestamp}.${randomBytes}`;
      
      // Verify signature
      const hmac = crypto.createHmac('sha256', this.secret);
      hmac.update(payload);
      const expectedSignature = hmac.digest('hex');
      
      if (signature !== expectedSignature) {
        return false;
      }

      // Check token age (valid for 24 hours)
      const tokenTime = parseInt(timestamp);
      const now = Date.now();
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours
      
      if (now - tokenTime > maxAge) {
        return false;
      }

      return true;
    } catch (error) {
      console.error('CSRF token verification error:', error);
      return false;
    }
  }

  /**
   * Check if a path is exempt from CSRF protection
   */
  isExemptPath(pathname: string): boolean {
    return this.exemptPaths.some(exemptPath => 
      pathname.startsWith(exemptPath)
    );
  }

  /**
   * Check if a method requires CSRF protection
   */
  requiresProtection(method: string): boolean {
    return PROTECTED_METHODS.includes(method.toUpperCase());
  }

  /**
   * Set CSRF token in response cookies
   */
  setTokenCookie(response: NextResponse, token: string): void {
    response.cookies.set(this.cookieName, token, {
      httpOnly: false, // Needs to be accessible by client-side JavaScript
      secure: this.secure,
      sameSite: this.sameSite,
      maxAge: 24 * 60 * 60, // 24 hours
      path: '/',
    });
  }

  /**
   * Middleware function to handle CSRF protection
   */
  middleware(request: NextRequest): NextResponse | null {
    const { pathname } = request.nextUrl;
    const method = request.method;

    // Skip CSRF protection for exempt paths
    if (this.isExemptPath(pathname)) {
      return null;
    }

    // Skip CSRF protection for safe methods
    if (!this.requiresProtection(method)) {
      return null;
    }

    // Get tokens from request
    const cookieToken = request.cookies.get(this.cookieName)?.value;
    const headerToken = request.headers.get(this.headerName);

    // For API routes, require both tokens to match
    if (pathname.startsWith('/api/')) {
      if (!cookieToken || !headerToken) {
        return NextResponse.json(
          { 
            error: 'CSRF token missing',
            code: 'CSRF_TOKEN_MISSING',
            message: 'CSRF protection requires both cookie and header tokens'
          },
          { status: 403 }
        );
      }

      if (cookieToken !== headerToken) {
        return NextResponse.json(
          { 
            error: 'CSRF token mismatch',
            code: 'CSRF_TOKEN_MISMATCH',
            message: 'CSRF tokens do not match'
          },
          { status: 403 }
        );
      }

      if (!this.verifyToken(cookieToken)) {
        return NextResponse.json(
          { 
            error: 'Invalid CSRF token',
            code: 'CSRF_TOKEN_INVALID',
            message: 'CSRF token is invalid or expired'
          },
          { status: 403 }
        );
      }
    }

    return null; // Continue processing
  }

  /**
   * Generate and set a new CSRF token for a response
   */
  setupCSRFToken(response: NextResponse): string {
    const token = this.generateToken();
    this.setTokenCookie(response, token);
    
    // Also set in header for debugging
    response.headers.set(CSRF_SECRET_HEADER, token);
    
    return token;
  }
}

// Global CSRF protection instance
export const csrfProtection = new CSRFProtection();

/**
 * Helper function to validate CSRF token in API routes
 */
export function validateCSRF(request: NextRequest): void {
  const pathname = request.url;
  const method = request.method;

  // Skip validation for safe methods or exempt paths
  if (!csrfProtection.requiresProtection(method) || 
      csrfProtection.isExemptPath(pathname)) {
    return;
  }

  const cookieToken = request.cookies.get(CSRF_COOKIE_NAME)?.value;
  const headerToken = request.headers.get(CSRF_TOKEN_HEADER);

  if (!cookieToken || !headerToken) {
    throw new Error('CSRF token missing');
  }

  if (cookieToken !== headerToken) {
    throw new Error('CSRF token mismatch');
  }

  if (!csrfProtection.verifyToken(cookieToken)) {
    throw new Error('Invalid CSRF token');
  }
}

/**
 * Helper function to get CSRF token for client-side use
 */
export function getCSRFToken(request: NextRequest): string | null {
  return request.cookies.get(CSRF_COOKIE_NAME)?.value || null;
}

/**
 * API endpoint to get CSRF token
 */
export function createCSRFTokenResponse(): NextResponse {
  const token = csrfProtection.generateToken();
  const response = NextResponse.json({ token });
  csrfProtection.setTokenCookie(response, token);
  return response;
}
