import React from 'react';
import { Button } from '../ui/button';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '../ui/tooltip';

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
    variant?: 'default' | 'outline' | 'destructive' | 'ghost';
    hidden?: boolean; // Add hidden prop
  }[];
  onClear: () => void;
  entityLabel?: string;
  className?: string;
}

const BulkActionsBar: React.FC<BulkActionsBarProps> = ({ selectedCount, actions, onClear, entityLabel = 'item', className = '' }) => {
  return (
    <div className={`pt-4 pb-4 px-4 bg-gray-50 rounded-xl flex items-center justify-between border border-blue-100 ${className}`}>
      <div className="flex items-center gap-8">
        <span className="text-sm text-gray-600">
          {selectedCount} {selectedCount === 1 ? entityLabel : entityLabel + 's'} selected
        </span>
      </div>
      <div className="flex items-center gap-4">
        <TooltipProvider>
          {actions.filter(action => !action.hidden).map(action => (
            <Tooltip key={action.key}>
              <TooltipTrigger asChild>
                <Button
                  variant={action.variant || 'outline'}
                  size="sm"
                  onClick={action.onClick}
                  disabled={action.disabled || action.loading}
                  className={
                    (action.variant === 'destructive'
                      ? 'text-white bg-red-600 hover:bg-red-600 '
                      : '') + ' rounded-xl'
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
          {/* Tooltip for Clear Selection button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={onClear}
                className="border border-blue-300 text-blue-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-200 hover:bg-blue-50"
              >
                Clear Selection
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <span>Clear all selected items</span>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
};

export default BulkActionsBar; 