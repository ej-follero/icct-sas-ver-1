'use client';

import { redirect } from 'next/navigation';
import { useEffect } from 'react';
import { useUser } from '@/hooks/useUser';
import { PageSkeleton } from '@/components/reusable/Skeleton';

export default function ChangePasswordPage() {
  const { user, loading } = useUser();

  useEffect(() => {
    if (!loading && !user) {
      redirect('/login');
    }
  }, [user, loading]);

  if (loading) {
    return <PageSkeleton />;
  }

  if (!user) {
    return null;
  }

  // Redirect to the settings profile page with password tab
  redirect('/settings/profile?tab=security');
}
