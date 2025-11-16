'use client';

import { useEffect, useState } from 'react';
import useLocalStorage from '@/hooks/use-local-storage';
import type { WellnessLog } from '@/lib/types';
import { ActivityLogger } from '@/components/dashboard/activity-logger';
import { MoodHistoryChart } from '@/components/dashboard/mood-history-chart';
import { Skeleton } from '@/components/ui/skeleton';
import { useUser, useAuth } from '@/firebase';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const [logs, setLogs] = useLocalStorage<WellnessLog[]>('wellness-logs', []);
  const [isClient, setIsClient] = useState(false);

  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const router = useRouter();

  // Ensure client hydration is complete before doing anything
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Redirect unauthenticated users
  useEffect(() => {
    // Only redirect if hydration is complete, auth is not loading,
    // and neither the context user nor the immediate auth.currentUser exist.
    if (isClient && !isUserLoading && !user && !auth.currentUser) {
      router.replace('/login');
    }
  }, [user, isUserLoading, isClient, router, auth]);

  // Show a loading state while Firebase is authenticating or the client is hydrating
  if (!isClient || isUserLoading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  // If there's no user yet but auth has a currentUser, allow render while context catches up.
  const isAuthenticated = !!(user || auth.currentUser);

  // If there's no user, we are in the process of redirecting or settling auth; don't render.
  if (!isAuthenticated) {
    return null;
  }

  // Render the dashboard for the authenticated user
  return (
    <div className="flex flex-col gap-8">
      <ActivityLogger logs={logs} setLogs={setLogs} />
      <MoodHistoryChart logs={logs} />
    </div>
  );
}
