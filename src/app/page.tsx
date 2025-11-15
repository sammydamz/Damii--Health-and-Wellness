'use client';

import { useState } from 'react';
import { analyzeWellnessInputAndProvideSupport } from '@/ai/flows/analyze-wellness-input-and-provide-support';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { HandInHeart } from '@/components/icons/hand-in-heart';
import { Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';

export default function Home() {
  const [userInput, setUserInput] = useState('');
  const [analysis, setAnalysis] = useState<{
    emotionalSupport: string;
    wellnessTips: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    setAnalysis(null);

    try {
      const result = await analyzeWellnessInputAndProvideSupport({ userInput });
      setAnalysis(result);
    } catch (e) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
            <HandInHeart className="size-16 text-primary mx-auto" />
            <h1 className="mt-4 font-headline text-4xl font-bold tracking-tight lg:text-5xl">
              How are you feeling today?
            </h1>
            <p className="mt-4 max-w-2xl text-lg text-muted-foreground mx-auto">
              Describe your current state of mind and body. DAMII is here to
              offer support and guidance.
            </p>
        </div>

        <Card className="bg-white">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit}>
              <Textarea
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="e.g., I have low energy and have been feeling anxious about work."
                className="mb-4"
                rows={4}
              />
              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isLoading ? 'Analyzing...' : 'Get Support'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {error && (
          <Alert variant="destructive" className="mt-4">
            <Terminal className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {analysis && (
          <Card className="mt-4 bg-white">
            <CardHeader>
              <CardTitle>Your Personalized Support</CardTitle>
              <CardDescription>
                Here are some suggestions that might help.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg mb-2">Emotional Support</h3>
                <p className="text-muted-foreground">{analysis.emotionalSupport}</p>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Wellness Tips</h3>
                <p className="text-muted-foreground">{analysis.wellnessTips}</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
