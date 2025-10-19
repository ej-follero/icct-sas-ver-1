"use client";

import { useEffect, useState } from 'react';

export function useUnreadNotifications(pollMs: number = 30000) {
  const [count, setCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchCount() {
    try {
      setError(null);
      const res = await fetch('/api/notifications/unread-count', { credentials: 'include' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setCount(Number(data?.count || 0));
    } catch (e: any) {
      setError(e?.message || 'Failed');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchCount();
    const id = setInterval(fetchCount, Math.max(5000, pollMs));
    return () => clearInterval(id);
  }, [pollMs]);

  return { count, loading, error, refresh: fetchCount };
}


