import React from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

export interface BulkActionsBarProps {
  selectedCount: number;
  actions: {
    key: string;
    label: string;
    icon: React.ReactNode;
    onClick: () => void;
    loading?: boolean;
    disabled?: boolean;
    tooltip?: string;
    variant?: "default" | "outline" | "destructive" | "ghost";
  }[];
  onClear: () => void;
  entityLabel?: string; // e.g. "course", "department"
  className?: string;
}

export function BulkActionsBar({ selectedCount, actions, onClear, entityLabel = "item", className = "" }: BulkActionsBarProps) {
  return (
    <div className={`pt-2 pb-2 px-2 bg-gray-50 rounded-lg flex items-center justify-between border border-blue-100 ${className}`}>
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600">
          {selectedCount} {selectedCount === 1 ? entityLabel : entityLabel + "s"} selected
        </span>
      </div>
      <div className="flex items-center gap-2">
        <TooltipProvider>
          {actions.map(action => (
            <Tooltip key={action.key}>
              <TooltipTrigger asChild>
                <Button
                  variant={action.variant || "outline"}
                  size="sm"
                  onClick={action.onClick}
                  disabled={action.disabled || action.loading}
                  className={
                    action.variant === "destructive"
                      ? "text-white bg-red-600 hover:bg-red-700"
                      : ""
                  }
                >
                  {action.icon}
                  {action.label}
                </Button>
              </TooltipTrigger>
              {action.tooltip && (
                <TooltipContent>
                  <span>{action.tooltip}</span>
                </TooltipContent>
              )}
            </Tooltip>
          ))}
        </TooltipProvider>
        <Button
          variant="outline"
          size="sm"
          onClick={onClear}
          className="border border-blue-300 text-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-200 hover:bg-blue-50"
        >
          Clear Selection
        </Button>
      </div>
    </div>
  );
} 