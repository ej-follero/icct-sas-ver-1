import { useState, useEffect, useCallback } from 'react';

interface StudentAttendance {
  studentId: number;
  studentIdNum: string;
  firstName: string;
  lastName: string;
  email: string;
  rfidTag: string;
  department: string;
  course: string;
  attendanceStatus: string;
  attendanceType: string | null;
  timestamp: string | null;
  verification: string;
  rfidReader: string | null;
  room: string | null;
  location: string | null;
  isLate: boolean;
  isPresent: boolean;
}

interface ClassInfo {
  startTime: string;
  endTime: string;
  day: string;
  isCurrentlyActive: boolean;
  timeRemaining: string;
}

interface CurrentClassData {
  schedule: {
    subjectSchedId: number;
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
      roomBuildingLoc: string;
      roomFloorLoc: string;
    };
  };
  students: StudentAttendance[];
  statistics: {
    totalEnrolled: number;
    present: number;
    late: number;
    absent: number;
    excused: number;
  };
  classInfo: ClassInfo;
}

interface UseCurrentClassOptions {
  subjectSchedId?: number;
  roomId?: number;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export function useCurrentClass(options: UseCurrentClassOptions = {}) {
  const {
    subjectSchedId,
    roomId,
    autoRefresh = true,
    refreshInterval = 30000 // 30 seconds
  } = options;

  const [data, setData] = useState<CurrentClassData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [streamConnected, setStreamConnected] = useState(false);

  // Fetch current class data
  const fetchCurrentClass = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (subjectSchedId) params.append('subjectSchedId', subjectSchedId.toString());
      if (roomId) params.append('roomId', roomId.toString());
      
      const response = await fetch(`/api/attendance/current-class?${params}`);
      const result = await response.json();
      
      if (result.success) {
        setData(result.data);
        setError(null);
      } else {
        setError(result.message || 'No active class found');
        setData(null);
      }
    } catch (err) {
      setError('Network error');
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [subjectSchedId, roomId]);

  // Set up real-time stream
  useEffect(() => {
    if (!data?.schedule || !autoRefresh) return;

    const params = new URLSearchParams();
    if (data.schedule.subjectSchedId) {
      params.append('subjectSchedId', data.schedule.subjectSchedId.toString());
    }
    
    const eventSource = new EventSource(`/api/attendance/stream?${params}`);

    eventSource.onopen = () => {
      setStreamConnected(true);
      setIsConnected(true);
    };

    eventSource.onmessage = (event) => {
      try {
        const eventData = JSON.parse(event.data);
        
        if (eventData.type === 'attendance-update' && eventData.records) {
          setData(prevData => {
            if (!prevData) return prevData;
            
            const updatedStudents = prevData.students.map(student => {
              const updatedRecord = eventData.records.find((r: any) => r.studentId === student.studentId);
              if (updatedRecord) {
                return {
                  ...student,
                  attendanceStatus: updatedRecord.status,
                  timestamp: updatedRecord.timestamp,
                  isPresent: updatedRecord.status === 'PRESENT',
                  isLate: updatedRecord.status === 'LATE',
                  rfidReader: updatedRecord.rfidReader,
                  room: updatedRecord.room,
                  location: updatedRecord.location
                };
              }
              return student;
            });

            // Recalculate statistics
            const newStats = {
              totalEnrolled: updatedStudents.length,
              present: updatedStudents.filter(s => s.isPresent).length,
              late: updatedStudents.filter(s => s.isLate).length,
              absent: updatedStudents.filter(s => s.attendanceStatus === 'ABSENT').length,
              excused: updatedStudents.filter(s => s.attendanceStatus === 'EXCUSED').length
            };

            return {
              ...prevData,
              students: updatedStudents,
              statistics: newStats
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
  }, [data?.schedule, autoRefresh]);

  // Auto-refresh fallback
  useEffect(() => {
    if (!autoRefresh || streamConnected) return;

    const interval = setInterval(() => {
      fetchCurrentClass();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, streamConnected, fetchCurrentClass, refreshInterval]);

  // Initial data fetch
  useEffect(() => {
    fetchCurrentClass();
  }, [fetchCurrentClass]);

  // Manual override function
  const handleManualOverride = useCallback(async (studentId: number, newStatus: string) => {
    if (!data?.schedule) return false;

    try {
      const response = await fetch('/api/attendance/manual-override', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId,
          subjectSchedId: data.schedule.subjectSchedId,
          status: newStatus,
          reason: 'Manual override by instructor',
          notes: `Status changed to ${newStatus}`
        })
      });

      const result = await response.json();
      
      if (result.success) {
        // Refresh data to show updated status
        await fetchCurrentClass();
        return true;
      } else {
        console.error('Manual override failed:', result.error);
        return false;
      }
    } catch (err) {
      console.error('Manual override error:', err);
      return false;
    }
  }, [data?.schedule, fetchCurrentClass]);

  return {
    data,
    loading,
    error,
    isConnected,
    streamConnected,
    refetch: fetchCurrentClass,
    handleManualOverride
  };
}
