'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  analyzeWellnessInputAndProvideSupport,
  type WellnessSupportOutput,
} from '@/ai/flows/analyze-wellness-input-and-provide-support';
import { BeatLoader } from 'react-spinners';
import { Separator } from '@/components/ui/separator';

const formSchema = z.object({
  userInput: z.string().min(10, {
    message: 'Please describe how you are feeling in at least 10 characters.',
  }),
});

export function WellnessForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<WellnessSupportOutput | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      userInput: '',
    },
  });

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    setResult(null);
    try {
      const response = await analyzeWellnessInputAndProvideSupport({ userInput: data.userInput });
      setResult(response);
    } catch (error) {
      console.error('Error analyzing wellness input:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Wellness Check-in</CardTitle>
        <CardDescription>
          Tell us how you&apos;re feeling, and we&apos;ll provide some support and tips.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Controller
              name="userInput"
              control={control}
              render={({ field }) => (
                <Textarea
                  {...field}
                  placeholder="e.g., I have low energy and feel anxious about my upcoming presentation..."
                  className="min-h-[120px]"
                />
              )}
            />
            {errors.userInput && (
              <p className="text-sm font-medium text-destructive">
                {errors.userInput.message}
              </p>
            )}
          </div>
          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? <BeatLoader size={8} color="white" /> : 'Get My Personalized Plan'}
          </Button>
        </form>

        {result && (
          <div className="mt-8 space-y-6">
            <Separator />
            <div>
              <h3 className="font-headline text-xl font-semibold">Emotional Support</h3>
              <p className="mt-2 text-muted-foreground whitespace-pre-wrap">{result.emotionalSupport}</p>
            </div>
            <div>
              <h3 className="font-headline text-xl font-semibold">Personalized Wellness Tips</h3>
              <p className="mt-2 text-muted-foreground whitespace-pre-wrap">{result.wellnessTips}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
