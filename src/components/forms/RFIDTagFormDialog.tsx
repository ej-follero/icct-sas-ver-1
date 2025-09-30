"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, CreditCard, Pencil } from "lucide-react";
import { RFIDTagForm } from "./RFIDTagForm";

interface RFIDTagFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: {
    tagId: number;
    tagNumber: string;
    tagType: 'STUDENT_CARD' | 'INSTRUCTOR_CARD' | 'TEMPORARY_PASS' | 'VISITOR_PASS' | 'MAINTENANCE' | 'TEST';
    status: 'ACTIVE' | 'INACTIVE' | 'LOST' | 'DAMAGED' | 'EXPIRED' | 'REPLACED' | 'RESERVED';
    notes?: string;
    studentId?: number;
    instructorId?: number;
    assignedBy?: number;
    assignmentReason?: string;
    expiresAt?: string;
  };
  onSubmit: (data: any) => Promise<void>;
  isSubmitting?: boolean;
  mode?: 'create' | 'edit';
}

export function RFIDTagFormDialog({
  open,
  onOpenChange,
  initialData,
  onSubmit,
  isSubmitting = false,
  mode = 'create'
}: RFIDTagFormDialogProps) {
  const [isInternalSubmitting, setIsInternalSubmitting] = useState(false);

  const handleSubmit = async (data: any) => {
    try {
      setIsInternalSubmitting(true);
      await onSubmit(data);
      onOpenChange(false); // Close dialog on success
    } catch (error) {
      console.error('Dialog submission error:', error);
      // Error handling is done in the form component
    } finally {
      setIsInternalSubmitting(false);
    }
  };

  const isDialogSubmitting = isSubmitting || isInternalSubmitting;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] p-0 rounded-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 px-6 py-4 relative flex-shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
            className="absolute top-3 right-3 h-8 w-8 text-white hover:bg-white/20 rounded-full"
            aria-label="Close dialog"
            disabled={isDialogSubmitting}
          >
            <X className="h-4 w-4" />
          </Button>
          <div>
            <DialogTitle className="text-xl font-bold text-white mb-2 flex items-center gap-3">
              {mode === 'create' ? (
                <>
                  <div className="w-10 h-10 bg-white/20 rounded flex items-center justify-center">
                    <CreditCard className="w-6 h-6 text-white" />
                  </div>
                  Add Tag
                </>
              ) : (
                <>
                  <div className="w-10 h-10 bg-white/20 rounded flex items-center justify-center">
                    <Pencil className="w-6 h-6 text-white" />
                  </div>
                  Edit Tag
                </>
              )}
            </DialogTitle>
            <DialogDescription className="text-blue-100 text-sm">
              {mode === 'create' 
                ? 'Create a new RFID tag and assign it to a user.' 
                : 'Update tag information and save changes.'
              }
            </DialogDescription>
          </div>
        </div>

        {/* Form Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6">
          <RFIDTagForm
            initialData={initialData}
            onSubmit={handleSubmit}
            isSubmitting={isDialogSubmitting}
            mode={mode}
            showFooter={false}
          />
        </div>

        {/* Sticky Footer */}
        <div className="flex-shrink-0 border-t bg-gray-50 px-6 py-4">
          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isDialogSubmitting}
              className="rounded"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                // Trigger form submission
                const form = document.querySelector('form');
                if (form) {
                  form.requestSubmit();
                }
              }}
              disabled={isDialogSubmitting}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium transition-colors"
            >
              {isDialogSubmitting ? (
                <>
                  <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  {mode === 'create' ? 'Creating...' : 'Updating...'}
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4 mr-2" />
                  {mode === 'create' ? 'Create Tag' : 'Update Tag'}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
