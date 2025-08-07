import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import TableSearch from "@/components/reusable/Search/TableSearch";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuCheckboxItem } from '@/components/ui/dropdown-menu';
import React from "react";

export interface StickyHeaderAction {
  key: string;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  tooltip?: string;
  disabled?: boolean;
  badgeCount?: number;
  variant?: "default" | "ghost" | "outline" | "destructive";
  show?: boolean;
}

interface StickyHeaderProps {
  title: string;
  description?: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  actions: StickyHeaderAction[];
  searchPlaceholder?: string;
  columnOptions?: { accessor: string; label: string }[];
  visibleColumns?: string[];
  setVisibleColumns?: React.Dispatch<React.SetStateAction<string[]>>;
  className?: string;
}

export const StickyHeader: React.FC<StickyHeaderProps> = ({
  title,
  description,
  searchValue,
  onSearchChange,
  actions,
  searchPlaceholder = "Search...",
  columnOptions = [],
  visibleColumns = [],
  setVisibleColumns,
  className = "",
}) => {
  return (
    <div className={`sticky top-0 z-20 bg-white/90 print:hidden shadow-sm border-b border-blue-100 mb-4 ${className}`}> 
      <div className="flex flex-col gap-4 px-4 py-3">
        <div className="flex items-center justify-between w-full gap-2 flex-wrap">
          <div className="flex flex-col gap-1 min-w-[180px]">
            <h1 className="text-2xl font-bold text-blue-900">{title}</h1>
            {description && <p className="text-sm text-blue-700/80">{description}</p>}
          </div>
          <div className="flex flex-row gap-1 items-center flex-wrap">
            <TooltipProvider delayDuration={0}>
              {actions.map(action => action.show !== false && (
                <Tooltip key={action.key}>
                  <TooltipTrigger asChild>
                    <Button 
                      variant={action.variant || "ghost"}
                      size="icon"
                      className="rounded border-0 hover:bg-blue-50 relative"
                      aria-label={action.label}
                      onClick={action.onClick}
                      disabled={action.disabled}
                    >
                      {action.icon}
                      {action.badgeCount && action.badgeCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full px-1.5 py-0.5">{action.badgeCount}</span>
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="bg-blue-900 text-white">
                    {action.tooltip || action.label}
                  </TooltipContent>
                </Tooltip>
              ))}
              {columnOptions.length > 0 && setVisibleColumns && (
                <Tooltip>
                  <DropdownMenu>
                    <TooltipTrigger asChild>
                      <DropdownMenuTrigger asChild>
                        <span className="inline-flex items-center cursor-pointer p-2 rounded hover:bg-blue-50" aria-label="Column visibility">
                          <svg className="h-5 w-5 text-blue-700" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
                        </span>
                      </DropdownMenuTrigger>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="bg-blue-900 text-white">
                      <p>Column Visibility</p>
                    </TooltipContent>
                    <DropdownMenuContent>
                      {columnOptions.map((column) => (
                        <DropdownMenuCheckboxItem
                          key={column.accessor}
                          checked={visibleColumns.includes(column.accessor)}
                          onCheckedChange={(checked) => {
                            setVisibleColumns((prev: string[]) =>
                              checked
                                ? [...prev, column.accessor]
                                : prev.filter((id: string) => id !== column.accessor)
                            );
                          }}
                        >
                          {column.label}
                        </DropdownMenuCheckboxItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </Tooltip>
              )}
            </TooltipProvider>
          </div>
        </div>
        <div className="w-full max-w-xl">
          <TableSearch 
            value={searchValue} 
            onChange={onSearchChange} 
            placeholder={searchPlaceholder} 
            className="h-10 w-full px-3 rounded-full shadow-sm border border-blue-200 focus:border-blue-400 focus:ring-blue-400 mt-2" 
          />
        </div>
      </div>
    </div>
  );
}; 