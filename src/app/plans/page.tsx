'use client';

import { useEffect, useState } from 'react';
import { useFirebase } from '@/firebase/provider';
import { getWellnessPlans } from '@/firebase/user-actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlanCard } from '@/components/wellness/plan-card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, FolderOpen } from 'lucide-react';

export default function SavedPlansPage() {
  const { user, firestore } = useFirebase();
  const [plans, setPlans] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPlans = async () => {
    if (!user) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const userPlans = await getWellnessPlans(firestore, user.uid);
      setPlans(userPlans);
    } catch (err) {
      console.error('Error loading plans:', err);
      setError('Failed to load your wellness plans. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPlans();
  }, [user]);

  const handlePlanDeleted = (planId: string) => {
    setPlans(prev => prev.filter(p => p.id !== planId));
  };

  const handlePlanRenamed = (planId: string, newTitle: string) => {
    setPlans(prev => prev.map(p => 
      p.id === planId 
        ? { ...p, personalizedPlan: { ...p.personalizedPlan, title: newTitle } }
        : p
    ));
  };

  if (isLoading) {
    return (
      <div className="container max-w-6xl mx-auto py-8 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline text-2xl">My Wellness Plans</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container max-w-6xl mx-auto py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container max-w-6xl mx-auto py-8 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-2xl">My Wellness Plans</CardTitle>
          <p className="text-sm text-muted-foreground">
            {plans.length} {plans.length === 1 ? 'plan' : 'plans'} saved
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {plans.length === 0 ? (
            <div className="text-center py-12">
              <FolderOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No saved plans yet</h3>
              <p className="text-sm text-muted-foreground">
                Create a wellness plan from the Wellness Form to get started.
              </p>
            </div>
          ) : (
            plans.map(plan => (
              <PlanCard
                key={plan.id}
                plan={plan}
                onDeleted={handlePlanDeleted}
                onRenamed={handlePlanRenamed}
              />
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
