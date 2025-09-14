"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowUpDown, ArrowUp, ArrowDown, X } from "lucide-react";

interface SortOption {
  value: string;
  label: string;
}

interface SortDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sortOptions?: SortOption[];
  currentSort?: {
    field: string;
    order: 'asc' | 'desc';
  };
  onSortChange: (field: string, order: 'asc' | 'desc') => void;
  title?: string;
  description?: string;
  entityType?: string;
}

export function SortDialog({ 
  open, 
  onOpenChange, 
  sortOptions = [], 
  currentSort, 
  onSortChange,
  title = "Sort & Organize",
  description = "Customize how your data is displayed",
  entityType = "items"
}: SortDialogProps) {
  const [sortField, setSortField] = useState(currentSort?.field || 'date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(currentSort?.order || 'desc');

  const handleApply = () => {
    onSortChange(sortField, sortOrder);
    onOpenChange(false);
  };

  const handleReset = () => {
    setSortField('date');
    setSortOrder('desc');
    onSortChange('date', 'desc');
    onOpenChange(false);
  };

  // Don't render if no sort options are available
  if (!sortOptions || sortOptions.length === 0) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-hidden rounded-xl flex flex-col p-0">
        <DialogHeader className="p-0 flex-shrink-0">
          <div className="bg-gradient-to-r from-[#1e40af] to-[#3b82f6] p-6 rounded-t-xl relative">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <ArrowUpDown className="w-5 h-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-white">
                  {title}
                </DialogTitle>
                <p className="text-blue-100 text-sm mt-1">
                  {description}
                </p>
              </div>
            </div>
            
            {/* Close Button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 top-4 h-10 w-10 rounded-full hover:bg-white/20 text-white"
              onClick={() => onOpenChange(false)}
              aria-label="Close dialog"
            >
              <X className="h-6 w-6" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 pt-6 pb-6">
            <div className="space-y-6">
              {/* Sort Field */}
              <div className="space-y-3">
                <Label className="text-sm font-medium text-gray-700">Sort by</Label>
                <Select value={sortField} onValueChange={setSortField}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select field to sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    {sortOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Sort Order */}
              <div className="space-y-3">
                <Label className="text-sm font-medium text-gray-700">Sort order</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant={sortOrder === 'asc' ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSortOrder('asc')}
                    className="flex items-center gap-2 h-10 rounded"
                  >
                    <ArrowUp className="w-4 h-4" />
                    Ascending
                  </Button>
                  <Button
                    variant={sortOrder === 'desc' ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSortOrder('desc')}
                    className="flex items-center gap-2 h-10 rounded"
                  >
                    <ArrowDown className="w-4 h-4" />
                    Descending
                  </Button>
                </div>
              </div>

              {/* Current Sort Display */}
              <div className="p-3 bg-gray-50 border rounded">
                <p className="text-sm text-gray-600">
                  Current sort: <strong>{sortOptions.find(opt => opt.value === (currentSort?.field || 'date'))?.label}</strong> ({(currentSort?.order || 'desc') === 'asc' ? 'Ascending' : 'Descending'})
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <DialogFooter className="flex items-center justify-between pt-6 border-t border-gray-200 flex-shrink-0 px-6 mb-6">
            <div className="flex items-center gap-2">
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={handleReset}
                className="rounded"
              >
                Reset to Default
              </Button>
              <Button 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                className="rounded"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleApply}
                className="bg-blue-600 hover:bg-blue-700 rounded"
              >
                Apply Sort
              </Button>
            </div>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}