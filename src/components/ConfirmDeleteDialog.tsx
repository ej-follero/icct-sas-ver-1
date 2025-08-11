import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Loader2, CheckCircle, Trash2, Archive, X, RotateCcw } from "lucide-react";
import React, { useRef, useEffect } from "react";

/**
 * SECURITY CONSIDERATIONS:
 * 
 * This dialog can expose sensitive information through:
 * 1. itemName - May contain sensitive data
 * 2. description - May contain detailed information
 * 3. backupDetails - Contains file system information
 * 
 * RECOMMENDED USAGE:
 * 
 * For sensitive data (users, financial records, etc.):
 * - Set showItemDetails={false}
 * - Set sanitizeItemName={true}
 * - Use generic descriptions
 * 
 * For non-sensitive data (courses, departments, etc.):
 * - Set showItemDetails={true}
 * - Set sanitizeItemName={false}
 * - Can use detailed descriptions
 * 
 * For backup deletion:
 * - Always review backupDetails for sensitive information
 * - Consider redacting sensitive paths or names
 */

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
  // Additional warning information
  warningMessage?: string;
  affectedItems?: number;
  affectedItemType?: string;
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
  isBackupDeletion = false,
  warningMessage,
  affectedItems,
  affectedItemType
}) => {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open && cancelRef.current) {
      cancelRef.current.focus();
    }
  }, [open]);

  const isReactivate = confirmLabel && confirmLabel.toLowerCase() === 'reactivate';
  const isArchive = !isReactivate && !isBackupDeletion;
  
  // Helper function to get action label
  const getActionLabel = () => {
    if (confirmLabel) return confirmLabel;
    if (isArchive) return "Archive";
    if (isBackupDeletion) return "Delete";
    return dangerText || "Delete";
  };
  
  const actionLabel = getActionLabel();
  const displayName = itemName || "Item";
  
  const dialogTitle = actionLabel;

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
                <strong>Warning:</strong> The backup file will be permanently removed from storage.
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
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-w-[90vw] w-full mx-auto bg-white/95 backdrop-blur border border-gray-200 shadow-2xl rounded-2xl overflow-hidden">
                 {/* Header with Gradient Background */}
         <div className="bg-gradient-to-r from-red-500 to-red-600 p-4 sm:p-5 -mx-6 -mt-6 relative">
           <div className="flex items-start gap-3 sm:gap-4">
             <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded flex items-center justify-center backdrop-blur-sm flex-shrink-0">
               {isReactivate ? (
                 <RotateCcw className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
               ) : isArchive ? (
                 <Archive className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
               ) : (
                 <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
               )}
             </div>
             <div className="flex-1 min-w-0 pr-8">
               <DialogTitle className="text-lg sm:text-xl font-bold text-white leading-tight">
                 {dialogTitle}?
               </DialogTitle>
               <p className="text-red-100 text-sm mt-1 opacity-90">
                 {isReactivate ? "Restore this item to active status" : 
                   isArchive ? "Archive this item (can be restored later)" : 
                   "This action cannot be undone"}
               </p>
             </div>
           </div>
          
                     {/* Close Button */}
           <button
             onClick={() => onOpenChange(false)}
             className="absolute right-3 top-3 sm:right-4 sm:top-4 w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors duration-200 text-white"
             aria-label="Close dialog"
           >
             <X className="w-4 h-4" />
           </button>
        </div>
        
        {/* Content */}
        <div className="px-6 py-6 space-y-5">
          {deleteError ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <div>
                  <h3 className="font-semibold text-red-900 text-sm">Error</h3>
                  <p className="text-red-700 text-sm">{deleteError}</p>
                </div>
              </div>
            </div>
          ) : isBackupDeletion ? (
            getBackupDescription()
          ) : (
                         <div className="space-y-4">
                              {/* Primary Message */}
                                 <div className="text-gray-700">
                   <p className="text-base leading-relaxed text-center font-semibold">
                     {description || (
                       <>
                         Are you sure you want to {actionLabel.toLowerCase()}
                         {displayName !== "Item" ? (
                           <> "{displayName}"</>
                         ) : " this item"}
                         ?
                       </>
                     )}
                   </p>
                </div>

               {/* Warning Box for Connected Items */}
               {(warningMessage || affectedItems) && (
                 <div className="bg-orange-50 border-l-4 border-orange-400 rounded-r-lg p-4">
                   <div className="flex items-start gap-3">
                     <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                     <div>
                       <h4 className="font-semibold text-orange-900 text-sm">Warning</h4>
                       <p className="text-orange-700 text-sm">
                         {warningMessage || (
                           <>
                             By {actionLabel.toLowerCase()}ing this {displayName !== "Item" ? "item" : "media"}
                             {affectedItems && affectedItemType && (
                               <> <strong>{affectedItems} {affectedItemType}</strong> will also be {actionLabel.toLowerCase()}ed</>
                             )}
                             .
                           </>
                         )}
                       </p>
                     </div>
                   </div>
                 </div>
               )}

             </div>
          )}
        </div>
        
        {/* Footer */}
        <DialogFooter className="px-6 py-5 border-t border-gray-100 bg-gray-50">
          <div className="flex gap-4 w-full">
            <Button
              ref={cancelRef}
              variant="outline"
              onClick={() => {
                onOpenChange(false);
                if (onCancel) onCancel();
              }}
              disabled={loading}
              className="flex-1 bg-gray-100 rounded border-gray-300 text-gray-700 hover:bg-gray-200 hover:border-gray-400"
            >
              Cancel
            </Button>
            
            <Button
              onClick={onDelete}
              disabled={!canDelete || loading}
              className={`flex-1 py-2.5 rounded ${
                isReactivate 
                  ? 'bg-green-600 hover:bg-green-700 text-white' 
                  : isArchive
                    ? 'bg-orange-600 hover:bg-orange-700 text-white'
                    : 'bg-red-600 hover:bg-red-700 text-white'
              }`}
            >
              {loading && <Loader2 className="w-5 h-5 mr-2 animate-spin" />}
              {!loading && (
                isReactivate ? <RotateCcw className="w-5 h-5 mr-2" /> : 
                isArchive ? <Archive className="w-5 h-5 mr-2" /> :
                <Trash2 className="w-5 h-5 mr-2" />
              )}
              {actionLabel}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}; 