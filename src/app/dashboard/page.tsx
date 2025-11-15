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

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.replace('/login');
    }
  }, [user, isUserLoading, router]);

  if (isUserLoading || !user || !isClient) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <ActivityLogger logs={logs} setLogs={setLogs} />
      <MoodHistoryChart logs={logs} />
    </div>
  );
}
