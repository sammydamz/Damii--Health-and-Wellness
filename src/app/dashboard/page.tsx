'use client';

import { useEffect, useState } from 'react';
import useLocalStorage from '@/hooks/use-local-storage';
import type { WellnessLog } from '@/lib/types';
import { ActivityLogger } from '@/components/dashboard/activity-logger';
import { MoodHistoryChart } from '@/components/dashboard/mood-history-chart';
import { Skeleton } from '@/components/ui/skeleton';
import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const [logs, setLogs] = useLocalStorage<WellnessLog[]>('wellness-logs', []);
  const [isClient, setIsClient] = useState(false);

  const { user, isUserLoading } = useUser();
  const router = useRouter();

  // Ensure client hydration is complete before doing anything
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Redirect unauthenticated users
  useEffect(() => {
    // Only redirect if hydration is complete, auth is not loading, and there's no user
    if (isClient && !isUserLoading && !user) {
      router.replace('/login');
    }
  }, [user, isUserLoading, isClient, router]);

  // Show a loading state while Firebase is authenticating or the client is hydrating
  if (!isClient || isUserLoading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  // If there's no user, we are in the process of redirecting, so don't render the dashboard.
  if (!user) {
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
