'use client';

import { useEffect, useState } from 'react';
import type { WellnessLog } from '@/lib/types';
import { ActivityLogger } from '@/components/dashboard/activity-logger';
import { MoodHistoryChart } from '@/components/dashboard/mood-history-chart';
import { Skeleton } from '@/components/ui/skeleton';
import { useUser, useAuth, useFirestore } from '@/firebase';
import { useRouter } from 'next/navigation';
import { getMoodLogs } from '@/firebase/user-actions';

export default function DashboardPage() {
  const [logs, setLogs] = useState<WellnessLog[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [isLoadingLogs, setIsLoadingLogs] = useState(true);

  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const router = useRouter();
  const firestore = useFirestore();

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

  // Load logs from Firestore when user is authenticated
  useEffect(() => {
    const loadLogs = async () => {
      if (!user || !firestore) {
        setIsLoadingLogs(false);
        return;
      }

      try {
        setIsLoadingLogs(true);
        const fetchedLogs = await getMoodLogs(firestore, user.uid, undefined, undefined, 60);
        
        // Transform Firestore logs to match WellnessLog interface
        const transformedLogs: WellnessLog[] = fetchedLogs.map((log: any) => ({
          date: log.date,
          mood: log.mood,
          activities: log.activities || [],
        }));
        
        setLogs(transformedLogs);
      } catch (error) {
        console.error('Error loading logs from Firestore:', error);
      } finally {
        setIsLoadingLogs(false);
      }
    };

    if (isClient && user) {
      loadLogs();
    }
  }, [user, firestore, isClient]);

  // Show a loading state while Firebase is authenticating or the client is hydrating
  if (!isClient || isUserLoading || isLoadingLogs) {
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
