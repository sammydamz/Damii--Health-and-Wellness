'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface ConsentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConsent: () => void;
}

export function ConsentModal({ open, onOpenChange, onConsent }: ConsentModalProps) {
  const handleConsent = () => {
    onConsent();
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Save this wellness plan?</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <span className="block">Your personalized wellness plan will be saved to your private account.</span>
            <span className="block text-sm text-muted-foreground">
              📌 Plans remain private and can be deleted anytime from your dashboard.
            </span>
            <span className="block text-sm text-muted-foreground">
              🔒 We don't share your data with third parties.
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>No, don't save</AlertDialogCancel>
          <AlertDialogAction onClick={handleConsent}>Yes, save plan</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
