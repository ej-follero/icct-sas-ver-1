import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import RFIDReaderForm from "./RFIDReaderForm";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { X, Wifi, CreditCard } from "lucide-react";

interface RFIDReaderFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: "create" | "update";
  data?: any;
  id?: number;
  onSuccess: (data: any) => void;
}

function RFIDReaderFormDialog({
  open,
  onOpenChange,
  type,
  data,
  id,
  onSuccess
}: RFIDReaderFormDialogProps) {
  const [isInternalSubmitting, setIsInternalSubmitting] = useState(false);

  const handleSubmit = async (formData: any) => {
    try {
      setIsInternalSubmitting(true);
      // The form component handles the API call and shows success/error messages
      // We just need to close the dialog on success
      onSuccess(formData);
      onOpenChange(false); // Close dialog on success
    } catch (error) {
      console.error('Dialog submission error:', error);
      // Error handling is done in the form component
    } finally {
      setIsInternalSubmitting(false);
    }
  };

  const isDialogSubmitting = isInternalSubmitting;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden bg-white/95 backdrop-blur-sm border border-blue-200 shadow-2xl rounded-2xl p-0 flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 rounded-t-2xl p-6 relative flex-shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
            className="absolute top-4 right-4 h-8 w-8 text-white hover:bg-white/20 rounded-full"
            aria-label="Close dialog"
          >
            <X className="h-4 w-4" />
          </Button>
          <div className="flex items-start gap-4 pr-24">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Wifi className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-xl font-bold text-white mb-1">
                {type === "create" ? "Add New RFID Reader" : "Update RFID Reader"}
              </DialogTitle>
              <p className="text-blue-100 text-sm">
                {type === "create" ? "Create and register a new reader device" : "Edit reader device information"}
              </p>
            </div>
          </div>
        </div>

        {/* Form Content - Scrollable */}
        <div className="flex-1 overflow-y-auto py-4 px-6">
          <RFIDReaderForm
            type={type}
            data={data}
            id={id}
            onSuccess={handleSubmit}
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
                  {type === 'create' ? 'Creating...' : 'Updating...'}
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4 mr-2" />
                  {type === 'create' ? 'Create Reader' : 'Update Reader'}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default RFIDReaderFormDialog; 