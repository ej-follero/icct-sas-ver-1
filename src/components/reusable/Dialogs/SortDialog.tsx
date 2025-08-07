import React, { useEffect, useCallback, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { BadgeInfo, X, ArrowUpDown, ArrowUp, ArrowDown, Check, RotateCcw, AlertCircle } from "lucide-react";

export interface SortFieldOption<T extends string> {
  value: T;
  label: string;
}

export interface SortDialogProps<T extends string = string> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sortField: T;
  setSortField: (field: T) => void;
  sortOrder: "asc" | "desc";
  setSortOrder: (order: "asc" | "desc") => void;
  sortFieldOptions: SortFieldOption<T>[];
  onApply: () => void;
  onReset: () => void;
  title?: string;
  tooltip?: string;
}

export function SortDialog<T extends string = string>({
  open,
  onOpenChange,
  sortField,
  setSortField,
  sortOrder,
  setSortOrder,
  sortFieldOptions,
  onApply,
  onReset,
  title = "Sort",
  tooltip = "Sort the list by different fields. Choose the field and order to organize your list.",
}: SortDialogProps<T>) {
  
  // Notification dialog state
  const [showNotificationDialog, setShowNotificationDialog] = useState(false);
  const [notificationConfig, setNotificationConfig] = useState<{
    type: 'success' | 'error' | 'info';
    title: string;
    message: string;
  } | null>(null);

  // Helper function to show notification
  const showNotification = (type: 'success' | 'error' | 'info', title: string, message: string) => {
    setNotificationConfig({ type, title, message });
    setShowNotificationDialog(true);
  };
  
  // Cleanup function to prevent UI blocking
  const cleanup = useCallback(() => {
    console.log('SortDialog: cleanup called');
    
    // Reset focus to body
    setTimeout(() => {
      document.body.focus();
      
      // Remove any potential overlay issues
      const overlays = document.querySelectorAll('[data-radix-dialog-overlay]');
      overlays.forEach(overlay => {
        if (overlay instanceof HTMLElement) {
          overlay.style.pointerEvents = 'none';
          overlay.remove();
        }
      });
      
      // Remove any focus traps
      const focusTraps = document.querySelectorAll('[data-radix-focus-trap]');
      focusTraps.forEach(trap => {
        if (trap instanceof HTMLElement) {
          trap.remove();
        }
      });
      
      // Ensure body is interactive
      document.body.style.pointerEvents = 'auto';
      document.body.style.overflow = 'auto';
    }, 100);
  }, []);

  // Cleanup effect when component unmounts
  useEffect(() => {
    return () => {
      console.log('SortDialog: component unmounting, cleaning up');
      cleanup();
    };
  }, [cleanup]);

  // Cleanup effect when dialog closes
  useEffect(() => {
    if (!open) {
      console.log('SortDialog: dialog closed, cleaning up');
      cleanup();
    }
  }, [open, cleanup]);

  // Enhanced onOpenChange handler
  const handleOpenChange = (newOpen: boolean) => {
    console.log('SortDialog: onOpenChange called with', newOpen);
    if (!newOpen) {
      // Dialog is closing, ensure proper cleanup
      setTimeout(() => {
        cleanup();
      }, 150);
    }
    onOpenChange(newOpen);
  };
  return (
    <>
      <Dialog 
        key={`sort-dialog-${open ? 'open' : 'closed'}`}
        open={open} 
        onOpenChange={handleOpenChange}
      >
      <DialogContent className="max-w-[700px] max-h-[90vh] overflow-hidden rounded-xl flex flex-col">
        <DialogHeader className="p-0 flex-shrink-0">
          <div className="bg-gradient-to-r from-[#1e40af] to-[#3b82f6] p-6 rounded-t-xl -m-6 -mt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <ArrowUpDown className="w-5 h-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-white">
                  {title}
                </DialogTitle>
                <p className="text-blue-100 text-sm mt-1 font-medium">
                  {tooltip}
                </p>
              </div>
            </div>
            
            {/* Close Button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 top-4 h-10 w-10 rounded-full hover:bg-white/20 text-white"
              onClick={() => handleOpenChange(false)}
              aria-label="Close dialog"
            >
              <X className="h-6 w-6" />
            </Button>
          </div>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto px-4 py-8 mt-4">
          <div className="space-y-8">
          {/* Sort By Section */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-8 border border-blue-200">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
                <ArrowUpDown className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-blue-900">Sort By</h3>
                <p className="text-blue-600 text-sm">Choose the field to sort your data</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {sortFieldOptions.map(option => (
                <Button
                  key={option.value}
                  variant={sortField === option.value ? "default" : "outline"}
                  size="lg"
                  className={`w-full h-12 transition-all duration-200 rounded ${
                    sortField === option.value 
                      ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200' 
                      : 'hover:bg-blue-50 hover:border-blue-300 hover:shadow-md'
                  }`}
                  onClick={() => setSortField(option.value)}
                >
                  <div className="flex items-center gap-2">
                    {sortField === option.value && <Check className="w-4 h-4" />}
                    <span className="font-medium">{option.label}</span>
                  </div>
                </Button>
              ))}
            </div>
          </div>
          {/* Sort Order Section */}
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-8 mt-4 border border-green-200">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-green-600 rounded flex items-center justify-center">
                <ArrowUpDown className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-green-900">Sort Order</h3>
                <p className="text-green-600 text-sm">Choose the direction for sorting</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-6">
              <Button
                variant={sortOrder === 'asc' ? "default" : "outline"}
                size="lg"
                className={`w-full h-12 transition-all duration-200 rounded ${
                  sortOrder === 'asc' 
                    ? 'bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-200' 
                    : 'hover:bg-green-50 hover:border-green-300 hover:shadow-md'
                }`}
                onClick={() => setSortOrder('asc')}
              >
                <div className="flex items-center gap-2">
                  <ArrowUp className="w-4 h-4" />
                  <span className="font-medium">Ascending</span>
                  {sortOrder === 'asc' && <Check className="w-4 h-4" />}
                </div>
              </Button>
              <Button
                variant={sortOrder === 'desc' ? "default" : "outline"}
                size="lg"
                className={`w-full h-12 transition-all duration-200 rounded ${
                  sortOrder === 'desc' 
                    ? 'bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-200' 
                    : 'hover:bg-green-50 hover:border-green-300 hover:shadow-md'
                }`}
                onClick={() => setSortOrder('desc')}
              >
                <div className="flex items-center gap-2">
                  <ArrowDown className="w-4 h-4" />
                  <span className="font-medium">Descending</span>
                  {sortOrder === 'desc' && <Check className="w-4 h-4" />}
                </div>
              </Button>
            </div>
          </div>
        </div>
        </div>
        
        {/* Current Sort Summary */}
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 mt-4 border border-purple-200">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-purple-600 rounded flex items-center justify-center">
              <ArrowUpDown className="w-3 h-3 text-white" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-purple-900">Current Sort Configuration</h4>
              <p className="text-purple-700 text-sm">
                {sortFieldOptions.find(opt => opt.value === sortField)?.label} 
                {sortOrder === 'asc' ? ' (A to Z)' : ' (Z to A)'}
              </p>
            </div>
            <div className={`px-2 py-1 rounded-full text-xs font-medium ${
              sortOrder === 'asc' 
                ? 'bg-green-100 text-green-700' 
                : 'bg-orange-100 text-orange-700'
            }`}>
              {sortOrder === 'asc' ? 'Ascending' : 'Descending'}
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <DialogFooter className="flex items-center justify-between pt-8 border-t border-gray-200 flex-shrink-0 px-8">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => {
                onReset();
                console.log('SortDialog: Reset clicked');
              }}
              className="border border-blue-300 text-blue-500 hover:bg-blue-50 hover:blue-400 rounded px-4 py-2"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-500 bg-gray-50 px-3 py-2 rounded border">
              <span className="font-medium">Preview:</span> {sortFieldOptions.find(opt => opt.value === sortField)?.label} 
              {sortOrder === 'asc' ? ' ↑' : ' ↓'}
            </div>
            <Button 
              onClick={() => {
                onApply();
                handleOpenChange(false);
                // Show success notification
                setTimeout(() => {
                  showNotification(
                    'success', 
                    'Sort Applied', 
                    `Data sorted by ${sortFieldOptions.find(opt => opt.value === sortField)?.label} in ${sortOrder === 'asc' ? 'ascending' : 'descending'} order.`
                  );
                }, 300);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded px-6 py-2 shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <Check className="w-4 h-4 mr-2" />
              Apply Sort
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* Notification Dialog */}
    <Dialog open={showNotificationDialog} onOpenChange={setShowNotificationDialog}>
      <DialogContent className="max-w-md rounded">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              notificationConfig?.type === 'success' ? 'bg-green-100' :
              notificationConfig?.type === 'error' ? 'bg-red-100' :
              'bg-blue-100'
            }`}>
              {notificationConfig?.type === 'success' && <Check className="w-5 h-5 text-green-600" />}
              {notificationConfig?.type === 'error' && <AlertCircle className="w-5 h-5 text-red-600" />}
              {notificationConfig?.type === 'info' && <BadgeInfo className="w-5 h-5 text-blue-600" />}
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-gray-900">
                {notificationConfig?.title}
              </DialogTitle>
              <p className="text-gray-600 text-sm mt-1">
                {notificationConfig?.message}
              </p>
            </div>
          </div>
        </DialogHeader>
        <DialogFooter className="pt-4">
          <Button 
            onClick={() => setShowNotificationDialog(false)}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded px-6 py-2"
          >
            Got it
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
} 