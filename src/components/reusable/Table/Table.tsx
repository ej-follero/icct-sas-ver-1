"use client";

import React, { useState, useMemo, useCallback } from 'react';
import { ChevronDown, ChevronUp, MoreHorizontal, Search, Filter } from 'lucide-react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  BaseComponentProps, 
  Column, 
  TableAction, 
  BulkActionConfig,
  PaginationConfig 
} from '../types';

// Table variants
const tableVariants = cva(
  "w-full border-collapse border border-border rounded-lg overflow-hidden",
  {
    variants: {
      size: {
        sm: "text-sm",
        md: "text-base",
        lg: "text-lg",
      },
      striped: {
        true: "[&_tbody_tr:nth-child(even)]:bg-muted/50",
        false: "",
      },
    },
    defaultVariants: {
      size: "md",
      striped: false,
    },
  }
);

// Component Props
export interface DataTableProps<T = any> 
  extends BaseComponentProps, 
          VariantProps<typeof tableVariants> {
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
  selectable?: boolean;
  selectedRows?: T[];
  onSelectionChange?: (selectedRows: T[]) => void;
  sortable?: boolean;
  searchable?: boolean;
  filterable?: boolean;
  pagination?: PaginationConfig;
  bulkActions?: BulkActionConfig<T>;
  rowActions?: TableAction<T>[];
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
  getRowId?: (row: T) => string | number;
}

// Subcomponents
const TableHeader: React.FC<{
  columns: Column[];
  sortable: boolean;
  selectable: boolean;
  sortField: string | null;
  sortDirection: 'asc' | 'desc';
  onSort: (field: string) => void;
  allSelected: boolean;
  onSelectAll: (selected: boolean) => void;
}> = ({
  columns,
  sortable,
  selectable,
  sortField,
  sortDirection,
  onSort,
  allSelected,
  onSelectAll
}) => (
  <thead className="bg-muted/50 border-b border-border">
    <tr>
      {selectable && (
        <th className="w-10 p-3 text-left">
          <Checkbox
            checked={allSelected}
            onCheckedChange={onSelectAll}
            aria-label="Select all rows"
          />
        </th>
      )}
      {columns.map((column) => (
        <th
          key={column.key}
          className={cn(
            "p-3 text-left font-medium text-muted-foreground",
            column.sortable && sortable && "cursor-pointer hover:text-foreground",
            column.width && `w-[${column.width}]`,
            column.align === 'center' && "text-center",
            column.align === 'right' && "text-right"
          )}
          onClick={() => column.sortable && sortable && onSort(column.key)}
          style={{ width: column.width }}
        >
          <div className="flex items-center space-x-1">
            <span>{column.header}</span>
            {column.sortable && sortable && (
              <div className="flex flex-col">
                {sortField === column.key ? (
                  sortDirection === 'asc' ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )
                ) : (
                  <ChevronDown className="h-4 w-4 opacity-30" />
                )}
              </div>
            )}
          </div>
        </th>
      ))}
      <th className="w-10 p-3"></th> {/* Actions column */}
    </tr>
  </thead>
);

const TableRow: React.FC<{
  row: any;
  columns: Column[];
  selectable: boolean;
  selected: boolean;
  onSelect: (selected: boolean) => void;
  onRowClick?: (row: any) => void;
  rowActions?: TableAction[];
}> = ({ row, columns, selectable, selected, onSelect, onRowClick, rowActions }) => (
  <tr 
    className={cn(
      "border-b border-border hover:bg-muted/30 transition-colors",
      onRowClick && "cursor-pointer"
    )}
    onClick={() => onRowClick?.(row)}
  >
    {selectable && (
      <td className="p-3" onClick={(e) => e.stopPropagation()}>
        <Checkbox
          checked={selected}
          onCheckedChange={onSelect}
          aria-label="Select row"
        />
      </td>
    )}
    {columns.map((column) => {
      const value = typeof column.accessor === 'function' 
        ? column.accessor(row) 
        : row[column.accessor];
      
      return (
        <td
          key={column.key}
          className={cn(
            "p-3",
            column.align === 'center' && "text-center",
            column.align === 'right' && "text-right"
          )}
        >
          {column.render ? column.render(value, row) : value}
        </td>
      );
    })}
    <td className="p-3" onClick={(e) => e.stopPropagation()}>
      {rowActions && rowActions.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {rowActions.map((action) => (
              <DropdownMenuItem
                key={action.key}
                onClick={() => action.onClick([row])}
                disabled={action.disabled?.([row])}
                className="flex items-center space-x-2"
              >
                {action.icon}
                <span>{action.label}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </td>
  </tr>
);

const TableToolbar: React.FC<{
  searchable: boolean;
  searchValue: string;
  onSearchChange: (value: string) => void;
  selectedCount: number;
  bulkActions?: BulkActionConfig<any>;
}> = ({ searchable, searchValue, onSearchChange, selectedCount, bulkActions }) => (
  <div className="flex items-center justify-between p-4 border-b border-border bg-background">
    <div className="flex items-center space-x-2">
      {searchable && (
        <div className="relative">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search..."
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-8 w-64"
          />
        </div>
      )}
    </div>
    
    {selectedCount > 0 && bulkActions && (
      <div className="flex items-center space-x-2">
        <span className="text-sm text-muted-foreground">
          {selectedCount} selected
        </span>
        {bulkActions.actions.map((action) => (
          <Button
            key={action.key}
            variant={action.variant as any || "outline"}
            size="sm"
            onClick={() => action.onClick(bulkActions.selectedItems)}
            disabled={action.disabled?.(bulkActions.selectedItems)}
            className="flex items-center space-x-1"
          >
            {action.icon}
            <span>{action.label}</span>
          </Button>
        ))}
      </div>
    )}
  </div>
);

const LoadingRow: React.FC<{ columnCount: number }> = ({ columnCount }) => (
  <tr>
    {Array.from({ length: columnCount }, (_, index) => (
      <td key={index} className="p-3">
        <div className="h-4 bg-muted animate-pulse rounded" />
      </td>
    ))}
  </tr>
);

// Main DataTable Component
const DataTable = <T extends Record<string, any>>({
  className,
  testId,
  size,
  striped,
  data,
  columns,
  loading = false,
  selectable = false,
  selectedRows = [],
  onSelectionChange,
  sortable = true,
  searchable = false,
  filterable = false,
  pagination,
  bulkActions,
  rowActions,
  onRowClick,
  emptyMessage = "No data available",
  getRowId = (row: T) => row.id || row.key || JSON.stringify(row),
}: DataTableProps<T>) => {
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [searchValue, setSearchValue] = useState('');

  // Memoized processed data
  const processedData = useMemo(() => {
    let result = [...data];

    // Search filtering
    if (searchable && searchValue) {
      result = result.filter((row) =>
        columns.some((column) => {
          const value = typeof column.accessor === 'function' 
            ? column.accessor(row) 
            : row[column.accessor];
          return String(value).toLowerCase().includes(searchValue.toLowerCase());
        })
      );
    }

    // Sorting
    if (sortable && sortField) {
      const column = columns.find(col => col.key === sortField);
      if (column) {
        result.sort((a, b) => {
          const aValue = typeof column.accessor === 'function' 
            ? column.accessor(a) 
            : a[column.accessor];
          const bValue = typeof column.accessor === 'function' 
            ? column.accessor(b) 
            : b[column.accessor];
          
          const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
          return sortDirection === 'asc' ? comparison : -comparison;
        });
      }
    }

    return result;
  }, [data, columns, searchValue, sortField, sortDirection, searchable, sortable]);

  // Selection handlers
  const handleSort = useCallback((field: string) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  }, [sortField]);

  const handleSelectAll = useCallback((selected: boolean) => {
    if (onSelectionChange) {
      onSelectionChange(selected ? processedData : []);
    }
  }, [processedData, onSelectionChange]);

  const handleRowSelect = useCallback((row: T, selected: boolean) => {
    if (onSelectionChange) {
      const rowId = getRowId(row);
      if (selected) {
        onSelectionChange([...selectedRows, row]);
      } else {
        onSelectionChange(selectedRows.filter(r => getRowId(r) !== rowId));
      }
    }
  }, [selectedRows, onSelectionChange, getRowId]);

  const isRowSelected = useCallback((row: T) => {
    const rowId = getRowId(row);
    return selectedRows.some(r => getRowId(r) === rowId);
  }, [selectedRows, getRowId]);

  const allSelected = processedData.length > 0 && processedData.every(isRowSelected);
  const columnCount = columns.length + (selectable ? 1 : 0) + 1; // +1 for actions

  return (
    <div className={cn("border border-border rounded-lg bg-background", className)} data-testid={testId}>
      {/* Toolbar */}
      {(searchable || (selectedRows.length > 0 && bulkActions)) && (
        <TableToolbar
          searchable={searchable}
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          selectedCount={selectedRows.length}
          bulkActions={bulkActions}
        />
      )}

      {/* Table */}
      <table className={cn(tableVariants({ size, striped }))}>
        <TableHeader
          columns={columns}
          sortable={sortable}
          selectable={selectable}
          sortField={sortField}
          sortDirection={sortDirection}
          onSort={handleSort}
          allSelected={allSelected}
          onSelectAll={handleSelectAll}
        />
        <tbody>
          {loading ? (
            Array.from({ length: 5 }, (_, index) => (
              <LoadingRow key={index} columnCount={columnCount} />
            ))
          ) : processedData.length === 0 ? (
            <tr>
              <td colSpan={columnCount} className="p-8 text-center text-muted-foreground">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            processedData.map((row) => (
              <TableRow
                key={getRowId(row)}
                row={row}
                columns={columns}
                selectable={selectable}
                selected={isRowSelected(row)}
                onSelect={(selected) => handleRowSelect(row, selected)}
                onRowClick={onRowClick}
                rowActions={rowActions}
              />
            ))
          )}
        </tbody>
      </table>

      {/* Pagination would go here if implemented */}
    </div>
  );
};

export default DataTable; 