import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Loader2, CheckCircle, Trash2, Archive, Clock, FileText, HardDrive, X, Check, RotateCcw, AlertCircle, Shield } from "lucide-react";
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
  confirmLabel?: string;
  // Enhanced props for backup deletion
  backupDetails?: {
    name: string;
    type: string;
    size: string;
    status: string;
    createdAt: string;
    location: string;
    description?: string;
  };
  isBackupDeletion?: boolean;
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
  dangerText = "Delete",
  confirmLabel,
  backupDetails,
  isBackupDeletion = false
}) => {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open && cancelRef.current) {
      cancelRef.current.focus();
    }
  }, [open]);

  const isReactivate = confirmLabel && confirmLabel.toLowerCase() === 'reactivate';
  const buttonLabel = confirmLabel || dangerText || "Delete";
  const dialogTitle = confirmLabel
    ? `${buttonLabel} ${itemName ? itemName : "Item"}`
    : `Delete ${itemName ? itemName : "Item"}`;
  
  const icon = isReactivate ? <CheckCircle className="w-6 h-6 text-green-500" aria-hidden="true" /> : 
    isBackupDeletion ? <Trash2 className="w-6 h-6 text-red-500" aria-hidden="true" /> : 
    <AlertTriangle className="w-6 h-6 text-red-500" aria-hidden="true" />;
  
  const titleClass = isReactivate ? "text-green-600 text-lg font-semibold" : "text-red-600 text-lg font-semibold";
  const buttonClass = isReactivate
    ? "w-32 h-10 rounded-xl font-medium bg-green-600 hover:bg-green-700 text-white focus-visible:ring-2 focus-visible:ring-green-200 focus-visible:ring-offset-2"
    : "w-32 h-10 rounded-xl font-medium bg-red-600 hover:bg-red-700 text-white focus-visible:ring-2 focus-visible:ring-red-200 focus-visible:ring-offset-2";

  // Enhanced description for backup deletion
  const getBackupDescription = () => {
    if (!backupDetails) return description;
    
    return (
      <div className="space-y-4">
        {/* Warning Section */}
        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-4 border border-red-200">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 bg-red-600 rounded flex items-center justify-center">
              <AlertTriangle className="w-3 h-3 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold text-red-900">Permanent Deletion Warning</h3>
              <p className="text-red-600 text-xs">This action cannot be undone</p>
            </div>
          </div>
          
          <div className="bg-white/50 rounded p-3 border border-red-200">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-3 h-3 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-red-700">
                <strong>Warning:</strong> This deletion cannot be undone. The backup file will be permanently removed from storage.
              </div>
            </div>
          </div>
        </div>

        {/* Backup Information Section */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
              <Archive className="w-3 h-3 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold text-blue-900">Backup Information</h3>
              <p className="text-blue-600 text-xs">Details of the backup to be deleted</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-white/50 rounded p-3 border border-blue-200">
              <div className="mb-1">
                <span className="text-xs font-medium text-blue-600">Name:</span>
              </div>
              <div className="text-xs font-semibold text-blue-900 truncate">{backupDetails.name}</div>
            </div>
            
            <div className="bg-white/50 rounded p-3 border border-blue-200">
              <div className="mb-1">
                <span className="text-xs font-medium text-blue-600">Type:</span>
              </div>
              <div className="text-xs font-semibold text-blue-900">{backupDetails.type}</div>
            </div>
            
            <div className="bg-white/50 rounded p-3 border border-blue-200">
              <div className="mb-1">
                <span className="text-xs font-medium text-blue-600">Size:</span>
              </div>
              <div className="text-xs font-mono font-semibold text-blue-900">{backupDetails.size}</div>
            </div>
            
            <div className="bg-white/50 rounded p-3 border border-blue-200">
              <div className="mb-1">
                <span className="text-xs font-medium text-blue-600">Location:</span>
              </div>
              <div className="text-xs font-semibold text-blue-900 capitalize">{backupDetails.location}</div>
            </div>
          </div>
          
          <div className="bg-white/50 rounded p-3 border border-blue-200 mt-3">
            <div className="mb-1">
              <span className="text-xs font-medium text-blue-600">Created:</span>
            </div>
            <div className="text-xs font-semibold text-blue-900">
              {new Date(backupDetails.createdAt).toLocaleString()}
            </div>
          </div>
          
          {backupDetails.description && (
            <div className="bg-white/50 rounded p-3 border border-blue-200 mt-3">
              <div className="mb-1">
                <span className="text-xs font-medium text-blue-600">Description:</span>
              </div>
              <div className="text-xs font-semibold text-blue-900 line-clamp-2">{backupDetails.description}</div>
            </div>
          )}
        </div>

        {/* Safety Information Section */}
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 bg-orange-600 rounded flex items-center justify-center">
              <Shield className="w-3 h-3 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold text-orange-900">Safety Information</h3>
              <p className="text-orange-600 text-xs">Important considerations before deletion</p>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-1.5 flex-shrink-0"></div>
              <div className="text-xs text-orange-700">
                <strong>Data Loss:</strong> All backup data will be permanently removed
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-1.5 flex-shrink-0"></div>
              <div className="text-xs text-orange-700">
                <strong>No Recovery:</strong> Deleted backups cannot be restored
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-1.5 flex-shrink-0"></div>
              <div className="text-xs text-orange-700">
                <strong>Storage Space:</strong> This will free up {backupDetails.size} of storage
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[85vh] overflow-hidden rounded-xl flex flex-col">
        <DialogHeader className="p-0 flex-shrink-0">
          <div className="bg-gradient-to-r from-red-600 to-red-700 p-4 rounded-t-xl -m-6 -mt-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                {icon}
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-white">
                  {isBackupDeletion ? "Delete Backup Permanently" : dialogTitle}
                </DialogTitle>
                <p className="text-red-100 text-xs mt-1 font-medium">
                  {isBackupDeletion ? "Remove backup file from the system" : "Confirm deletion action"}
                </p>
              </div>
            </div>
            
            {/* Close Button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-3 top-3 h-8 w-8 rounded-full hover:bg-white/20 text-white"
              onClick={() => onOpenChange(false)}
              aria-label="Close dialog"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto px-4 py-6 mt-2">
          <div className="space-y-4">
            {deleteError ? (
              <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-4 border border-red-200">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 bg-red-600 rounded flex items-center justify-center">
                    <AlertCircle className="w-3 h-3 text-white" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-red-900">Error</h3>
                    <p className="text-red-600 text-xs">An error occurred during deletion</p>
                  </div>
                </div>
                <div className="bg-white/50 rounded p-3 border border-red-200">
                  <div className="text-xs text-red-700 font-medium">{deleteError}</div>
                </div>
              </div>
            ) : isBackupDeletion ? (
              getBackupDescription()
            ) : (
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-4 border border-gray-200">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 bg-gray-600 rounded flex items-center justify-center">
                    <AlertTriangle className="w-3 h-3 text-white" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-900">Confirm Deletion</h3>
                    <p className="text-gray-600 text-xs">Review the details before proceeding</p>
                  </div>
                </div>
                
                <div className="bg-white/50 rounded p-3 border border-gray-200">
                  <div className="text-xs text-gray-700">
                    {description || (
                      <>
                        Are you sure you want to delete
                        {itemName ? (
                          <> the <span className="font-bold">{itemName}</span></>
                        ) : " this item"}
                        ? This action cannot be undone.
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Footer */}
        <DialogFooter className="flex items-center justify-between pt-6 border-t border-gray-200 flex-shrink-0 px-6">
          <div className="flex items-center gap-3">
            <Button
              ref={cancelRef}
              variant="outline"
              onClick={() => {
                onOpenChange(false);
                if (onCancel) onCancel();
              }}
              disabled={loading}
              aria-label="Cancel deletion"
              className="border border-gray-300 text-gray-700 hover:bg-gray-50 rounded px-4 py-2 text-sm"
            >
              <X className="w-3 h-3 mr-1" />
              Cancel
            </Button>
          </div>
          
          <div className="flex items-center gap-3">
            {isBackupDeletion && backupDetails && (
              <div className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded border">
                <span className="font-medium">Size:</span> {backupDetails.size}
              </div>
            )}
            <Button
              onClick={onDelete}
              disabled={!canDelete || loading}
              aria-label={buttonLabel}
              className="bg-red-600 hover:bg-red-700 text-white rounded px-4 py-2 text-sm shadow-lg hover:shadow-xl transition-all duration-200"
            >
              {loading && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
              {isBackupDeletion ? "Delete Permanently" : buttonLabel}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}; 