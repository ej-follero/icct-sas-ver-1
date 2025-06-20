import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { BadgeInfo } from "lucide-react";

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
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-white/90 border border-blue-100 shadow-lg rounded-xl py-8 px-6">
        <DialogHeader>
          <DialogTitle className="text-blue-900 text-xl flex items-center gap-2 mb-6">
            {title}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="text-blue-400 cursor-pointer">
                    <BadgeInfo className="w-4 h-4" />
                  </span>
                </TooltipTrigger>
                <TooltipContent side="right" className="bg-blue-900 text-white">
                  {tooltip}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-8">
          {/* Sort By Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <h3 className="text-md font-semibold text-blue-900">Sort By</h3>
              </div>
            </div>
            <div className="h-px bg-blue-100 w-full mb-8"></div>
            <div className="grid grid-cols-2 gap-4 mt-6">
              {sortFieldOptions.map(option => (
                <Button
                  key={option.value}
                  variant={sortField === option.value ? "default" : "outline"}
                  size="sm"
                  className={`w-full ${sortField === option.value ? 'bg-blue-600 hover:bg-blue-700' : 'hover:bg-blue-50'}`}
                  onClick={() => setSortField(option.value)}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>
          {/* Sort Order Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <h3 className="text-md font-semibold text-blue-900">Sort Order</h3>
              </div>
            </div>
            <div className="h-px bg-blue-100 w-full mb-8"></div>
            <div className="grid grid-cols-2 gap-4 mt-6">
              <Button
                variant={sortOrder === 'asc' ? "default" : "outline"}
                size="sm"
                className={`w-full ${sortOrder === 'asc' ? 'bg-blue-600 hover:bg-blue-700' : 'hover:bg-blue-50'}`}
                onClick={() => setSortOrder('asc')}
              >
                Ascending
              </Button>
              <Button
                variant={sortOrder === 'desc' ? "default" : "outline"}
                size="sm"
                className={`w-full ${sortOrder === 'desc' ? 'bg-blue-600 hover:bg-blue-700' : 'hover:bg-blue-50'}`}
                onClick={() => setSortOrder('desc')}
              >
                Descending
              </Button>
            </div>
          </div>
        </div>
        <DialogFooter className="gap-4 mt-10">
          <Button
            variant="outline"
            onClick={onReset}
            className="w-32 border border-blue-300 text-blue-500"
          >
            Reset
          </Button>
          <Button 
            onClick={() => {
              onApply();
              onOpenChange(false);
            }}
            className="w-32 bg-blue-600 hover:bg-blue-700 text-white"
          >
            Apply Sort
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 