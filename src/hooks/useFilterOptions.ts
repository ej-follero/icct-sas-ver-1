import { useState, useEffect, useCallback, useMemo } from 'react';

interface FilterOptions {
  departments: string[];
  courses: string[];
  yearLevels: string[];
  sections: string[];
  subjects: string[];
  instructors: string[];
  rooms: string[];
  studentStatuses: string[];
  studentTypes: string[];
  attendanceRates: string[];
  riskLevels: string[];
  [key: string]: string[];
}

interface UseFilterOptionsReturn {
  filterOptions: FilterOptions;
  loading: boolean;
  error: string | null;
  refresh: () => void;
  getFilterCount: (filterType: string, option: string) => number;
}

export function useFilterOptions(): UseFilterOptionsReturn {
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    departments: [],
    courses: [],
    yearLevels: [],
    sections: [],
    subjects: [],
    instructors: [],
    rooms: [],
    studentStatuses: [],
    studentTypes: [],
    attendanceRates: [],
    riskLevels: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<number>(0);

  // Cache key for filter options
  const cacheKey = 'filter_options_cache';
  const cacheTimeout = 10 * 60 * 1000; // 10 minutes

  // Fetch filter options
  const fetchFilterOptions = useCallback(async (forceRefresh = false) => {
    try {
      // Check cache if not forcing refresh
      if (!forceRefresh) {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          const { data, timestamp } = JSON.parse(cached);
          if (Date.now() - timestamp < cacheTimeout) {
            setFilterOptions(data);
            setLoading(false);
            setError(null);
            return;
          }
        }
      }

      setLoading(true);
      setError(null);

      const response = await fetch('/api/attendance/filters');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      // Transform the API data to match our filter structure
      const transformedOptions: FilterOptions = {
        departments: data.departments ? data.departments.map((d: any) => String(d.displayName)) : [],
        courses: data.courses ? data.courses.map((c: any) => String(c.code)) : [],
        yearLevels: data.yearLevels ? data.yearLevels.map(String) : [],
        sections: data.sections ? data.sections.map((s: any) => String(s.name)) : [],
        subjects: data.subjects ? data.subjects.map((s: any) => String(s.code)) : [],
        instructors: data.instructors ? data.instructors.map((i: any) => String(i.displayName)) : [],
        rooms: data.rooms ? data.rooms.map((r: any) => String(r.displayName)) : [],
        studentStatuses: data.studentStatuses ? data.studentStatuses.map(String) : [],
        studentTypes: data.studentTypes ? data.studentTypes.map(String) : [],
        attendanceRates: ['High (≥90%)', 'Medium (75-89%)', 'Low (<75%)'],
        riskLevels: ['HIGH', 'MEDIUM', 'LOW', 'NONE']
      };

      // Cache the data
      localStorage.setItem(cacheKey, JSON.stringify({
        data: transformedOptions,
        timestamp: Date.now()
      }));

      setFilterOptions(transformedOptions);
      setLastFetch(Date.now());
      setError(null);
    } catch (err) {
      console.error('Error fetching filter options:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch filter options');
      
      // Fallback to default options
      setFilterOptions({
        departments: ['CS - Computer Science', 'IT - Information Technology', 'CE - Computer Engineering'],
        courses: ['BSCS', 'BSIT', 'BSCE'],
        yearLevels: ['FIRST_YEAR', 'SECOND_YEAR', 'THIRD_YEAR', 'FOURTH_YEAR'],
        sections: ['A', 'B', 'C', 'D'],
        subjects: ['Programming', 'Database', 'Web Development', 'Networking'],
        instructors: ['John Doe', 'Jane Smith', 'Mike Johnson'],
        rooms: ['Room 101', 'Room 102', 'Room 103'],
        studentStatuses: ['ACTIVE', 'INACTIVE', 'SUSPENDED'],
        studentTypes: ['REGULAR', 'IRREGULAR'],
        attendanceRates: ['High (≥90%)', 'Medium (75-89%)', 'Low (<75%)'],
        riskLevels: ['HIGH', 'MEDIUM', 'LOW', 'NONE']
      });
    } finally {
      setLoading(false);
    }
  }, [cacheKey, cacheTimeout]);

  // Get filter count (simplified - in real app this would be calculated from actual data)
  const getFilterCount = useCallback((filterType: string, option: string) => {
    // This is a placeholder - in a real implementation, this would be calculated
    // from the actual student data or from a separate API endpoint
    return Math.floor(Math.random() * 50) + 1;
  }, []);

  // Refresh function
  const refresh = useCallback(() => {
    fetchFilterOptions(true);
  }, [fetchFilterOptions]);

  // Effect to fetch data on mount
  useEffect(() => {
    fetchFilterOptions();
  }, [fetchFilterOptions]);

  // Cleanup cache on unmount
  useEffect(() => {
    return () => {
      // Clean up old cache entries
      const now = Date.now();
      Object.keys(localStorage).forEach(key => {
        if (key === cacheKey) {
          try {
            const cached = JSON.parse(localStorage.getItem(key) || '');
            if (now - cached.timestamp > cacheTimeout) {
              localStorage.removeItem(key);
            }
          } catch {
            localStorage.removeItem(key);
          }
        }
      });
    };
  }, [cacheKey, cacheTimeout]);

  return {
    filterOptions,
    loading,
    error,
    refresh,
    getFilterCount
  };
} 