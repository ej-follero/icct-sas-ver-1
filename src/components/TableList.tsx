import React from "react";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, ChevronDown, ChevronRight, ChevronUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

export interface TableListColumn<T> {
  header: React.ReactNode;
  accessor: keyof T | string;
  className?: string;
  render?: (item: T, rowIndex: number) => React.ReactNode;
  sortable?: boolean;
  expandedContent?: (item: T) => React.ReactNode;
}

interface TableListProps<T> {
  columns: TableListColumn<T>[];
  data: T[];
  loading?: boolean;
  emptyMessage?: React.ReactNode;
  selectedIds?: string[];
  onSelectRow?: (id: string) => void;
  onSelectAll?: () => void;
  isAllSelected?: boolean;
  isIndeterminate?: boolean;
  getItemId?: (item: T) => string;
  className?: string;
  expandedRowIds?: string[];
  onToggleExpand?: (itemId: string) => void;
  editingCell?: { rowId: string; columnAccessor: string; } | null;
  onCellClick?: (item: T, columnAccessor: string) => void;
  onCellChange?: (rowId: string, columnAccessor: string, value: any) => void;
  sortState?: { field: string; order: 'asc' | 'desc' } | null;
  onSort?: (accessor: string) => void;
}

export function TableList<T>({
  columns,
  data,
  loading = false,
  emptyMessage = "No data found.",
  selectedIds = [],
  onSelectRow,
  onSelectAll,
  isAllSelected = false,
  isIndeterminate = false,
  getItemId = (item: any) => item.id,
  className = "",
  expandedRowIds = [],
  onToggleExpand,
  editingCell,
  onCellClick,
  onCellChange,
  sortState,
  onSort,
}: TableListProps<T>) {
  return (
    <div className={`overflow-x-auto border border-blue-100 bg-white/70 shadow-md relative ${className}`}>
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((col, i) => (
              <TableHead
                key={`header-${String(col.accessor)}-${i}`}
                className={`bg-blue-50 text-blue-900 font-semibold text-sm border-b border-blue-100 ${col.className || ''}`}
              >
                {col.sortable && onSort ? (
                  <button className="flex items-center gap-2" onClick={() => onSort(col.accessor as string)}>
                    {col.header}
                    {sortState && sortState.field === col.accessor ? (
                      sortState.order === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronUp className="h-4 w-4 text-gray-300" />
                    )}
                  </button>
                ) : col.accessor === 'select' && onSelectAll ? (
                  <Checkbox
                    checked={isAllSelected}
                    indeterminate={isIndeterminate}
                    onCheckedChange={onSelectAll}
                    aria-label="Select all rows"
                  />
                ) : (
                  col.header
                )}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            // Skeleton loader for table rows
            Array.from({ length: 5 }).map((_, idx) => (
              <TableRow key={`skeleton-row-${idx}`}>
                {columns.map((col, colIdx) => (
                  <TableCell key={`skeleton-cell-${idx}-${colIdx}`}>
                    <Skeleton className="h-5 w-full" />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : data.length > 0 ? (
            data.map((item, rowIndex) => {
              const itemId = getItemId(item);
              const isExpanded = expandedRowIds.includes(itemId);
              return (
              <React.Fragment key={`row-fragment-${itemId}`}>
              <TableRow key={`row-${itemId}`}>
                {columns.map((col, colIdx) => {
                  const cellKey = `cell-${itemId}-${String(col.accessor)}-${colIdx}`;
                  const isEditing = editingCell?.rowId === itemId && editingCell?.columnAccessor === col.accessor;

                  if (col.accessor === 'expander' && onToggleExpand) {
                    return (
                      <TableCell key={cellKey} className="w-12 text-center">
                        <button onClick={() => onToggleExpand(itemId)} className="p-1 rounded-full hover:bg-gray-200">
                          {isExpanded ? <ChevronDown size={16} className="text-blue-500" /> : <ChevronRight size={16} className="text-blue-500" />}
                        </button>
                      </TableCell>
                    );
                  }
                  if (col.accessor === 'select' && onSelectRow) {
                    return (
                      <TableCell key={cellKey} className="text-center align-middle">
                        <Checkbox
                          checked={selectedIds.includes(itemId)}
                          onCheckedChange={() => onSelectRow(itemId)}
                          aria-label={`Select row ${itemId}`}
                        />
                      </TableCell>
                    );
                  }
                  return (
                    <TableCell 
                      key={cellKey} 
                      className={`text-blue-900 ${col.className || ''}`}
                      onClick={() => onCellClick && onCellClick(item, col.accessor as string)}
                    >
                      {isEditing && onCellChange ? (
                        <Input
                          autoFocus
                          defaultValue={item[col.accessor as keyof T] as any}
                          onBlur={(e) => onCellChange(itemId, col.accessor as string, e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              onCellChange(itemId, col.accessor as string, (e.target as HTMLInputElement).value);
                            }
                            if (e.key === 'Escape') {
                              onCellChange(itemId, col.accessor as string, item[col.accessor as keyof T]);
                            }
                          }}
                        />
                      ) : col.render ? (
                        col.render(item, rowIndex)
                      ) : (
                        item[col.accessor as keyof T] as React.ReactNode
                      )}
                    </TableCell>
                  );
                })}
              </TableRow>
              {isExpanded &&
                (() => {
                  const expanderCol = columns.find(col => col.accessor === 'expander');
                  if (expanderCol && expanderCol.expandedContent) {
                    return (
                      <TableRow key={`expanded-row-${itemId}`}>
                        {expanderCol.expandedContent(item)}
                      </TableRow>
                    );
                  }
                  return null;
                })()
              }
              </React.Fragment>
            )})
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="text-center py-8 text-blue-400">
                {emptyMessage}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
} 