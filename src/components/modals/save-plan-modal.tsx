'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface SavePlanModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  suggestedName: string;
  onSave: (customName: string) => Promise<void>;
}

export function SavePlanModal({ open, onOpenChange, suggestedName, onSave }: SavePlanModalProps) {
  const [planName, setPlanName] = useState(suggestedName);
  const [isSaving, setIsSaving] = useState(false);

  // Update plan name when suggested name changes
  useEffect(() => {
    setPlanName(suggestedName);
  }, [suggestedName]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(planName.trim() || suggestedName);
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving plan:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Save Your Wellness Plan</DialogTitle>
          <DialogDescription>
            Give your plan a custom name or use the AI-suggested name below.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="plan-name">Plan Name</Label>
            <Input
              id="plan-name"
              value={planName}
              onChange={(e) => setPlanName(e.target.value)}
              placeholder="Enter a custom name for your plan"
              disabled={isSaving}
            />
            <p className="text-xs text-muted-foreground">
              AI suggested: {suggestedName}
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Plan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
