import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { securityAuditService } from '@/lib/services/security-audit.service';
import { env } from '@/lib/env-validation';

export interface UserContext {
  userId: number;
  email: string;
  role: string;
  permissions: string[];
  ipAddress: string;
  userAgent: string;
}

export interface AccessRule {
  path: string;
  methods?: string[];
  roles: string[];
  permissions?: string[];
  conditions?: (context: UserContext) => boolean;
}

// Enhanced access control rules
const ACCESS_RULES: AccessRule[] = [
  // Super Admin only routes
  {
    path: '/settings/security',
    roles: ['SUPER_ADMIN'],
    permissions: ['SECURITY_MANAGE'],
  },
  {
    path: '/settings/access-control',
    roles: ['SUPER_ADMIN'],
    permissions: ['ACCESS_CONTROL_MANAGE'],
  },
  {
    path: '/settings/system-override',
    roles: ['SUPER_ADMIN'],
    permissions: ['SYSTEM_OVERRIDE'],
  },
  {
    path: '/settings/emergency-access',
    roles: ['SUPER_ADMIN'],
    permissions: ['EMERGENCY_ACCESS'],
  },
  
  // Admin and Super Admin routes
  {
    path: '/settings/system-status',
    roles: ['SUPER_ADMIN', 'ADMIN'],
    permissions: ['SYSTEM_MONITOR'],
  },
  {
    path: '/settings/backup',
    roles: ['SUPER_ADMIN', 'ADMIN'],
    permissions: ['BACKUP_MANAGE'],
  },
  
  // Department Head routes
  {
    path: '/dashboard/department',
    roles: ['SUPER_ADMIN', 'ADMIN', 'DEPARTMENT_HEAD'],
    permissions: ['DEPARTMENT_MANAGE'],
  },
  
  // Instructor routes
  {
    path: '/dashboard/attendance',
    roles: ['SUPER_ADMIN', 'ADMIN', 'DEPARTMENT_HEAD', 'INSTRUCTOR'],
    permissions: ['ATTENDANCE_VIEW'],
  },
  {
    path: '/reports',
    roles: ['SUPER_ADMIN', 'ADMIN', 'DEPARTMENT_HEAD', 'INSTRUCTOR'],
    permissions: ['REPORTS_VIEW'],
  },
  
  // Student routes
  {
    path: '/dashboard/student',
    roles: ['STUDENT'],
    permissions: ['STUDENT_VIEW'],
  },
  
  // API routes
  {
    path: '/api/users',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    roles: ['SUPER_ADMIN', 'ADMIN'],
    permissions: ['USER_MANAGE'],
  },
  {
    path: '/api/security',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    roles: ['SUPER_ADMIN'],
    permissions: ['SECURITY_MANAGE'],
  },
  {
    path: '/api/backups',
    methods: ['GET', 'POST', 'DELETE'],
    roles: ['SUPER_ADMIN', 'ADMIN'],
    permissions: ['BACKUP_MANAGE'],
  },
];

// Permission definitions
const PERMISSIONS = {
  // System permissions
  SYSTEM_MONITOR: ['SUPER_ADMIN', 'ADMIN'],
  SYSTEM_OVERRIDE: ['SUPER_ADMIN'],
  EMERGENCY_ACCESS: ['SUPER_ADMIN'],
  
  // Security permissions
  SECURITY_MANAGE: ['SUPER_ADMIN'],
  ACCESS_CONTROL_MANAGE: ['SUPER_ADMIN'],
  SECURITY_AUDIT: ['SUPER_ADMIN', 'ADMIN'],
  
  // User management permissions
  USER_MANAGE: ['SUPER_ADMIN', 'ADMIN'],
  USER_VIEW: ['SUPER_ADMIN', 'ADMIN', 'DEPARTMENT_HEAD'],
  
  // Data permissions
  ATTENDANCE_VIEW: ['SUPER_ADMIN', 'ADMIN', 'DEPARTMENT_HEAD', 'INSTRUCTOR'],
  ATTENDANCE_MANAGE: ['SUPER_ADMIN', 'ADMIN', 'INSTRUCTOR'],
  REPORTS_VIEW: ['SUPER_ADMIN', 'ADMIN', 'DEPARTMENT_HEAD', 'INSTRUCTOR'],
  REPORTS_GENERATE: ['SUPER_ADMIN', 'ADMIN', 'INSTRUCTOR'],
  
  // Department permissions
  DEPARTMENT_MANAGE: ['SUPER_ADMIN', 'ADMIN', 'DEPARTMENT_HEAD'],
  DEPARTMENT_VIEW: ['SUPER_ADMIN', 'ADMIN', 'DEPARTMENT_HEAD', 'INSTRUCTOR'],
  
  // Backup permissions
  BACKUP_MANAGE: ['SUPER_ADMIN', 'ADMIN'],
  BACKUP_VIEW: ['SUPER_ADMIN', 'ADMIN'],
  
  // Student permissions
  STUDENT_VIEW: ['STUDENT'],
  STUDENT_MANAGE: ['SUPER_ADMIN', 'ADMIN', 'DEPARTMENT_HEAD', 'INSTRUCTOR'],
};

export class EnhancedAccessControl {
  
  /**
   * Check if user has access to a specific path
   */
  static async checkAccess(
    request: NextRequest,
    userContext: UserContext
  ): Promise<{ allowed: boolean; reason?: string; requiredRole?: string; requiredPermission?: string }> {
    
    const { pathname } = request.nextUrl;
    const method = request.method;
    
    // Find matching access rule
    const rule = this.findMatchingRule(pathname, method);
    
    if (!rule) {
      // No specific rule found, allow access (default behavior)
      return { allowed: true };
    }
    
    // Check role-based access
    if (!rule.roles.includes(userContext.role)) {
      await this.logAccessDenied(userContext, pathname, 'INSUFFICIENT_ROLE', {
        requiredRoles: rule.roles,
        userRole: userContext.role,
      });
      
      return {
        allowed: false,
        reason: 'Insufficient role',
        requiredRole: rule.roles[0],
      };
    }
    
    // Check permission-based access
    if (rule.permissions) {
      const hasPermission = rule.permissions.every(permission => 
        this.hasPermission(userContext.role, permission)
      );
      
      if (!hasPermission) {
        await this.logAccessDenied(userContext, pathname, 'INSUFFICIENT_PERMISSION', {
          requiredPermissions: rule.permissions,
          userRole: userContext.role,
        });
        
        return {
          allowed: false,
          reason: 'Insufficient permissions',
          requiredPermission: rule.permissions[0],
        };
      }
    }
    
    // Check custom conditions
    if (rule.conditions && !rule.conditions(userContext)) {
      await this.logAccessDenied(userContext, pathname, 'CONDITION_FAILED', {
        userContext,
      });
      
      return {
        allowed: false,
        reason: 'Access condition not met',
      };
    }
    
    // Log successful access
    await this.logAccessGranted(userContext, pathname);
    
    return { allowed: true };
  }
  
  /**
   * Find matching access rule for path and method
   */
  private static findMatchingRule(pathname: string, method: string): AccessRule | null {
    return ACCESS_RULES.find(rule => {
      // Check path match
      if (!pathname.startsWith(rule.path)) {
        return false;
      }
      
      // Check method match (if specified)
      if (rule.methods && !rule.methods.includes(method)) {
        return false;
      }
      
      return true;
    }) || null;
  }
  
  /**
   * Check if user has specific permission
   */
  private static hasPermission(role: string, permission: string): boolean {
    const allowedRoles = PERMISSIONS[permission as keyof typeof PERMISSIONS];
    return allowedRoles ? allowedRoles.includes(role) : false;
  }
  
  /**
   * Log access denied event
   */
  private static async logAccessDenied(
    userContext: UserContext,
    path: string,
    reason: string,
    details: Record<string, any>
  ): Promise<void> {
    try {
      await securityAuditService.logSecurityEvent({
        type: 'ACCESS_DENIED',
        severity: 'MEDIUM',
        userId: userContext.userId,
        userEmail: userContext.email,
        ipAddress: userContext.ipAddress,
        userAgent: userContext.userAgent,
        details: {
          path,
          reason,
          userRole: userContext.role,
          ...details,
        },
      });
    } catch (error) {
      console.error('Failed to log access denied event:', error);
    }
  }
  
  /**
   * Log access granted event
   */
  private static async logAccessGranted(
    userContext: UserContext,
    path: string
  ): Promise<void> {
    try {
      await securityAuditService.logSecurityEvent({
        type: 'DATA_ACCESS',
        severity: 'LOW',
        userId: userContext.userId,
        userEmail: userContext.email,
        ipAddress: userContext.ipAddress,
        userAgent: userContext.userAgent,
        details: {
          path,
          userRole: userContext.role,
        },
      });
    } catch (error) {
      console.error('Failed to log access granted event:', error);
    }
  }
  
  /**
   * Extract user context from request
   */
  static extractUserContext(request: NextRequest): UserContext | null {
    try {
      // Get JWT token from cookies
      const token = request.cookies.get('token')?.value;
      
      if (!token) {
        return null;
      }
      
      // Verify and decode JWT
      const decoded = jwt.verify(token, env.JWT_SECRET) as any;
      
      return {
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role,
        permissions: decoded.permissions || [],
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      };
    } catch (error) {
      console.error('Failed to extract user context:', error);
      return null;
    }
  }
  
  /**
   * Create access denied response
   */
  static createAccessDeniedResponse(reason: string, requiredRole?: string, requiredPermission?: string): NextResponse {
    const response = NextResponse.json(
      {
        success: false,
        error: 'Access denied',
        reason,
        requiredRole,
        requiredPermission,
        timestamp: new Date().toISOString(),
      },
      { status: 403 }
    );
    
    // Add security headers
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    
    return response;
  }
  
  /**
   * Get user permissions for a specific role
   */
  static getUserPermissions(role: string): string[] {
    const permissions: string[] = [];
    
    for (const [permission, allowedRoles] of Object.entries(PERMISSIONS)) {
      if (allowedRoles.includes(role)) {
        permissions.push(permission);
      }
    }
    
    return permissions;
  }
  
  /**
   * Check if user can perform action on resource
   */
  static canPerformAction(
    userRole: string,
    action: string,
    resource: string,
    context?: Record<string, any>
  ): boolean {
    // Define action-resource mappings
    const actionMappings: Record<string, string[]> = {
      'CREATE': ['USER_MANAGE', 'DEPARTMENT_MANAGE', 'ATTENDANCE_MANAGE'],
      'READ': ['USER_VIEW', 'DEPARTMENT_VIEW', 'ATTENDANCE_VIEW', 'REPORTS_VIEW'],
      'UPDATE': ['USER_MANAGE', 'DEPARTMENT_MANAGE', 'ATTENDANCE_MANAGE'],
      'DELETE': ['USER_MANAGE', 'DEPARTMENT_MANAGE', 'ATTENDANCE_MANAGE'],
    };
    
    const requiredPermissions = actionMappings[action] || [];
    
    return requiredPermissions.some(permission => 
      this.hasPermission(userRole, permission)
    );
  }
}

export default EnhancedAccessControl;
