'use client';

import { useState } from 'react';
import type { WellnessSupportOutput } from '@/ai/flows/analyze-wellness-input-and-provide-support';
import { SupportDisplay } from '@/components/wellness-assistant/support-display';
import { WellnessForm } from '@/components/wellness-assistant/wellness-form';
import { Skeleton } from '@/components/ui/skeleton';

export default function Home() {
  const [supportData, setSupportData] = useState<WellnessSupportOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="container mx-auto flex max-w-4xl flex-col items-center gap-8">
      <div className="text-center">
        <h1 className="font-headline text-4xl font-bold tracking-tight lg:text-5xl">
          How are you feeling today?
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
          Describe your current state of mind and body. DAMII is here to offer support and guidance.
        </p>
      </div>

      <WellnessForm
        setIsLoading={setIsLoading}
        setError={setError}
        setSupportData={setSupportData}
      />

      {isLoading && (
        <div className="w-full space-y-6">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      )}

      {error && <p className="text-destructive">An error occurred: {error}</p>}

      {supportData && !isLoading && <SupportDisplay data={supportData} />}
    </div>
  );
}
