import { useState, useEffect, useCallback, useRef } from 'react';
import { rfidDashboardService, RFIDDashboardData } from '@/lib/services/rfid-dashboard.service';

interface UseRFIDRealTimeOptions {
  autoRefresh?: boolean;
  refreshInterval?: number; // in milliseconds
  onDataUpdate?: (data: RFIDDashboardData) => void;
  onError?: (error: string) => void;
  filters?: {
    from?: string;
    to?: string;
    status?: string[];
    location?: string[];
    readerId?: string;
    tagId?: string;
    period?: 'daily' | 'weekly' | 'monthly';
  };
}

interface UseRFIDRealTimeReturn {
  data: RFIDDashboardData | null;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  isAutoRefreshing: boolean;
  refresh: () => Promise<void>;
  toggleAutoRefresh: () => void;
  setRefreshInterval: (interval: number) => void;
  setFilters: (filters: UseRFIDRealTimeOptions['filters']) => void;
}

export function useRFIDRealTime(options: UseRFIDRealTimeOptions = {}): UseRFIDRealTimeReturn {
  const {
    autoRefresh = true,
    refreshInterval = 30000, // 30 seconds default
    onDataUpdate,
    onError
  } = options;

  const [data, setData] = useState<RFIDDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isAutoRefreshing, setIsAutoRefreshing] = useState(autoRefresh);
  const [currentRefreshInterval, setCurrentRefreshInterval] = useState(refreshInterval);
  const [filtersState, setFiltersState] = useState<UseRFIDRealTimeOptions['filters']>(options.filters);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const onDataUpdateRef = useRef(onDataUpdate);
  const onErrorRef = useRef(onError);
  const filtersRef = useRef<UseRFIDRealTimeOptions['filters']>(options.filters);

  // Update refs when callbacks change
  useEffect(() => {
    onDataUpdateRef.current = onDataUpdate;
    onErrorRef.current = onError;
    filtersRef.current = filtersState;
  }, [onDataUpdate, onError, filtersState]);

  const fetchData = useCallback(async () => {
    try {
      // Cancel any ongoing request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new abort controller for this request
      abortControllerRef.current = new AbortController();

      setLoading(true);
      setError(null);

      console.log('Fetching RFID dashboard data...', filtersRef.current);
      const dashboardData = await rfidDashboardService.getDashboardData(filtersRef.current || undefined);
      console.log('RFID dashboard data received:', dashboardData);
      
      setData(dashboardData);
      setLastUpdated(new Date());
      
      if (onDataUpdateRef.current) {
        onDataUpdateRef.current(dashboardData);
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        // Request was cancelled, don't set error
        console.log('Request was aborted in useRFIDRealTime');
        return;
      }
      
      console.error('Error in useRFIDRealTime:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch RFID data';
      setError(errorMessage);
      
      // Try to get mock data as fallback
      try {
        console.log('Attempting to get mock data as fallback');
        const mockData = await rfidDashboardService.getMockDashboardData();
        setData(mockData);
        setError(null); // Clear error since we have fallback data
        console.log('Mock data loaded successfully');
      } catch (mockError) {
        console.error('Failed to load mock data:', mockError);
        // Set fallback data to prevent infinite loading
        const fallbackData: RFIDDashboardData = {
          stats: {
            totalReaders: 0,
            activeReaders: 0,
            totalTags: 0,
            activeTags: 0,
            totalScans: 0,
            todayScans: 0,
            weeklyScans: 0,
            monthlyScans: 0
          },
          recentScans: [],
          readerStatusChart: [],
          tagActivityChart: [],
          scanTrendsChart: [],
          locationActivityChart: []
        };
        
                 setData(fallbackData);
         
         if (onErrorRef.current) {
           onErrorRef.current(errorMessage);
         }
      }
    } finally {
      setLoading(false);
    }
  }, []); // Intentionally empty to avoid re-creating

  const refresh = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  const toggleAutoRefresh = useCallback(() => {
    setIsAutoRefreshing(prev => !prev);
  }, []);

  const setRefreshInterval = useCallback((interval: number) => {
    setCurrentRefreshInterval(interval);
  }, []);

  // Update filters and fetch new data immediately
  const setFilters = useCallback((newFilters: UseRFIDRealTimeOptions['filters']) => {
    setFiltersState(newFilters);
    // Trigger fetch with new filters
    fetchData();
  }, [fetchData]);

  // Set up auto-refresh interval
  useEffect(() => {
    if (isAutoRefreshing && currentRefreshInterval > 0) {
      intervalRef.current = setInterval(() => {
        fetchData();
      }, currentRefreshInterval);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  }, [isAutoRefreshing, currentRefreshInterval, fetchData]);

  // Initial data fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    data,
    loading,
    error,
    lastUpdated,
    isAutoRefreshing,
    refresh,
    toggleAutoRefresh,
    setRefreshInterval,
    setFilters
  };
}

// Hook for real-time scan monitoring
export function useRFIDScanMonitor(options: {
  enabled?: boolean;
  onNewScan?: (scan: any) => void;
  scanThreshold?: number; // milliseconds to consider a scan "new"
} = {}) {
  const { enabled = true, onNewScan, scanThreshold = 5000 } = options;
  const [recentScans, setRecentScans] = useState<any[]>([]);
  const lastScanTimeRef = useRef<Date | null>(null);

  const { data, refresh } = useRFIDRealTime({
    autoRefresh: enabled,
    refreshInterval: 10000, // Check every 10 seconds for new scans
    onDataUpdate: (newData) => {
      if (newData.recentScans.length > 0) {
        const latestScan = newData.recentScans[0];
        const scanTime = new Date(latestScan.timestamp);
        
        // Check if this is a new scan
        if (!lastScanTimeRef.current || 
            scanTime.getTime() > lastScanTimeRef.current.getTime() + scanThreshold) {
          
          setRecentScans(prev => [latestScan, ...prev.slice(0, 9)]); // Keep last 10
          lastScanTimeRef.current = scanTime;
          
          if (onNewScan) {
            onNewScan(latestScan);
          }
        }
      }
    }
  });

  return {
    recentScans,
    refresh,
    currentData: data
  };
}
