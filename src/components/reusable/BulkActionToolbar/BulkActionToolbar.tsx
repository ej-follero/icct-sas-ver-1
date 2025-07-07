"use client";

import React, { useMemo } from 'react';
import { 
  Download, 
  Trash2, 
  Edit, 
  Mail, 
  Archive, 
  MoreHorizontal,
  X,
  CheckSquare,
  Square
} from 'lucide-react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { BaseComponentProps, TableAction, BulkActionConfig } from '../types';

// Toolbar variants
const toolbarVariants = cva(
  "flex items-center justify-between p-3 border-b border-border bg-muted/30 transition-all duration-200",
  {
    variants: {
      variant: {
        default: "bg-muted/30",
        prominent: "bg-primary/10 border-primary/20",
        destructive: "bg-destructive/10 border-destructive/20",
        success: "bg-green-50 border-green-200",
      },
      size: {
        sm: "p-2 text-sm",
        md: "p-3 text-sm",
        lg: "p-4 text-base",
      },
      position: {
        top: "border-b",
        bottom: "border-t",
        floating: "rounded-lg border shadow-lg bg-background",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
      position: "top",
    },
  }
);

// Component Props
export interface BulkActionToolbarProps<T = any>
  extends BaseComponentProps,
          VariantProps<typeof toolbarVariants>,
          BulkActionConfig<T> {
  // Additional customization
  showSelectAll?: boolean;
  onSelectAll?: () => void;
  onDeselectAll?: () => void;
  allSelected?: boolean;
  maxVisibleActions?: number;
  persistentActions?: TableAction<T>[];
  quickStats?: Array<{
    label: string;
    value: string | number;
    variant?: 'default' | 'success' | 'warning' | 'destructive';
  }>;
  customContent?: React.ReactNode;
  hideWhenEmpty?: boolean;
  animated?: boolean;
}

// Main Component
const BulkActionToolbar = <T extends Record<string, any>>({
  className,
  children,
  testId,
  variant = "default",
  size = "md", 
  position = "top",
  actions = [],
  selectedItems = [],
  onSelectionChange,
  totalItems = 0,
  showSelectAll = true,
  onSelectAll,
  onDeselectAll,
  allSelected = false,
  maxVisibleActions = 3,
  persistentActions = [],
  quickStats,
  customContent,
  hideWhenEmpty = false,
  animated = true,
  ...props
}: BulkActionToolbarProps<T>) => {
  
  // Calculate selection stats
  const selectionStats = useMemo(() => {
    const selectedCount = selectedItems.length;
    const percentage = totalItems > 0 ? Math.round((selectedCount / totalItems) * 100) : 0;
    
    return {
      selectedCount,
      totalItems,
      percentage,
      hasSelection: selectedCount > 0,
      isPartialSelection: selectedCount > 0 && selectedCount < totalItems,
      isAllSelected: selectedCount === totalItems && totalItems > 0,
    };
  }, [selectedItems.length, totalItems]);

  // Filter available actions based on selection
  const availableActions = useMemo(() => {
    return actions.filter(action => {
      if (action.hidden && action.hidden(selectedItems)) return false;
      return true;
    });
  }, [actions, selectedItems]);

  // Split actions into visible and overflow
  const visibleActions = availableActions.slice(0, maxVisibleActions);
  const overflowActions = availableActions.slice(maxVisibleActions);

  // Handle select all toggle
  const handleSelectAllToggle = () => {
    if (selectionStats.isAllSelected || selectionStats.isPartialSelection) {
      onDeselectAll?.();
      onSelectionChange([]);
    } else {
      onSelectAll?.();
    }
  };

  // Handle clear selection
  const handleClearSelection = () => {
    onSelectionChange([]);
  };

  // Don't render if no selection and hideWhenEmpty is true
  if (hideWhenEmpty && !selectionStats.hasSelection) {
    return null;
  }

  return (
    <div
      className={cn(
        toolbarVariants({ variant, size, position }),
        !selectionStats.hasSelection && "opacity-60",
        animated && "animate-in slide-in-from-top-2 duration-200",
        className
      )}
      data-testid={testId}
      {...props}
    >
      {/* Left Section - Selection Info */}
      <div className="flex items-center space-x-3">
        {/* Select All Checkbox */}
        {showSelectAll && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={handleSelectAllToggle}
          >
            {selectionStats.isAllSelected ? (
              <CheckSquare className="h-4 w-4" />
            ) : selectionStats.isPartialSelection ? (
              <div className="h-4 w-4 border-2 border-current bg-current/20 rounded-sm flex items-center justify-center">
                <div className="h-2 w-2 bg-current rounded-sm" />
              </div>
            ) : (
              <Square className="h-4 w-4" />
            )}
          </Button>
        )}

        {/* Selection Count */}
        <div className="flex items-center space-x-2">
          <Badge 
            variant={selectionStats.hasSelection ? "default" : "secondary"}
            className="font-medium"
          >
            {selectionStats.selectedCount} selected
          </Badge>
          
          {totalItems > 0 && (
            <span className="text-sm text-muted-foreground">
              of {totalItems} ({selectionStats.percentage}%)
            </span>
          )}
        </div>

        {/* Quick Stats */}
        {quickStats && quickStats.length > 0 && (
          <>
            <Separator orientation="vertical" className="h-4" />
            <div className="flex items-center space-x-2">
              {quickStats.map((stat, index) => (
                <div key={index} className="flex items-center space-x-1">
                  <span className="text-xs text-muted-foreground">{stat.label}:</span>
                  <Badge 
                    variant={stat.variant === 'destructive' ? 'destructive' : 'outline'}
                    className="text-xs"
                  >
                    {stat.value}
                  </Badge>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Custom Content */}
        {customContent && (
          <>
            <Separator orientation="vertical" className="h-4" />
            {customContent}
          </>
        )}
      </div>

      {/* Right Section - Actions */}
      <div className="flex items-center space-x-2">
        {/* Persistent Actions (always visible) */}
        {persistentActions.map((action) => (
          <Button
            key={action.key}
            variant={action.variant as any || "outline"}
            size="sm"
            onClick={() => action.onClick(selectedItems)}
            disabled={action.disabled?.(selectedItems)}
            className="flex items-center space-x-1"
          >
            {action.icon}
            <span>{action.label}</span>
          </Button>
        ))}

        {persistentActions.length > 0 && (visibleActions.length > 0 || overflowActions.length > 0) && (
          <Separator orientation="vertical" className="h-4" />
        )}

        {/* Main Actions */}
        {visibleActions.map((action) => (
          <Button
            key={action.key}
            variant={action.variant as any || "outline"}
            size="sm"
            onClick={() => action.onClick(selectedItems)}
            disabled={action.disabled?.(selectedItems) || !selectionStats.hasSelection}
            className="flex items-center space-x-1"
          >
            {action.icon}
            <span>{action.label}</span>
          </Button>
        ))}

        {/* Overflow Actions */}
        {overflowActions.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                size="sm"
                disabled={!selectionStats.hasSelection}
                className="flex items-center space-x-1"
              >
                <MoreHorizontal className="h-4 w-4" />
                <span>More</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {overflowActions.map((action, index) => (
                <React.Fragment key={action.key}>
                  <DropdownMenuItem
                    onClick={() => action.onClick(selectedItems)}
                    disabled={action.disabled?.(selectedItems)}
                    className="flex items-center space-x-2"
                  >
                    {action.icon}
                    <span>{action.label}</span>
                  </DropdownMenuItem>
                  {index < overflowActions.length - 1 && action.variant === 'danger' && (
                    <DropdownMenuSeparator />
                  )}
                </React.Fragment>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Clear Selection */}
        {selectionStats.hasSelection && (
          <>
            <Separator orientation="vertical" className="h-4" />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearSelection}
              className="h-8 w-8 p-0 hover:bg-destructive/10"
            >
              <X className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>

      {/* Custom children */}
      {children}
    </div>
  );
};

// Convenience components for common scenarios
export const StudentBulkToolbar: React.FC<Omit<BulkActionToolbarProps, 'actions'> & {
  onExport?: (students: any[]) => void;
  onDelete?: (students: any[]) => void;
  onEmail?: (students: any[]) => void;
}> = ({ onExport, onDelete, onEmail, ...props }) => {
  const actions: TableAction[] = [
    ...(onExport ? [{
      key: 'export',
      label: 'Export',
      icon: <Download className="w-4 h-4" />,
      variant: 'secondary' as const,
      onClick: onExport,
    }] : []),
    ...(onEmail ? [{
      key: 'email',
      label: 'Send Email',
      icon: <Mail className="w-4 h-4" />,
      variant: 'secondary' as const,
      onClick: onEmail,
    }] : []),
    ...(onDelete ? [{
      key: 'delete',
      label: 'Delete',
      icon: <Trash2 className="w-4 h-4" />,
      variant: 'danger' as const,
      onClick: onDelete,
    }] : []),
  ];

  return <BulkActionToolbar actions={actions} {...props} />;
};

export const AttendanceBulkToolbar: React.FC<Omit<BulkActionToolbarProps, 'actions'> & {
  onMarkPresent?: (records: any[]) => void;
  onMarkAbsent?: (records: any[]) => void;
  onExport?: (records: any[]) => void;
}> = ({ onMarkPresent, onMarkAbsent, onExport, ...props }) => {
  const actions: TableAction[] = [
    ...(onMarkPresent ? [{
      key: 'mark-present',
      label: 'Mark Present',
      icon: <CheckSquare className="w-4 h-4" />,
      variant: 'success' as const,
      onClick: onMarkPresent,
    }] : []),
    ...(onMarkAbsent ? [{
      key: 'mark-absent',
      label: 'Mark Absent',
      icon: <X className="w-4 h-4" />,
      variant: 'destructive' as const,
      onClick: onMarkAbsent,
    }] : []),
    ...(onExport ? [{
      key: 'export',
      label: 'Export Report',
      icon: <Download className="w-4 h-4" />,
      variant: 'secondary' as const,
      onClick: onExport,
    }] : []),
  ];

  return <BulkActionToolbar actions={actions} {...props} />;
};

BulkActionToolbar.displayName = "BulkActionToolbar";

export default BulkActionToolbar; 