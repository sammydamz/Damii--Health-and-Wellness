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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { MoreVertical, Download, Edit, Trash2, Calendar, ChevronDown, ChevronUp, Copy, FileDown, FileText } from 'lucide-react';
import type { WellnessPlanOutput } from '@/app/schemas/wellness-plan';
import { WellnessPlanView } from './plan-view';
import { copyToClipboard, exportToPDF, exportToDOCX } from '@/lib/export-utils';

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
  const [isExpanded, setIsExpanded] = useState(false);
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

  const handleCopy = async () => {
    try {
      await copyToClipboard(plan);
      toast({
        title: 'Copied!',
        description: 'Plan copied to clipboard as plain text',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to copy plan',
        variant: 'destructive',
      });
    }
  };

  const handleExportPDF = () => {
    try {
      exportToPDF(plan);
      toast({
        title: 'Downloaded!',
        description: 'Plan exported as PDF',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to export PDF',
        variant: 'destructive',
      });
    }
  };

  const handleExportDOCX = async () => {
    try {
      await exportToDOCX(plan);
      toast({
        title: 'Downloaded!',
        description: 'Plan exported as DOCX',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to export DOCX',
        variant: 'destructive',
      });
    }
  };

  const createdDate = plan.createdAt?.toDate?.() || new Date(plan.savedAt);

  return (
    <>
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="pt-6 space-y-4">
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
              <div className="flex gap-2">
                <CollapsibleTrigger asChild>
                  <Button variant="outline" size="sm">
                    {isExpanded ? (
                      <>
                        <ChevronUp className="h-4 w-4 mr-2" />
                        Collapse
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-4 w-4 mr-2" />
                        View Plan
                      </>
                    )}
                  </Button>
                </CollapsibleTrigger>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleCopy}>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy Text
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleExportPDF}>
                      <FileDown className="h-4 w-4 mr-2" />
                      Download PDF
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleExportDOCX}>
                      <FileText className="h-4 w-4 mr-2" />
                      Download DOCX
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
            </div>

            <CollapsibleContent className="space-y-4">
              <div className="border-t pt-4">
                <WellnessPlanView 
                  plan={plan.personalizedPlan} 
                  fullResult={plan}
                  onSave={() => {
                    toast({
                      title: 'Already saved',
                      description: 'This plan is already in your collection',
                    });
                  }}
                />
              </div>
            </CollapsibleContent>
          </CardContent>
        </Card>
      </Collapsible>

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
