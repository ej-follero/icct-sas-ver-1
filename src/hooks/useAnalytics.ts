import { useState, useEffect, useCallback, useMemo } from 'react';
import { AnalyticsService, AnalyticsFilters } from '@/lib/services/analytics.service';

// Create a singleton instance of the analytics service
const analyticsService = new AnalyticsService();

export interface UseAnalyticsOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
  onError?: (error: Error) => void;
}

export interface AnalyticsState<T> {
  data: T;
  loading: boolean;
  error: Error | null;
  lastUpdated: Date | null;
}

// Hook for trends analytics
export function useTrends(
  type: 'weekly' | 'monthly' | 'yearly' | 'timeOfDay' | 'dayOfWeek',
  filters: AnalyticsFilters = {},
  options: UseAnalyticsOptions = {}
) {
  const [state, setState] = useState<AnalyticsState<any[]>>({
    data: [],
    loading: true,
    error: null,
    lastUpdated: null
  });

  // Memoize filters to prevent unnecessary re-renders
  const memoizedFilters = useMemo(() => filters, [JSON.stringify(filters)]);
  const memoizedOptions = useMemo(() => options, [JSON.stringify(options)]);

  const fetchData = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      const data = await analyticsService.getTrends(type, memoizedFilters);
      setState({
        data,
        loading: false,
        error: null,
        lastUpdated: new Date()
      });
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error('Failed to fetch trends data');
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorObj,
        lastUpdated: new Date()
      }));
      memoizedOptions.onError?.(errorObj);
    }
  }, [type, memoizedFilters, memoizedOptions]);

  const refresh = useCallback(() => {
    return fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-refresh functionality
  useEffect(() => {
    if (!memoizedOptions.autoRefresh || !memoizedOptions.refreshInterval) return;

    const interval = setInterval(fetchData, memoizedOptions.refreshInterval);
    return () => clearInterval(interval);
  }, [fetchData, memoizedOptions.autoRefresh, memoizedOptions.refreshInterval]);

  return {
    ...state,
    refresh,
    clearCache: () => analyticsService.clearCache()
  };
}

// Hook for comparisons analytics
export function useComparisons(
  type: 'department' | 'course' | 'yearLevel' | 'section',
  filters: AnalyticsFilters = {},
  options: UseAnalyticsOptions = {}
) {
  const [state, setState] = useState<AnalyticsState<any[]>>({
    data: [],
    loading: true,
    error: null,
    lastUpdated: null
  });

  // Memoize filters to prevent unnecessary re-renders
  const memoizedFilters = useMemo(() => filters, [JSON.stringify(filters)]);
  const memoizedOptions = useMemo(() => options, [JSON.stringify(options)]);

  const fetchData = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      const data = await analyticsService.getComparisons(type, memoizedFilters);
      setState({
        data,
        loading: false,
        error: null,
        lastUpdated: new Date()
      });
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error('Failed to fetch comparisons data');
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorObj,
        lastUpdated: new Date()
      }));
      memoizedOptions.onError?.(errorObj);
    }
  }, [type, memoizedFilters, memoizedOptions]);

  const refresh = useCallback(() => {
    return fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!memoizedOptions.autoRefresh || !memoizedOptions.refreshInterval) return;

    const interval = setInterval(fetchData, memoizedOptions.refreshInterval);
    return () => clearInterval(interval);
  }, [fetchData, memoizedOptions.autoRefresh, memoizedOptions.refreshInterval]);

  return {
    ...state,
    refresh,
    clearCache: () => analyticsService.clearCache()
  };
}

// Hook for breakdown analytics
export function useBreakdown(
  type: 'attendance' | 'riskLevel',
  filters: AnalyticsFilters = {},
  options: UseAnalyticsOptions = {}
) {
  const [state, setState] = useState<AnalyticsState<any[]>>({
    data: [],
    loading: true,
    error: null,
    lastUpdated: null
  });

  // Memoize filters to prevent unnecessary re-renders
  const memoizedFilters = useMemo(() => filters, [JSON.stringify(filters)]);
  const memoizedOptions = useMemo(() => options, [JSON.stringify(options)]);

  const fetchData = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      const data = await analyticsService.getBreakdown(type, memoizedFilters);
      setState({
        data,
        loading: false,
        error: null,
        lastUpdated: new Date()
      });
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error('Failed to fetch breakdown data');
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorObj,
        lastUpdated: new Date()
      }));
      memoizedOptions.onError?.(errorObj);
    }
  }, [type, memoizedFilters, memoizedOptions]);

  const refresh = useCallback(() => {
    return fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!memoizedOptions.autoRefresh || !memoizedOptions.refreshInterval) return;

    const interval = setInterval(fetchData, memoizedOptions.refreshInterval);
    return () => clearInterval(interval);
  }, [fetchData, memoizedOptions.autoRefresh, memoizedOptions.refreshInterval]);

  return {
    ...state,
    refresh,
    clearCache: () => analyticsService.clearCache()
  };
}

// Hook for rankings analytics
export function useRankings(
  type: 'performance' | 'goalAchievement' | 'statistical',
  filters: AnalyticsFilters = {},
  options: UseAnalyticsOptions = {}
) {
  const [state, setState] = useState<AnalyticsState<any[]>>({
    data: [],
    loading: true,
    error: null,
    lastUpdated: null
  });

  // Memoize filters to prevent unnecessary re-renders
  const memoizedFilters = useMemo(() => filters, [JSON.stringify(filters)]);
  const memoizedOptions = useMemo(() => options, [JSON.stringify(options)]);

  const fetchData = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      const data = await analyticsService.getRankings(type, memoizedFilters);
      setState({
        data,
        loading: false,
        error: null,
        lastUpdated: new Date()
      });
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error('Failed to fetch rankings data');
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorObj,
        lastUpdated: new Date()
      }));
      memoizedOptions.onError?.(errorObj);
    }
  }, [type, memoizedFilters, memoizedOptions]);

  const refresh = useCallback(() => {
    return fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!memoizedOptions.autoRefresh || !memoizedOptions.refreshInterval) return;

    const interval = setInterval(fetchData, memoizedOptions.refreshInterval);
    return () => clearInterval(interval);
  }, [fetchData, memoizedOptions.autoRefresh, memoizedOptions.refreshInterval]);

  return {
    ...state,
    refresh,
    clearCache: () => analyticsService.clearCache()
  };
}

// Hook for subject analytics
export function useSubjectAnalytics(
  type: 'performance' | 'trends' | 'timeAnalysis' | 'comparison' | 'riskAnalysis' | 'patterns',
  filters: AnalyticsFilters = {},
  options: UseAnalyticsOptions = {}
) {
  const [state, setState] = useState<AnalyticsState<any[]>>({
    data: [],
    loading: true,
    error: null,
    lastUpdated: null
  });

  // Memoize filters to prevent unnecessary re-renders
  const memoizedFilters = useMemo(() => filters, [JSON.stringify(filters)]);
  const memoizedOptions = useMemo(() => options, [JSON.stringify(options)]);

  const fetchData = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      const data = await analyticsService.getSubjectAnalytics(type, memoizedFilters);
      setState({
        data,
        loading: false,
        error: null,
        lastUpdated: new Date()
      });
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error('Failed to fetch subject analytics data');
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorObj,
        lastUpdated: new Date()
      }));
      memoizedOptions.onError?.(errorObj);
    }
  }, [type, memoizedFilters, memoizedOptions]);

  const refresh = useCallback(() => {
    return fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!memoizedOptions.autoRefresh || !memoizedOptions.refreshInterval) return;

    const interval = setInterval(fetchData, memoizedOptions.refreshInterval);
    return () => clearInterval(interval);
  }, [fetchData, memoizedOptions.autoRefresh, memoizedOptions.refreshInterval]);

  return {
    ...state,
    refresh,
    clearCache: () => analyticsService.clearCache()
  };
}

// Hook for real-time stats
export function useRealTimeStats(
  filters: AnalyticsFilters = {},
  options: UseAnalyticsOptions = {}
) {
  const [state, setState] = useState<AnalyticsState<any>>({
    data: {
      totalStudents: 0,
      presentToday: 0,
      absentToday: 0,
      lateToday: 0,
      attendanceRate: 0
    },
    loading: true,
    error: null,
    lastUpdated: null
  });

  // Memoize filters to prevent unnecessary re-renders
  const memoizedFilters = useMemo(() => filters, [JSON.stringify(filters)]);
  const memoizedOptions = useMemo(() => options, [JSON.stringify(options)]);

  const fetchData = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      const data = await analyticsService.getRealTimeStats(memoizedFilters);
      setState({
        data,
        loading: false,
        error: null,
        lastUpdated: new Date()
      });
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error('Failed to fetch real-time stats');
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorObj,
        lastUpdated: new Date()
      }));
      memoizedOptions.onError?.(errorObj);
    }
  }, [memoizedFilters, memoizedOptions]);

  const refresh = useCallback(() => {
    return fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-refresh for real-time stats (default to 30 seconds)
  useEffect(() => {
    const interval = setInterval(fetchData, memoizedOptions.refreshInterval || 30000);
    return () => clearInterval(interval);
  }, [fetchData, memoizedOptions.refreshInterval]);

  return {
    ...state,
    refresh,
    clearCache: () => analyticsService.clearCache()
  };
}

// Utility hook for cache management
export function useAnalyticsCache() {
  const clearCache = useCallback(() => {
    analyticsService.clearCache();
  }, []);

  const getCacheStats = useCallback(() => {
    return analyticsService.getCacheStats();
  }, []);

  return {
    clearCache,
    getCacheStats
  };
} 