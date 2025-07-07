import { useState, useEffect, useCallback } from 'react';

export type Theme = 'light' | 'dark' | 'system';

export const useTheme = () => {
  const [theme, setTheme] = useState<Theme>('light');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

  // Get system preference
  const getSystemTheme = useCallback((): 'light' | 'dark' => {
    if (typeof window === 'undefined') return 'light';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }, []);

  // Apply theme to document
  const applyTheme = useCallback((newTheme: 'light' | 'dark') => {
    if (typeof document === 'undefined') return;
    
    const root = document.documentElement;
    
    if (newTheme === 'dark') {
      root.classList.add('dark');
      root.setAttribute('data-theme', 'dark');
    } else {
      root.classList.remove('dark');
      root.setAttribute('data-theme', 'light');
    }
    
    setResolvedTheme(newTheme);
  }, []);

  // Handle theme change
  const changeTheme = useCallback((newTheme: Theme) => {
    setTheme(newTheme);
    
    // Save to localStorage
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('theme', newTheme);
    }
    
    // Apply theme
    if (newTheme === 'system') {
      const systemTheme = getSystemTheme();
      applyTheme(systemTheme);
    } else {
      applyTheme(newTheme);
    }
  }, [applyTheme, getSystemTheme]);

  // Toggle between light and dark
  const toggleTheme = useCallback(() => {
    const currentResolved = resolvedTheme;
    const newTheme: Theme = currentResolved === 'light' ? 'dark' : 'light';
    changeTheme(newTheme);
  }, [resolvedTheme, changeTheme]);

  // Initialize theme
  useEffect(() => {
    // Get saved theme from localStorage
    const savedTheme = typeof localStorage !== 'undefined' 
      ? (localStorage.getItem('theme') as Theme) || 'system'
      : 'system';
    
    setTheme(savedTheme);
    
    if (savedTheme === 'system') {
      const systemTheme = getSystemTheme();
      applyTheme(systemTheme);
      
      // Listen for system theme changes
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e: MediaQueryListEvent) => {
        applyTheme(e.matches ? 'dark' : 'light');
      };
      
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else {
      applyTheme(savedTheme);
    }
  }, [applyTheme, getSystemTheme]);

  return {
    theme,
    resolvedTheme,
    changeTheme,
    toggleTheme,
    isDark: resolvedTheme === 'dark',
    isLight: resolvedTheme === 'light'
  };
}; 