import { useState, useEffect, useCallback, useMemo } from 'react';
import { StudentAttendance } from '@/types/student-attendance';

interface UseStudentDataOptions {
  initialFilters?: Record<string, string[]>;
  pageSize?: number;
  enableCaching?: boolean;
  cacheTimeout?: number;
}

interface UseStudentDataReturn {
  students: StudentAttendance[];
  filteredStudents: StudentAttendance[];
  loading: boolean;
  error: string | null;
  totalCount: number;
  page: number;
  totalPages: number;
  filters: Record<string, string[]>;
  searchQuery: string;
  sortBy: string;
  setSearchQuery: (query: string) => void;
  setFilters: (filters: Record<string, string[]>) => void;
  setSortBy: (sortBy: string) => void;
  setPage: (page: number) => void;
  refresh: () => void;
  clearFilters: () => void;
}

export function useStudentData(options: UseStudentDataOptions = {}): UseStudentDataReturn {
  const {
    initialFilters = {},
    pageSize = 25,
    enableCaching = true,
    cacheTimeout = 5 * 60 * 1000 // 5 minutes
  } = options;

  // State
  const [students, setStudents] = useState<StudentAttendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<Record<string, string[]>>(initialFilters);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('attendance-desc');
  const [lastFetch, setLastFetch] = useState<number>(0);

  // Cache management
  const cacheKey = useMemo(() => {
    const filterString = JSON.stringify(filters);
    return `students_${filterString}_${searchQuery}_${sortBy}`;
  }, [filters, searchQuery, sortBy]);

  // Fetch students data
  const fetchStudents = useCallback(async (forceRefresh = false) => {
    try {
      // Check cache if enabled and not forcing refresh
      if (enableCaching && !forceRefresh) {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          const { data, timestamp } = JSON.parse(cached);
          if (Date.now() - timestamp < cacheTimeout) {
            setStudents(data);
            setLoading(false);
            setError(null);
            return;
          }
        }
      }

      setLoading(true);
      setError(null);

      // Build query parameters
      const params = new URLSearchParams();
      
      // Add filters
      Object.entries(filters).forEach(([key, values]) => {
        if (values.length > 0) {
          params.set(key, values.join(','));
        }
      });

      // Add search query
      if (searchQuery) {
        params.set('search', searchQuery);
      }

      // Add sorting
      if (sortBy) {
        params.set('sortBy', sortBy);
      }

      // Add pagination
      params.set('page', page.toString());
      params.set('pageSize', pageSize.toString());

      // Student attendance API was removed
      throw new Error('Student attendance functionality has been removed');
    } catch (err) {
      console.error('Error fetching students:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch students');
      setStudents([]);
    } finally {
      setLoading(false);
    }
  }, [filters, searchQuery, sortBy, page, pageSize, cacheKey, enableCaching, cacheTimeout]);

  // Filter and sort students
  const filteredStudents = useMemo(() => {
    if (!students || students.length === 0) return [];

    let filtered = [...students];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(student => 
        student.studentName?.toLowerCase().includes(query) ||
        student.studentId?.toLowerCase().includes(query) ||
        student.email?.toLowerCase().includes(query) ||
        student.department?.toLowerCase().includes(query) ||
        student.course?.toLowerCase().includes(query)
      );
    }

    // Apply additional filters
    Object.entries(filters).forEach(([filterType, values]) => {
      if (values.length > 0) {
        filtered = filtered.filter(student => {
          switch (filterType) {
            case 'departments':
              return values.some(dept => student.department?.includes(dept));
            case 'courses':
              return values.includes(student.course || '');
            case 'yearLevels':
              return values.includes(student.yearLevel || '');
            case 'attendanceRates':
              return values.some(rate => {
                if (rate === 'High (≥90%)') return student.attendanceRate >= 90;
                if (rate === 'Medium (75-89%)') return student.attendanceRate >= 75 && student.attendanceRate < 90;
                if (rate === 'Low (<75%)') return student.attendanceRate < 75;
                return false;
              });
            case 'status':
              return values.includes(student.status || '');
            default:
              return true;
          }
        });
      }
    });

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'attendance-desc':
          return b.attendanceRate - a.attendanceRate;
        case 'attendance-asc':
          return a.attendanceRate - b.attendanceRate;
        case 'name':
          return (a.studentName || '').localeCompare(b.studentName || '');
        case 'id':
          return (a.studentId || '').localeCompare(b.studentId || '');
        case 'department':
          return (a.department || '').localeCompare(b.department || '');
        case 'course':
          return (a.course || '').localeCompare(b.course || '');
        case 'yearLevel':
          return (a.yearLevel || '').localeCompare(b.yearLevel || '');
        default:
          return 0;
      }
    });

    return filtered;
  }, [students, searchQuery, filters, sortBy]);

  // Calculate pagination
  const totalCount = filteredStudents.length;
  const totalPages = Math.ceil(totalCount / pageSize);
  const paginatedStudents = filteredStudents.slice((page - 1) * pageSize, page * pageSize);

  // Refresh function
  const refresh = useCallback(() => {
    fetchStudents(true);
  }, [fetchStudents]);

  // Clear filters function
  const clearFilters = useCallback(() => {
    setFilters({});
    setSearchQuery('');
    setPage(1);
  }, []);

  // Effect to fetch data when dependencies change
  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  // Effect to reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [filters, searchQuery, sortBy]);

  // Cleanup cache on unmount
  useEffect(() => {
    return () => {
      // Clean up old cache entries
      if (enableCaching) {
        const now = Date.now();
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('students_')) {
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
      }
    };
  }, [enableCaching, cacheTimeout]);

  return {
    students: paginatedStudents,
    filteredStudents,
    loading,
    error,
    totalCount,
    page,
    totalPages,
    filters,
    searchQuery,
    sortBy,
    setSearchQuery,
    setFilters,
    setSortBy,
    setPage,
    refresh,
    clearFilters
  };
} 