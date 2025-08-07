"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'super_admin' | 'admin' | 'department_head' | 'teacher' | 'student' | 'parent' | 'system_auditor';
  avatar?: string;
  department?: string;
  permissions: string[];
  lastLogin?: string;
  isActive: boolean;
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
    theme: 'light' | 'dark' | 'system';
    language: string;
    notifications: {
      email: boolean;
      push: boolean;
      
    };
  };
}

// Mock user data - moved outside to prevent recreation on every render
const mockUser: User = {
  id: '1',
  name: 'EJ Yu',
  email: 'ej.yu@icct.edu.ph',
  role: 'admin',
  avatar: '/api/avatar/1',
  department: 'Information Technology',
  permissions: [
    'dashboard:read',
    'attendance:read',
    'attendance:write',
    'users:read',
    'users:write',
    'reports:read',
    'reports:write',
    'settings:read',
    'settings:write'
  ],
  lastLogin: new Date().toISOString(),
  isActive: true
};

const mockProfile: UserProfile = {
  id: '1',
  name: 'EJ Yu',
  email: 'ej.yu@icct.edu.ph',
  role: 'Administrator',
  department: 'Information Technology',
  phone: '+63 912 345 6789',
  address: 'Manila, Philippines',
  avatar: '/api/avatar/1',
  preferences: {
    theme: 'light',
    language: 'en',
    notifications: {
      email: true,
      push: true,
      
    }
  }
};

export const useUser = () => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const router = useRouter();

  // Load user data with timeout protection
  const loadUser = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Add timeout to prevent infinite loading
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('User loading timeout')), 5000)
      );
      
      const loadPromise = (async () => {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // In real implementation, fetch from API
        // const response = await fetch('/api/user/me');
        // if (!response.ok) throw new Error('Failed to load user');
        // const data = await response.json();
        
        setUser(mockUser);
        setProfile(mockProfile);
        setIsInitialized(true);
      })();
      
      await Promise.race([loadPromise, timeoutPromise]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load user');
      console.error('Failed to load user:', err);
      // Set mock data as fallback to prevent infinite loading
      setUser(mockUser);
      setProfile(mockProfile);
      setIsInitialized(true);
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
    isSuperAdmin: user?.role === 'super_admin',
    isAdmin: user?.role === 'admin',
    isDepartmentHead: user?.role === 'department_head',
    isTeacher: user?.role === 'teacher',
    isStudent: user?.role === 'student',
    isParent: user?.role === 'parent',
    isSystemAuditor: user?.role === 'system_auditor'
  };
}; 