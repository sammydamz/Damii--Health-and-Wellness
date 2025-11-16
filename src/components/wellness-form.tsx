'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { analyzeWellnessInputAndGeneratePlan } from '@/app/actions';
import type { WellnessPlanOutput } from '@/app/schemas/wellness-plan';
import { BeatLoader } from 'react-spinners';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { ConsentModal } from '@/components/modals/consent-modal';
import { SavePlanModal } from '@/components/modals/save-plan-modal';
import { WellnessPlanView } from '@/components/wellness/plan-view';
import { useFirebase } from '@/firebase/provider';
import { saveWellnessPlan } from '@/firebase/user-actions';
import { useToast } from '@/hooks/use-toast';

const formSchema = z.object({
  userInput: z.string().min(10, {
    message: 'Please describe how you are feeling in at least 10 characters.',
  }),
});

export function WellnessForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<WellnessPlanOutput | null>(null);
  const [showConsent, setShowConsent] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const { user, firestore } = useFirebase();
  const { toast } = useToast();

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
      const response = await analyzeWellnessInputAndGeneratePlan(data.userInput);
      setResult(response);
    } catch (error) {
      console.error('Error analyzing wellness input:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate wellness plan. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSavePlan = () => {
    if (!user) {
      setShowConsent(true);
    } else {
      setShowSaveModal(true);
    }
  };

  const handleConsent = async () => {
    setShowConsent(false);
    // After consent, show save modal
    setShowSaveModal(true);
  };

  const handleSaveWithName = async (customName: string) => {
    if (!user || !result) return;

    try {
      // Update the plan title with custom name if provided
      const planToSave = {
        ...result,
        personalizedPlan: {
          ...result.personalizedPlan,
          title: customName,
        },
      };
      
      await saveWellnessPlan(firestore, user.uid, planToSave);
      toast({
        title: 'Plan saved!',
        description: 'Your wellness plan has been saved to your account.',
      });
    } catch (error) {
      console.error('Error saving plan:', error);
      toast({
        title: 'Error',
        description: 'Failed to save plan. Please try again.',
        variant: 'destructive',
      });
      throw error; // Re-throw to keep modal open on error
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Wellness Check-in</CardTitle>
          <CardDescription>
            Tell us how you're feeling, and we'll create a personalized wellness plan for you.
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

              {result.safetyFlag ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="space-y-2">
                    <p className="font-semibold">{result.emotionalSupport}</p>
                    <p>{result.wellnessTips}</p>
                    {result.safetyMessage && (
                      <p className="text-sm mt-2">{result.safetyMessage}</p>
                    )}
                  </AlertDescription>
                </Alert>
              ) : (
                <>
                  <div>
                    <h3 className="font-headline text-xl font-semibold mb-2">Emotional Support</h3>
                    <p className="text-muted-foreground whitespace-pre-wrap">{result.emotionalSupport}</p>
                  </div>

                  <WellnessPlanView 
                    plan={result.personalizedPlan} 
                    fullResult={result}
                    onSave={handleSavePlan} 
                  />

                  <div>
                    <h3 className="font-headline text-xl font-semibold mb-2">Additional Wellness Tips</h3>
                    <p className="text-muted-foreground whitespace-pre-wrap">{result.wellnessTips}</p>
                  </div>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <ConsentModal open={showConsent} onOpenChange={setShowConsent} onConsent={handleConsent} />
      <SavePlanModal 
        open={showSaveModal} 
        onOpenChange={setShowSaveModal}
        suggestedName={result?.personalizedPlan?.title || 'My Wellness Plan'}
        onSave={handleSaveWithName}
      />
    </>
  );
}

