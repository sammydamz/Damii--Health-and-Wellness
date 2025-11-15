import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { BrainCircuit, HeartPulse } from 'lucide-react';
import type { WellnessSupportOutput } from '@/ai/flows/analyze-wellness-input-and-provide-support';

interface SupportDisplayProps {
  data: WellnessSupportOutput;
}

export function SupportDisplay({ data }: SupportDisplayProps) {
  return (
    <div className="w-full space-y-6 animate-in fade-in-50 duration-500">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 font-headline text-xl">
            <HeartPulse className="text-primary" />
            Emotional Support
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-wrap leading-relaxed text-muted-foreground">
            {data.emotionalSupport}
          </p>
        </CardContent>
      </Card>
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 font-headline text-xl">
            <BrainCircuit className="text-primary" />
            Wellness Tips
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-wrap leading-relaxed text-muted-foreground">
            {data.wellnessTips}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
