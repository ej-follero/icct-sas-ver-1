import React, { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Eye, EyeOff, Check, X, Lock, ArrowDownAZ, ArrowUpZA } from "lucide-react";
import SelectDropdown from '@/components/SelectDropdown';

export interface ColumnOption {
  accessor: string;
  header: string | React.ReactNode;
  description?: string;
  category?: string;
  required?: boolean;
}

export interface ManualSelectionState {
  selectedColumns: string[];
  isSelecting: boolean;
}

interface VisibleColumnsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  columns: ColumnOption[];
  visibleColumns: string[];
  onColumnToggle: (columnAccessor: string, checked: boolean) => void;
  onSelectAll?: () => void;
  onSelectNone?: () => void;
  onReset?: () => void;
  title?: string;
  description?: string;
  searchPlaceholder?: string;
  enableManualSelection?: boolean;
  onManualSelectionChange?: (state: ManualSelectionState) => void;
}

function VisibleColumnsDialog({
  open,
  onOpenChange,
  columns,
  visibleColumns,
  onColumnToggle,
  onSelectAll,
  onSelectNone,
  onReset,
  title = "Manage Visible Columns",
  description = "Choose which columns to display in the table",
  searchPlaceholder = "Search columns...",
  enableManualSelection = false,
  onManualSelectionChange
}: VisibleColumnsDialogProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [manualSelection, setManualSelection] = useState<ManualSelectionState>({
    selectedColumns: [],
    isSelecting: false
  });
  const [sortAsc, setSortAsc] = useState(true);

  // Get unique categories
  const categories = useMemo(() => {
    const cats = columns
      .map(col => col.category)
      .filter(Boolean) as string[];
    return ["all", ...Array.from(new Set(cats))];
  }, [columns]);

  // Filter columns based on search and category
  const filteredColumns = useMemo(() => {
    return columns.filter(column => {
      const matchesSearch = searchTerm === "" || 
        (typeof column.header === 'string' ? 
          column.header.toLowerCase().includes(searchTerm.toLowerCase()) :
          column.accessor.toLowerCase().includes(searchTerm.toLowerCase())
        ) ||
        (column.description && column.description.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesCategory = selectedCategory === "all" || column.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [columns, searchTerm, selectedCategory]);

  // Sort filteredColumns by header (A-Z or Z-A)
  const sortedFilteredColumns = useMemo(() => {
    const sorted = [...filteredColumns];
    sorted.sort((a, b) => {
      const aHeader = typeof a.header === 'string' ? a.header : a.accessor;
      const bHeader = typeof b.header === 'string' ? b.header : b.accessor;
      return sortAsc ? aHeader.localeCompare(bHeader) : bHeader.localeCompare(aHeader);
    });
    return sorted;
  }, [filteredColumns, sortAsc]);

  // Group columns by category
  const groupedColumns = useMemo(() => {
    const groups: Record<string, ColumnOption[]> = {};
    
    filteredColumns.forEach(column => {
      const category = column.category || "General";
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(column);
    });
    
    return groups;
  }, [filteredColumns]);

  const handleSelectAll = () => {
    filteredColumns.forEach(column => {
      if (!visibleColumns.includes(column.accessor)) {
        onColumnToggle(column.accessor, true);
      }
    });
  };

  const handleSelectNone = () => {
    filteredColumns.forEach(column => {
      if (visibleColumns.includes(column.accessor) && !column.required) {
        onColumnToggle(column.accessor, false);
      }
    });
  };

  const handleSelectVisible = () => {
    filteredColumns.forEach(column => {
      if (visibleColumns.includes(column.accessor)) {
        onColumnToggle(column.accessor, false);
      }
    });
  };

  const handleSelectHidden = () => {
    filteredColumns.forEach(column => {
      if (!visibleColumns.includes(column.accessor) && !column.required) {
        onColumnToggle(column.accessor, true);
      }
    });
  };

  const handleReset = () => {
    onReset?.();
  };

  const handleManualSelectionToggle = () => {
    const newState = {
      ...manualSelection,
      isSelecting: !manualSelection.isSelecting,
      selectedColumns: !manualSelection.isSelecting ? [] : manualSelection.selectedColumns
    };
    setManualSelection(newState);
    onManualSelectionChange?.(newState);
  };

  const handleManualColumnToggle = (columnAccessor: string, checked: boolean) => {
    const newSelectedColumns = checked
      ? [...manualSelection.selectedColumns, columnAccessor]
      : manualSelection.selectedColumns.filter(col => col !== columnAccessor);
    
    const newState = {
      ...manualSelection,
      selectedColumns: newSelectedColumns
    };
    setManualSelection(newState);
    onManualSelectionChange?.(newState);
  };

  const handleApplyManualSelection = () => {
    // Apply the manual selection to visible columns
    manualSelection.selectedColumns.forEach(columnAccessor => {
      if (!visibleColumns.includes(columnAccessor)) {
        onColumnToggle(columnAccessor, true);
      }
    });
    
    // Hide columns that are not in manual selection (except required ones)
    filteredColumns.forEach(column => {
      if (!manualSelection.selectedColumns.includes(column.accessor) && 
          visibleColumns.includes(column.accessor) && 
          !column.required) {
        onColumnToggle(column.accessor, false);
      }
    });
    
    // Exit manual selection mode
    const newState = { selectedColumns: [], isSelecting: false };
    setManualSelection(newState);
    onManualSelectionChange?.(newState);
  };

  // Count visible columns: required columns are always visible, plus any non-required columns that are visible
  const requiredCount = columns.filter(col => col.required).length;
  const nonRequiredVisibleCount = visibleColumns.filter(accessor => {
    const col = columns.find(c => c.accessor === accessor);
    return col && !col.required;
  }).length;
  const visibleCount = requiredCount + nonRequiredVisibleCount;
  const totalCount = columns.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] rounded-xl overflow-hidden flex flex-col p-0">
        {/* Blue Gradient Header */}
        <div className="bg-gradient-to-r from-[#1e40af] to-[#3b82f6] p-6 rounded-t-xl -m-6 -mt-6 relative">
          <div className="flex items-center gap-3 pl-4 pr-4 pt-6 pb-2">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <Eye className="w-5 h-5 text-white" />
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
          <div className="absolute right-2 top-1/2 -translate-y-1/2 p-8">
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-full hover:bg-white/20 text-white p-2"
              onClick={() => onOpenChange(false)}
              aria-label="Close dialog"
            >
              <X className="h-6 w-6" />
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-3 flex-1 min-h-0 p-4 mt-4">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-400" />
              <Input
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 h-8 text-sm"
              />
            </div>
            
            {/* Category Filter */}
            {categories.length > 1 && (
              <SelectDropdown
                value={selectedCategory}
                onValueChange={setSelectedCategory}
                options={categories.map(category => ({ value: category, label: category === 'all' ? 'All Categories' : category }))}
                placeholder="All Categories"
                className="h-8 text-xs w-40"
              />
            )}
          </div>

          {/* Select All Checkbox and Sort Toggle */}
          <div className="flex items-center gap-4 mb-2 justify-end">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={sortedFilteredColumns.every(col => visibleColumns.includes(col.accessor) || col.required)}
                indeterminate={sortedFilteredColumns.some(col => visibleColumns.includes(col.accessor)) && !sortedFilteredColumns.every(col => visibleColumns.includes(col.accessor) || col.required)}
                onCheckedChange={(checked) => {
                  if (checked) {
                    sortedFilteredColumns.forEach(col => {
                      if (!visibleColumns.includes(col.accessor)) {
                        onColumnToggle(col.accessor, true);
                      }
                    });
                  } else {
                    sortedFilteredColumns.forEach(col => {
                      if (visibleColumns.includes(col.accessor) && !col.required) {
                        onColumnToggle(col.accessor, false);
                      }
                    });
                  }
                }}
                className="text-blue-600 focus:ring-blue-500 w-4 h-4"
              />
              <span className="text-sm font-medium text-blue-900 select-none">Select All</span>
            </div>
            <button
              type="button"
              className="flex items-center gap-1 px-2 py-1 rounded hover:bg-blue-100 transition"
              onClick={() => setSortAsc((prev) => !prev)}
              aria-label={sortAsc ? 'Sort descending' : 'Sort ascending'}
            >
              {sortAsc ? <ArrowDownAZ className="w-4 h-4 text-blue-600" /> : <ArrowUpZA className="w-4 h-4 text-blue-600" />}
              <span className="text-xs text-blue-900 font-semibold">Sort {sortAsc ? 'A-Z' : 'Z-A'}</span>
            </button>
          </div>

          {/* Columns List */}
          <div className="flex-1 overflow-y-auto border border-gray-200 rounded p-3 space-y-3">
            {Object.entries(groupedColumns).map(([category, categoryColumns]) => (
              <div key={category} className="space-y-2">
                {categories.length > 1 && (
                  <h4 className="font-semibold text-gray-700 text-xs uppercase tracking-wide border-b border-gray-200 pb-1">
                    {category}
                  </h4>
                )}
                
                <div className="flex flex-col gap-2">
                  {sortedFilteredColumns
                    .filter(col => (col.category || 'General') === category)
                    .map((column) => {
                    const isVisible = visibleColumns.includes(column.accessor);
                    const isRequired = column.required;
                    const headerText = typeof column.header === 'string' ? column.header : column.accessor;
                    return (
                      <div
                        key={column.accessor}
                        className={`flex items-center justify-between p-3 rounded-lg border transition-all duration-200 shadow-sm ${
                          isVisible
                            ? 'bg-blue-50 border-blue-200'
                            : 'bg-gray-50 border-gray-200'
                        } ${
                          isRequired
                            ? 'opacity-90 border-l-4 border-blue-400 bg-blue-100 cursor-not-allowed'
                            : 'hover:bg-blue-100 hover:shadow-md cursor-pointer'
                        }`}
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <span className="relative group flex items-center">
                            <Checkbox
                              checked={isRequired ? true : (manualSelection.isSelecting ? manualSelection.selectedColumns.includes(column.accessor) : isVisible)}
                              onCheckedChange={(checked) => {
                                if (manualSelection.isSelecting) {
                                  handleManualColumnToggle(column.accessor, checked as boolean);
                                } else {
                                  onColumnToggle(column.accessor, checked as boolean);
                                }
                              }}
                              disabled={isRequired}
                              className={`text-blue-600 focus:ring-blue-500 w-4 h-4 mt-0.5 ${isRequired ? 'cursor-not-allowed' : ''}`}
                            />
                            {isRequired && (
                              <>
                                <Lock className="w-4 h-4 text-blue-400 ml-2 inline-block align-middle" />
                                <span className="ml-1 text-xs text-blue-700 font-semibold bg-blue-200 rounded px-1.5 py-0.5">Required</span>
                                <span className="absolute left-8 top-1/2 -translate-y-1/2 bg-blue-900 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 whitespace-nowrap shadow-lg">
                                  This column is always visible and cannot be hidden.
                                </span>
                              </>
                            )}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-blue-900 truncate text-base">
                                {headerText}
                              </span>
                            </div>
                            {column.description && (
                              <p className="text-xs text-blue-700 mt-0.5">
                                {column.description}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {manualSelection.isSelecting ? (
                            manualSelection.selectedColumns.includes(column.accessor) ? (
                              <Check className="w-4 h-4 text-green-600" />
                            ) : (
                              <X className="w-4 h-4 text-gray-400" />
                            )
                          ) : (
                            isVisible ? (
                              <Eye className="w-4 h-4 text-blue-600" />
                            ) : (
                              <EyeOff className="w-4 h-4 text-gray-400" />
                            )
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
            
            {filteredColumns.length === 0 && (
              <div className="text-center py-6 text-gray-500">
                <EyeOff className="w-6 h-6 mx-auto mb-1 text-gray-300" />
                <p className="text-sm">No columns match your search criteria</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-200 px-4 pb-4">
          <div className="text-xs text-gray-600">
            {visibleCount} of {totalCount} columns visible
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-8 px-3 text-xs rounded"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => onOpenChange(false)}
              className="bg-blue-600 hover:bg-blue-700 h-8 px-3 text-xs rounded"
            >
              Apply Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export { VisibleColumnsDialog };
export default VisibleColumnsDialog; 