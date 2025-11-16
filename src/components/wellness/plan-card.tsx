'use client';

import { useState } from 'react';
import { useFirebase } from '@/firebase/provider';
import { deleteWellnessPlan, updateWellnessPlanTitle } from '@/firebase/user-actions';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { useToast } from '@/hooks/use-toast';
import { MoreVertical, Download, Edit, Trash2, Calendar } from 'lucide-react';
import type { WellnessPlanOutput } from '@/app/schemas/wellness-plan';

interface PlanCardProps {
  plan: any; // Full plan document with createdAt, savedAt, etc.
  onDeleted: (planId: string) => void;
  onRenamed: (planId: string, newTitle: string) => void;
}

export function PlanCard({ plan, onDeleted, onRenamed }: PlanCardProps) {
  const { user, firestore } = useFirebase();
  const { toast } = useToast();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [newTitle, setNewTitle] = useState(plan.personalizedPlan?.title || '');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);

  const handleDelete = async () => {
    if (!user) return;
    
    setIsDeleting(true);
    try {
      await deleteWellnessPlan(firestore, user.uid, plan.id);
      toast({
        title: 'Plan deleted',
        description: 'Your wellness plan has been deleted.',
      });
      onDeleted(plan.id);
    } catch (error) {
      console.error('Error deleting plan:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete plan. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const handleRename = async () => {
    if (!user || !newTitle.trim()) return;
    
    setIsRenaming(true);
    try {
      await updateWellnessPlanTitle(firestore, user.uid, plan.id, newTitle.trim());
      toast({
        title: 'Plan renamed',
        description: 'Your wellness plan has been renamed.',
      });
      onRenamed(plan.id, newTitle.trim());
    } catch (error) {
      console.error('Error renaming plan:', error);
      toast({
        title: 'Error',
        description: 'Failed to rename plan. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsRenaming(false);
      setShowRenameDialog(false);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      // Dynamic import to reduce initial bundle size
      const { jsPDF } = await import('jspdf');
      
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;
      const maxWidth = pageWidth - 2 * margin;
      let yPos = margin;

      // Helper to add text with wrapping
      const addText = (text: string, fontSize: number, isBold: boolean = false) => {
        pdf.setFontSize(fontSize);
        pdf.setFont('helvetica', isBold ? 'bold' : 'normal');
        const lines = pdf.splitTextToSize(text, maxWidth);
        
        lines.forEach((line: string) => {
          if (yPos > pageHeight - margin) {
            pdf.addPage();
            yPos = margin;
          }
          pdf.text(line, margin, yPos);
          yPos += fontSize * 0.5;
        });
        yPos += 5;
      };

      // Title
      addText(`DAMII Wellness Plan`, 20, true);
      addText(plan.personalizedPlan?.title || 'Untitled Plan', 16, true);
      
      // Metadata
      const createdDate = plan.createdAt?.toDate?.() || new Date(plan.savedAt);
      addText(`Created: ${createdDate.toLocaleDateString()}`, 10);
      addText(`Timeframe: ${plan.personalizedPlan?.timeframe || 'N/A'}`, 10);
      addText(`Effort Level: ${plan.personalizedPlan?.estimatedEffort || 'N/A'}`, 10);
      yPos += 5;

      // Emotional Support
      addText('Emotional Support', 14, true);
      addText(plan.emotionalSupport || '', 11);
      yPos += 5;

      // Overview
      if (plan.personalizedPlan?.overview) {
        addText('Overview', 14, true);
        addText(plan.personalizedPlan.overview, 11);
        yPos += 5;
      }

      // Key Actions
      if (plan.personalizedPlan?.summaryBullets?.length > 0) {
        addText('Key Actions', 14, true);
        plan.personalizedPlan.summaryBullets.forEach((bullet: string, idx: number) => {
          addText(`${idx + 1}. ${bullet}`, 11);
        });
        yPos += 5;
      }

      // Action Steps
      if (plan.personalizedPlan?.steps?.length > 0) {
        addText('Action Steps', 14, true);
        plan.personalizedPlan.steps.forEach((step: any, idx: number) => {
          addText(`${idx + 1}. ${step.text}`, 11, true);
          
          const metadata = [];
          if (step.category) metadata.push(`Category: ${step.category}`);
          if (step.priority) metadata.push(`Priority: ${step.priority}`);
          if (step.durationMinutes) metadata.push(`Duration: ${step.durationMinutes} min`);
          if (step.frequency) metadata.push(`Frequency: ${step.frequency}`);
          if (step.when) metadata.push(`When: ${step.when}`);
          
          if (metadata.length > 0) {
            addText(`   ${metadata.join(' • ')}`, 9);
          }
          
          if (step.safety) {
            addText(`   ⚠️ Safety: ${step.safety}`, 9);
          }
          yPos += 3;
        });
      }

      // Wellness Tips
      if (plan.wellnessTips) {
        yPos += 5;
        addText('Additional Wellness Tips', 14, true);
        addText(plan.wellnessTips, 11);
      }

      // Footer
      pdf.setFontSize(8);
      pdf.setTextColor(150);
      pdf.text('Generated by DAMII Wellness Assistant', pageWidth / 2, pageHeight - 10, { align: 'center' });

      // Save with sanitized filename
      const sanitizedTitle = (plan.personalizedPlan?.title || 'wellness-plan')
        .replace(/[^a-z0-9]/gi, '-')
        .toLowerCase()
        .substring(0, 50);
      const dateStr = createdDate.toISOString().split('T')[0];
      pdf.save(`damii-${sanitizedTitle}-${dateStr}.pdf`);

      toast({
        title: 'PDF downloaded',
        description: 'Your wellness plan has been exported as PDF.',
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate PDF. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const createdDate = plan.createdAt?.toDate?.() || new Date(plan.savedAt);

  return (
    <>
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="pt-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-2">
              <h3 className="font-headline text-lg font-semibold">
                {plan.personalizedPlan?.title || 'Untitled Plan'}
              </h3>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {plan.personalizedPlan?.overview || plan.emotionalSupport}
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="capitalize">
                  {plan.personalizedPlan?.estimatedEffort || 'low'} effort
                </Badge>
                <Badge variant="outline">
                  {plan.personalizedPlan?.timeframe || '1 week'}
                </Badge>
                <Badge variant="outline">
                  {plan.personalizedPlan?.steps?.length || 0} steps
                </Badge>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  {createdDate.toLocaleDateString()}
                </div>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleDownloadPDF}>
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {
                  setNewTitle(plan.personalizedPlan?.title || '');
                  setShowRenameDialog(true);
                }}>
                  <Edit className="h-4 w-4 mr-2" />
                  Rename
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setShowDeleteDialog(true)}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this plan?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The plan will be permanently deleted from your account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete} 
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={showRenameDialog} onOpenChange={setShowRenameDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename plan</DialogTitle>
            <DialogDescription>
              Enter a new title for your wellness plan.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="plan-title">Plan Title</Label>
            <Input
              id="plan-title"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="e.g., Morning Routine Plan"
              maxLength={100}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRenameDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleRename} 
              disabled={isRenaming || !newTitle.trim()}
            >
              {isRenaming ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
