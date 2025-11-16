'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp, Save } from 'lucide-react';
import type { WellnessPlanOutput, PlanStep } from '@/app/schemas/wellness-plan';

interface PlanViewProps {
  plan: WellnessPlanOutput['personalizedPlan'];
  onSave: () => void;
}

const categoryColors: Record<PlanStep['category'], string> = {
  movement: 'bg-blue-500/10 text-blue-700 dark:text-blue-400',
  sleep: 'bg-purple-500/10 text-purple-700 dark:text-purple-400',
  hydration: 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-400',
  nutrition: 'bg-green-500/10 text-green-700 dark:text-green-400',
  social: 'bg-pink-500/10 text-pink-700 dark:text-pink-400',
  breathing: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-400',
  cognitive: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
  other: 'bg-gray-500/10 text-gray-700 dark:text-gray-400',
};

const priorityColors = {
  low: 'bg-green-500/10 text-green-700 dark:text-green-400',
  medium: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400',
  high: 'bg-red-500/10 text-red-700 dark:text-red-400',
};

export function WellnessPlanView({ plan, onSave }: PlanViewProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [checkedSteps, setCheckedSteps] = useState<Set<string>>(new Set());

  const toggleStep = (stepId: string) => {
    setCheckedSteps((prev) => {
      const next = new Set(prev);
      if (next.has(stepId)) {
        next.delete(stepId);
      } else {
        next.add(stepId);
      }
      return next;
    });
  };

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="font-headline text-2xl">{plan.title}</CardTitle>
          <Badge variant="outline" className="capitalize">
            {plan.estimatedEffort} effort
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">{plan.timeframe}</p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h4 className="font-semibold mb-2">Overview</h4>
          <p className="text-muted-foreground text-sm">{plan.overview}</p>
        </div>

        {plan.summaryBullets && plan.summaryBullets.length > 0 && (
          <div>
            <h4 className="font-semibold mb-2">Key Actions</h4>
            <ul className="space-y-1 list-disc list-inside text-sm text-muted-foreground">
              {plan.summaryBullets.map((bullet, idx) => (
                <li key={idx}>{bullet}</li>
              ))}
            </ul>
          </div>
        )}

        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between">
              <span className="font-semibold">Action Steps ({plan.steps.length})</span>
              {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-3 mt-3">
            {plan.steps.map((step) => (
              <div
                key={step.id}
                className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/5 transition-colors"
              >
                <Checkbox
                  id={step.id}
                  checked={checkedSteps.has(step.id)}
                  onCheckedChange={() => toggleStep(step.id)}
                  className="mt-1"
                />
                <div className="flex-1 space-y-2">
                  <label
                    htmlFor={step.id}
                    className={`text-sm font-medium leading-none cursor-pointer ${
                      checkedSteps.has(step.id) ? 'line-through text-muted-foreground' : ''
                    }`}
                  >
                    {step.text}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" className={categoryColors[step.category]}>
                      {step.category}
                    </Badge>
                    {step.priority && (
                      <Badge variant="secondary" className={priorityColors[step.priority]}>
                        {step.priority}
                      </Badge>
                    )}
                    {step.durationMinutes && (
                      <Badge variant="outline" className="text-xs">
                        {step.durationMinutes} min
                      </Badge>
                    )}
                    {step.frequency && (
                      <Badge variant="outline" className="text-xs">
                        {step.frequency}
                      </Badge>
                    )}
                    {step.when && (
                      <Badge variant="outline" className="text-xs">
                        {step.when}
                      </Badge>
                    )}
                  </div>
                  {step.safety && (
                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                      ⚠️ {step.safety}
                    </p>
                  )}
                  {step.followUpQuestion && (
                    <p className="text-xs text-muted-foreground italic mt-1">
                      💭 {step.followUpQuestion}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </CollapsibleContent>
        </Collapsible>

        <Button onClick={onSave} className="w-full" size="lg">
          <Save className="h-4 w-4 mr-2" />
          Save This Plan
        </Button>
      </CardContent>
    </Card>
  );
}
