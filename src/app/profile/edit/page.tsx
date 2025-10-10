'use client';

import { redirect } from 'next/navigation';
import { useEffect } from 'react';
import { useUser } from '@/hooks/useUser';
import { PageSkeleton } from '@/components/reusable/Skeleton';

export default function EditProfilePage() {
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

  // Redirect to the settings profile page with edit mode
  redirect('/settings/profile?edit=true');
}
