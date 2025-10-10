"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

export interface User {
  id: number;
  email: string;
  role: string;
  permissions: string[];
  lastLogin?: string;
  isActive?: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  department?: string;
  phone?: string;
  address?: string;
  avatar?: string;
  preferences: {
    language: string;
    notifications: {
      email: boolean;
      push: boolean;
      
    };
  };
}

// Remove hardcoded mock admin defaults

export const useUser = () => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const router = useRouter();

  // Load user data with abortable timeout protection and a single silent retry
  const loadUser = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    const MAX_TIMEOUT_MS = 15000;
    const RETRY_DELAY_MS = 600;

    const attempt = async (timeoutMs: number): Promise<Response> => {
      const controller = new AbortController();
      let settled = false;
      const timeoutId = setTimeout(() => {
        if (!settled) {
          try {
            // @ts-ignore reason not widely supported
            controller.abort('User loading timeout');
          } catch {
            controller.abort();
          }
        }
      }, timeoutMs);
      try {
        const res = await fetch('/api/auth/me', { cache: 'no-store', signal: controller.signal });
        return res;
      } finally {
        settled = true;
        clearTimeout(timeoutId);
      }
    };

    try {
      let response = await attempt(MAX_TIMEOUT_MS);
      if (!response.ok) {
        throw new Error('Unauthorized');
      }

      // If we got here, parse and set user
      const data = await response.json();
      const normalizedRole = String(data.role).toUpperCase();
      setUser({
        id: data.id,
        email: data.email,
        role: normalizedRole,
        permissions: [],
        isActive: data.status === 'ACTIVE'
      });
      setProfile({
        id: String(data.id),
        name: data.email,
        email: data.email,
        role: normalizedRole,
        preferences: { language: 'en', notifications: { email: true, push: true } }
      });
      setIsInitialized(true);
    } catch (err: any) {
      // One silent retry for abort/network cases
      const isAbort = err && (err.name === 'AbortError' || err.code === 'ABORT_ERR');
      const isNetwork = err && (err.message?.includes('Failed to fetch'));
      try {
        if (isAbort || isNetwork) {
          await new Promise(r => setTimeout(r, RETRY_DELAY_MS));
          const retryRes = await attempt(MAX_TIMEOUT_MS + 5000);
          if (!retryRes.ok) throw new Error('Unauthorized');
          const data = await retryRes.json();
          const normalizedRole = String(data.role).toUpperCase();
          setUser({
            id: data.id,
            email: data.email,
            role: normalizedRole,
            permissions: [],
            isActive: data.status === 'ACTIVE'
          });
          setProfile({
            id: String(data.id),
            name: data.email,
            email: data.email,
            role: normalizedRole,
            preferences: { language: 'en', notifications: { email: true, push: true } }
          });
          setIsInitialized(true);
          return;
        }
        throw err; // non-retryable, fall through to catch below
      } catch (finalErr: any) {
        const isAbortFinal = finalErr && (finalErr.name === 'AbortError' || finalErr.code === 'ABORT_ERR');
        const message = isAbortFinal ? (finalErr?.message || 'User loading timeout') : (finalErr instanceof Error ? finalErr.message : 'Failed to load user');
        setError(message);
        // Avoid noisy logs for abort timeouts; still log others
        if (!isAbortFinal) {
          console.error('Failed to load user:', finalErr);
        }
        setUser(null);
        setProfile(null);
        setIsInitialized(true);
      }
    } finally {
      setLoading(false);
    }
  }, []); // Empty dependency array to prevent infinite loop

  // Update user profile
  const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
    try {
      // In real implementation, call API
      // const response = await fetch('/api/user/profile', {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(updates)
      // });
      // if (!response.ok) throw new Error('Failed to update profile');
      // const data = await response.json();
      
      setProfile(prev => prev ? { ...prev, ...updates } : null);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
      console.error('Failed to update profile:', err);
      return false;
    }
  }, []);

  // Update user preferences
  const updatePreferences = useCallback(async (preferences: Partial<UserProfile['preferences']>) => {
    if (!profile) return false;
    
    const updatedPreferences = { ...profile.preferences, ...preferences };
    return await updateProfile({ preferences: updatedPreferences });
  }, [profile, updateProfile]);

  // Logout user
  const logout = useCallback(async () => {
    try {
      // In real implementation, call logout API
      // await fetch('/api/auth/logout', { method: 'POST' });
      
      // Clear user data
      setUser(null);
      setProfile(null);
      setIsInitialized(false);
      
      // Redirect to login
      router.push('/login');
    } catch (err) {
      console.error('Failed to logout:', err);
      // Still redirect even if API call fails
      router.push('/login');
    }
  }, [router]);

  // Check if user has permission
  const hasPermission = useCallback((permission: string): boolean => {
    if (!user) return false;
    return user.permissions.includes(permission);
  }, [user]);

  // Check if user has any of the given permissions
  const hasAnyPermission = useCallback((permissions: string[]): boolean => {
    if (!user) return false;
    return permissions.some(permission => user.permissions.includes(permission));
  }, [user]);

  // Check if user has all of the given permissions
  const hasAllPermissions = useCallback((permissions: string[]): boolean => {
    if (!user) return false;
    return permissions.every(permission => user.permissions.includes(permission));
  }, [user]);

  // Load user on mount
  useEffect(() => {
    loadUser();
  }, []); // Removed loadUser dependency to prevent infinite loop

  return {
    user,
    profile,
    loading,
    error,
    isInitialized,
    loadUser,
    updateProfile,
    updatePreferences,
    logout,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isAuthenticated: !!user,
    isSuperAdmin: user?.role === 'SUPER_ADMIN',
    isAdmin: user?.role === 'ADMIN',
    isDepartmentHead: user?.role === 'DEPARTMENT_HEAD',
    isTeacher: user?.role === 'INSTRUCTOR' || user?.role === 'TEACHER',
    isStudent: user?.role === 'STUDENT',
    isParent: user?.role === 'PARENT',
    isSystemAuditor: user?.role === 'SYSTEM_AUDITOR'
  };
}; 