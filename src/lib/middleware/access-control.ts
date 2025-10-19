import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { env } from '@/lib/env-validation';

// Define role hierarchy
const ROLE_HIERARCHY = {
  'SUPER_ADMIN': 4,
  'ADMIN': 3,
  'DEPARTMENT_HEAD': 2,
  'INSTRUCTOR': 1,
  'STUDENT': 0
} as const;

type Role = keyof typeof ROLE_HIERARCHY;

// Define access control rules
const ACCESS_RULES: Record<string, Role[]> = {
  '/settings/security': ['SUPER_ADMIN'],
  '/settings/system-override': ['SUPER_ADMIN'],
  '/settings/advanced-config': ['SUPER_ADMIN'],
  '/settings/performance-tuning': ['SUPER_ADMIN'],
  '/settings/database-management': ['SUPER_ADMIN'],
  '/settings/database-migrations': ['SUPER_ADMIN'],
  '/settings/database-backup': ['SUPER_ADMIN'],
  '/settings/database-restore': ['SUPER_ADMIN'],
  '/settings/api-keys': ['SUPER_ADMIN'],
  '/settings/api-endpoints': ['SUPER_ADMIN'],
  '/settings/api-monitoring': ['SUPER_ADMIN'],
  '/settings/emergency-access': ['SUPER_ADMIN'],
  '/settings/system-recovery': ['SUPER_ADMIN'],
  '/settings/emergency-procedures': ['SUPER_ADMIN'],
  '/settings/super-admin-users': ['SUPER_ADMIN'],
  '/settings/admin-audit': ['SUPER_ADMIN'],
  // View-only access for ADMIN
  '/settings/system-status': ['SUPER_ADMIN', 'ADMIN'],
  '/settings/backup': ['SUPER_ADMIN', 'ADMIN'],
};

export function checkAccess(role: Role, path: string): boolean {
  // Check if path has specific access rules
  if (path in ACCESS_RULES) {
    return ACCESS_RULES[path].includes(role);
  }
  
  // Default: SUPER_ADMIN has access to everything
  if (role === 'SUPER_ADMIN') {
    return true;
  }
  
  // For other roles, check if they have sufficient permissions
  return ROLE_HIERARCHY[role] >= 2; // ADMIN and above
}

export function getRequiredRole(path: string): Role | null {
  if (path in ACCESS_RULES) {
    const roles = ACCESS_RULES[path];
    return roles[0]; // Return the highest required role
  }
  return null;
}

export function createAccessControlMiddleware() {
  return async function accessControlMiddleware(
    request: NextRequest,
    allowedRoles: Role[] = ['SUPER_ADMIN']
  ) {
    try {
      // Get token from cookies
      const token = request.cookies.get('token')?.value;
      
      if (!token) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }

      // Verify JWT token
      const decoded = jwt.verify(token, env.JWT_SECRET) as any;
      const userRole = decoded.role as Role;
      
      // Check if user role is in allowed roles
      if (!allowedRoles.includes(userRole)) {
        return NextResponse.json(
          { 
            error: 'Insufficient permissions',
            required: allowedRoles,
            current: userRole
          },
          { status: 403 }
        );
      }

      return null; // Access granted
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }
  };
}

// Helper function to check if user can access a specific path
export function canAccessPath(userRole: Role, path: string): boolean {
  return checkAccess(userRole, path);
}

// Helper function to get access level for a path
export function getAccessLevel(userRole: Role, path: string): 'FULL' | 'VIEW_ONLY' | 'DENIED' {
  if (!checkAccess(userRole, path)) {
    return 'DENIED';
  }
  
  // SUPER_ADMIN has full access to everything
  if (userRole === 'SUPER_ADMIN') {
    return 'FULL';
  }
  
  // ADMIN has view-only access to certain paths
  const viewOnlyPaths = [
    '/settings/system-status',
    '/settings/backup'
  ];
  
  if (viewOnlyPaths.includes(path)) {
    return 'VIEW_ONLY';
  }
  
  return 'FULL';
}
