import React, { useEffect, useState } from 'react';
import { AttendanceAnalytics } from '@/components/AttendanceAnalytics';

// Student-specific defaults and light theming can be centralized here later
// For now, we enforce student type and surface a stable API for the page

type AttendanceAnalyticsProps = React.ComponentProps<typeof AttendanceAnalytics>;

export function StudentAttendanceAnalytics(
  props: Omit<AttendanceAnalyticsProps, 'type'> & { type?: 'student' }
) {
  const { data: incomingData, loading: incomingLoading, ...rest } = props as any;

  const [students, setStudents] = useState<any[]>(Array.isArray(incomingData) ? incomingData : []);
  const [loading, setLoading] = useState<boolean>(!!incomingLoading);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // If parent passes data, use it; otherwise fetch from DB
    if (Array.isArray(incomingData)) {
      setStudents(incomingData);
      return;
    }

    let cancelled = false;
    const fetchStudents = async () => {
      try {
        setLoading(true);
        setError(null);
        const params = new URLSearchParams({ page: '1', pageSize: '100' });
        const res = await fetch(`/api/attendance/students?${params.toString()}`);
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err?.error || `Failed to load students (HTTP ${res.status})`);
        }
        const json = await res.json();
        if (!cancelled) setStudents(Array.isArray(json) ? json : []);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Failed to load students');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchStudents();
    return () => { cancelled = true; };
  }, [incomingData]);

  return (
    <AttendanceAnalytics
      {...rest}
      data={students}
      loading={loading}
      type="student"
    />
  );
}

export default StudentAttendanceAnalytics;


