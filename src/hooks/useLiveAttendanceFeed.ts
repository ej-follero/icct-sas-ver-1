import { useState, useEffect, useCallback } from 'react';

interface AttendanceRecord {
  attendanceId: number;
  status: string;
  timestamp: string;
  student: {
    studentId: number;
    studentIdNum: string;
    firstName: string;
    lastName: string;
    rfidTag: string;
    Department: {
      departmentName: string;
      departmentCode: string;
    };
    CourseOffering: {
      courseCode: string;
      courseName: string;
    };
  };
  subjectSchedule?: {
    subject: {
      subjectCode: string;
      subjectName: string;
    };
    section: {
      sectionName: string;
    };
    instructor: {
      firstName: string;
      lastName: string;
    };
    room: {
      roomNo: string;
    };
  };
  rfidLog?: {
    location: string;
  };
}

interface LiveFeedData {
  records: AttendanceRecord[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
  statistics: {
    totalRecords: number;
    statusCounts: Record<string, number>;
  };
  recentActivity: any[];
}

interface UseLiveAttendanceFeedOptions {
  studentId?: string;
  subjectId?: string;
  limit?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export function useLiveAttendanceFeed(options: UseLiveAttendanceFeedOptions = {}) {
  const {
    studentId,
    subjectId,
    limit = '50',
    autoRefresh = true,
    refreshInterval = 30000 // 30 seconds
  } = options;

  const [data, setData] = useState<LiveFeedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [streamConnected, setStreamConnected] = useState(false);

  // Fetch data from API
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (studentId) params.append('studentId', studentId);
      if (subjectId) params.append('subjectId', subjectId);
      params.append('limit', limit);
      
      const response = await fetch(`/api/attendance/live-feed?${params}`);
      const result = await response.json();
      
      if (result.success) {
        setData(result.data);
        setError(null);
      } else {
        setError(result.error || 'Failed to fetch data');
      }
    } catch (err) {
      setError('Network error');
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [studentId, subjectId, limit]);

  // Set up real-time stream
  useEffect(() => {
    if (!autoRefresh) return;

    const params = new URLSearchParams();
    if (studentId) params.append('studentId', studentId);
    if (subjectId) params.append('subjectId', subjectId);
    
    const eventSource = new EventSource(`/api/attendance/stream?${params}`);

    eventSource.onopen = () => {
      setStreamConnected(true);
      setIsConnected(true);
    };

    eventSource.onmessage = (event) => {
      try {
        const eventData = JSON.parse(event.data);
        
        if (eventData.type === 'attendance_update' && eventData.records) {
          setData(prevData => {
            if (!prevData) return prevData;
            
            // Merge new records with existing ones, avoiding duplicates
            const existingIds = new Set(prevData.records.map(r => r.attendanceId));
            const newRecords = eventData.records.filter((r: AttendanceRecord) => 
              !existingIds.has(r.attendanceId)
            );
            
            return {
              ...prevData,
              records: [...newRecords, ...prevData.records].slice(0, parseInt(limit))
            };
          });
        }
      } catch (err) {
        console.error('Error parsing stream data:', err);
      }
    };

    eventSource.onerror = () => {
      setStreamConnected(false);
      setIsConnected(false);
    };

    return () => {
      eventSource.close();
    };
  }, [studentId, subjectId, limit, autoRefresh]);

  // Auto-refresh fallback
  useEffect(() => {
    if (!autoRefresh || streamConnected) return;

    const interval = setInterval(() => {
      fetchData();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, streamConnected, fetchData, refreshInterval]);

  // Initial data fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    isConnected,
    streamConnected,
    refetch: fetchData
  };
}
