'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { analyzeWellnessInputAndProvideSupport } from '@/ai/flows/analyze-wellness-input-and-provide-support';
import type { WellnessSupportOutput } from '@/ai/flows/analyze-wellness-input-and-provide-support';
import { WandSparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const formSchema = z.object({
  userInput: z.string().min(10, {
    message: 'Please describe how you feel in at least 10 characters.',
  }),
});

interface WellnessFormProps {
  setIsLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  setSupportData: (data: WellnessSupportOutput | null) => void;
}

export function WellnessForm({
  setIsLoading,
  setError,
  setSupportData,
}: WellnessFormProps) {
  const { toast } = useToast();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      userInput: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setError(null);
    setSupportData(null);
    try {
      const result = await analyzeWellnessInputAndProvideSupport(values);
      setSupportData(result);
    } catch (e) {
      const errorMessage =
        e instanceof Error ? e.message : 'An unknown error occurred.';
      setError(errorMessage);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="w-full space-y-6"
      >
        <FormField
          control={form.control}
          name="userInput"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Textarea
                  placeholder="e.g., I have low energy, feel anxious, and haven't been sleeping well..."
                  className="min-h-[120px] resize-none text-base"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          type="submit"
          size="lg"
          className="w-full md:w-auto"
          disabled={form.formState.isSubmitting}
        >
          <WandSparkles className="mr-2 h-4 w-4" />
          Get Support
        </Button>
      </form>
    </Form>
  );
}
