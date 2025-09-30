import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import { env } from '@/lib/env-validation';
import { csrfProtection } from '@/lib/csrf-protection';
import { getRateLimiterForPath } from '@/lib/rate-limiter';

// Define protected routes and their required roles
const protectedRoutes = {
  '/dashboard': ['ADMIN', 'INSTRUCTOR', 'STUDENT'],
  '/list': ['ADMIN', 'INSTRUCTOR'],
  '/reports': ['ADMIN', 'INSTRUCTOR'],
  '/analytics': ['ADMIN', 'INSTRUCTOR'],
  '/settings': ['ADMIN'],
  '/rfid': ['ADMIN'],
  '/api/emails': ['ADMIN', 'INSTRUCTOR'],
  '/api/announcements': ['ADMIN', 'INSTRUCTOR'],
  // Removed messaging APIs
  '/api/users': ['ADMIN'],
  '/api/roles': ['ADMIN'],
  '/api/departments': ['ADMIN'],
  '/api/courses': ['ADMIN'],
  '/api/instructors': ['ADMIN'],
  '/api/students': ['ADMIN', 'INSTRUCTOR'],
  '/api/attendance': ['ADMIN', 'INSTRUCTOR'],
  '/api/reports': ['ADMIN', 'INSTRUCTOR'],
};

// Define public routes that don't require authentication
const publicRoutes = [
  '/login',
  '/forgot-password',
  '/reset-password',
  '/api/auth/login',
  '/api/auth/logout',
  '/api/auth/reset-password',
  '/api/health',
  '/api/ping',
];

interface JWTPayload {
  userId: number;
  email: string;
  role: string;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Apply rate limiting first
  const rateLimiter = getRateLimiterForPath(pathname);
  if (rateLimiter) {
    const rateLimitResponse = await rateLimiter.middleware()(request);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }
  }

  // Check CSRF protection (for API routes)
  if (pathname.startsWith('/api/')) {
    const csrfResponse = csrfProtection.middleware(request);
    if (csrfResponse) {
      return csrfResponse;
    }
  }

  // Allow public routes
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    const response = NextResponse.next();
    
    // Set CSRF token for public routes that might need it
    if (pathname === '/login' || pathname === '/api/csrf-token') {
      csrfProtection.setupCSRFToken(response);
    }
    
    return response;
  }

  // Ensure email APIs are always protected (no dev bypass)

  // Check if route requires authentication
  const requiresAuth = Object.keys(protectedRoutes).some(route => 
    pathname.startsWith(route)
  );

  if (!requiresAuth) {
    return NextResponse.next();
  }

  // Get token from cookies
  const token = request.cookies.get('token')?.value;

  if (!token) {
    // For API routes, return JSON 401 instead of redirect
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    // Redirect to login for page routes
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  try {
    // Verify JWT token using validated environment variable
    const decoded = jwt.verify(
      token, 
      env.JWT_SECRET
    ) as JWTPayload;

    // Check role-based access
    const userRole = decoded.role;
    // Hard-block System Auditor role from accessing the app
    if (userRole === 'SYSTEM_AUDITOR') {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    const allowedRoles = Object.entries(protectedRoutes)
      .find(([route]) => pathname.startsWith(route))?.[1] || [];

    if (!allowedRoles.includes(userRole)) {
      // Redirect to unauthorized page or dashboard
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // Add user info to headers for API routes
    if (pathname.startsWith('/api/')) {
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set('x-user-id', decoded.userId.toString());
      requestHeaders.set('x-user-email', decoded.email);
      requestHeaders.set('x-user-role', decoded.role);

      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
    }

    return NextResponse.next();
  } catch (error) {
    // Invalid token, redirect to login
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}; 