"use client";

import { useState, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  X, 
  Folder, 
  Inbox, 
  Send, 
  FileText, 
  AlertTriangle, 
  Trash2,
  Loader2
} from "lucide-react";
import { toast } from "sonner";

export type EmailFolder = 'INBOX' | 'SENT' | 'DRAFT' | 'SPAM' | 'TRASH';

interface EmailBulkMoveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCount: number;
  onMove: (folder: EmailFolder) => Promise<void>;
  isLoading?: boolean;
}

const folderOptions = [
  {
    value: 'INBOX' as EmailFolder,
    label: 'Inbox',
    icon: Inbox,
    description: 'Move emails to inbox',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  {
    value: 'SENT' as EmailFolder,
    label: 'Sent',
    icon: Send,
    description: 'Move emails to sent folder',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
  },
  {
    value: 'DRAFT' as EmailFolder,
    label: 'Drafts',
    icon: FileText,
    description: 'Move emails to drafts',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
  },
  {
    value: 'SPAM' as EmailFolder,
    label: 'Spam',
    icon: AlertTriangle,
    description: 'Move emails to spam folder',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
  },
  {
    value: 'TRASH' as EmailFolder,
    label: 'Trash',
    icon: Trash2,
    description: 'Move emails to trash',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
  },
];

export default function EmailBulkMoveDialog({
  open,
  onOpenChange,
  selectedCount,
  onMove,
  isLoading = false,
}: EmailBulkMoveDialogProps) {
  const [selectedFolder, setSelectedFolder] = useState<EmailFolder>('INBOX');

  const handleMove = useCallback(async () => {
    try {
      await onMove(selectedFolder);
      onOpenChange(false);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to move emails');
    }
  }, [selectedFolder, onMove, onOpenChange]);

  const handleClose = useCallback(() => {
    if (!isLoading) {
      onOpenChange(false);
    }
  }, [isLoading, onOpenChange]);

  const selectedOption = folderOptions.find(opt => opt.value === selectedFolder);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md p-0">
        <DialogHeader className="px-6 py-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <Folder className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <DialogTitle className="text-lg font-semibold text-gray-900">
                  Move Emails
                </DialogTitle>
                <p className="text-sm text-gray-600 mt-1">
                  Move {selectedCount} email{selectedCount !== 1 ? 's' : ''} to a folder
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="h-8 w-8"
              disabled={isLoading}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="px-6 py-4 space-y-4">
          {/* Folder Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Select Destination Folder
            </label>
            <Select 
              value={selectedFolder} 
              onValueChange={(value: EmailFolder) => setSelectedFolder(value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {folderOptions.map((option) => {
                  const IconComponent = option.icon;
                  return (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <IconComponent className={`w-4 h-4 ${option.color}`} />
                        <span>{option.label}</span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Selected Folder Preview */}
          {selectedOption && (
            <div className={`p-3 rounded-lg border ${selectedOption.bgColor}`}>
              <div className="flex items-center gap-3">
                <selectedOption.icon className={`w-5 h-5 ${selectedOption.color}`} />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {selectedOption.label}
                  </p>
                  <p className="text-xs text-gray-600">
                    {selectedOption.description}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Warning for destructive actions */}
          {(selectedFolder === 'TRASH' || selectedFolder === 'SPAM') && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-red-800">
                    {selectedFolder === 'TRASH' ? 'Move to Trash' : 'Mark as Spam'}
                  </p>
                  <p className="text-xs text-red-600 mt-1">
                    {selectedFolder === 'TRASH' 
                      ? 'Emails moved to trash can be recovered later.'
                      : 'Emails marked as spam will be filtered from your inbox.'
                    }
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t bg-gray-50">
          <div className="flex items-center justify-end gap-3">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleMove}
              disabled={isLoading}
              className="min-w-[100px]"
              variant={selectedFolder === 'TRASH' || selectedFolder === 'SPAM' ? 'destructive' : 'default'}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Moving...
                </>
              ) : (
                <>
                  <Folder className="w-4 h-4 mr-2" />
                  Move
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
