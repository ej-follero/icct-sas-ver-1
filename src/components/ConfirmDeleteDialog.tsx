import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Loader2 } from "lucide-react";
import React, { useRef, useEffect } from "react";

interface ConfirmDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemName?: string;
  onDelete: () => void;
  onCancel?: () => void;
  canDelete?: boolean;
  deleteError?: string | null;
  loading?: boolean;
  description?: string;
  dangerText?: string;
}

export const ConfirmDeleteDialog: React.FC<ConfirmDeleteDialogProps> = ({
  open,
  onOpenChange,
  itemName,
  onDelete,
  onCancel,
  canDelete = true,
  deleteError,
  loading = false,
  description,
  dangerText = "Delete"
}) => {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open && cancelRef.current) {
      cancelRef.current.focus();
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md animate-fade-in rounded-xl">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-6 h-6 text-red-500" aria-hidden="true" />
            <DialogTitle className="text-red-600 text-lg font-semibold">Delete {itemName ? itemName : "Item"}</DialogTitle>
          </div>
          <div
            className={
              deleteError
                ? "text-red-500 font-medium whitespace-pre-line text-base mb-2 text-justify"
                : "text-blue-900 font-medium whitespace-pre-line text-base mb-2"
            }
            role={deleteError ? "alert" : undefined}
          >
            {deleteError
              ? deleteError
              : description || (
                  <>
                    Are you sure you want to delete
                    {itemName ? (
                      <> the <span className="font-bold">{itemName}</span></>
                    ) : " this item"}
                    ? This action cannot be undone.
                  </>
                )}
          </div>
        </DialogHeader>
        <DialogFooter className="mt-4 flex gap-3">
          <Button
            ref={cancelRef}
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              if (onCancel) onCancel();
            }}
            disabled={loading}
            aria-label="Cancel deletion"
            className="w-32 rounded-xl border border-blue-300 text-blue-600 focus-visible:ring-2 focus-visible:ring-blue-200 focus-visible:ring-offset-2 hover:bg-blue-50 font-medium"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onDelete}
            disabled={!canDelete || loading}
            aria-label={dangerText}
            className="w-32 h-10 rounded-xl font-medium"
          >
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {dangerText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}; 