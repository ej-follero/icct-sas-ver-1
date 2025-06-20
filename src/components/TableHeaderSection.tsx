import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import TableSearch from "@/components/TableSearch";
import { Plus, Filter, SortAsc, Download, Printer, RefreshCw, Loader2, ViewIcon, ListTodo } from "lucide-react";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuCheckboxItem } from '@/components/ui/dropdown-menu';

interface TableHeaderSectionProps {
  title: string;
  description: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  onFilterClick: () => void;
  onSortClick: () => void;
  onExportClick: () => void;
  onPrintClick: () => void;
  onAddClick: () => void;
  activeFilterCount?: number;
  searchPlaceholder?: string;
  searchTooltip?: string;
  addButtonLabel?: string;
  columnOptions: { accessor: string; label: string }[];
  visibleColumns: string[];
  setVisibleColumns: React.Dispatch<React.SetStateAction<string[]>>;
}

export function TableHeaderSection({
  title,
  description,
  searchValue,
  onSearchChange,
  onRefresh,
  isRefreshing,
  onFilterClick,
  onSortClick,
  onExportClick,
  onPrintClick,
  onAddClick,
  activeFilterCount = 0,
  searchPlaceholder = "Search...",
  searchTooltip = "Search by name, code, or other fields",
  addButtonLabel = "Add",
  columnOptions,
  visibleColumns,
  setVisibleColumns,
}: TableHeaderSectionProps) {
  return (
    <div className="print:hidden">
      {/* Responsive header row for small screens */}
      <div className="flex flex-col gap-4 mb-6 lg:hidden">
        <div className="flex items-center justify-between w-full">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-bold text-blue-900">{title}</h1>
            <p className="text-sm text-blue-700/80">{description}</p>
          </div>
          {/* Controls: sort, filter, export, print, add */}
          <div className="flex flex-row gap-1 items-center">
            <TooltipProvider delayDuration={0}>
              {/* Refresh Button */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="rounded border-0 hover:bg-blue-50" 
                    aria-label="Refresh" 
                    onClick={onRefresh}
                    disabled={isRefreshing}
                  >
                    {isRefreshing ? (
                      <Loader2 className="h-4 w-4 text-blue-700 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4 text-blue-700" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="bg-blue-900 text-white">
                  Refresh
                </TooltipContent>
              </Tooltip>
              {/* Column Visibility (View) Icon */}
              <Tooltip>
                <DropdownMenu>
                  <TooltipTrigger asChild>
                    <DropdownMenuTrigger asChild>
                      <span className="inline-flex items-center cursor-pointer p-2 rounded hover:bg-blue-50" aria-label="Column visibility">
                        <ListTodo className="h-5 w-5 text-blue-700" />
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
              {/* Filter Button */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded border-0 hover:bg-blue-50" aria-label="Filter" onClick={onFilterClick}>
                    <Filter className="h-4 w-4 text-blue-700/70" />
                    {activeFilterCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full px-1.5 py-0.5">{activeFilterCount}</span>
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="bg-blue-900 text-white">
                  Filter
                </TooltipContent>
              </Tooltip>
              {/* Sort Button */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded border-0 hover:bg-blue-50" aria-label="Sort" onClick={onSortClick}>
                    <SortAsc className="h-4 w-4 text-blue-700" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="bg-blue-900 text-white">
                  Sort
                </TooltipContent>
              </Tooltip>
              {/* Export Button */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded border-0 hover:bg-blue-50" aria-label="Export" onClick={onExportClick}>
                    <Download className="h-4 w-4 text-blue-700" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="bg-blue-900 text-white">
                  Export
                </TooltipContent>
              </Tooltip>
              {/* Print Button */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label="Print" onClick={onPrintClick}>
                    <Printer className="h-4 w-4 text-blue-700" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="bg-blue-900 text-white">
                  Print
                </TooltipContent>
              </Tooltip>
              {/* Add Button (icon only) */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="default" size="icon" className="bg-blue-700 hover:bg-blue-800 text-white shadow ml-1" aria-label="Add" onClick={onAddClick}>
                    <Plus className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="bg-blue-900 text-white">
                  Create new
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
        {/* Search bar for small screens */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <TableSearch 
                  value={searchValue} 
                  onChange={onSearchChange} 
                  placeholder={searchPlaceholder} 
                  className="h-10 w-full px-3 rounded-full shadow-sm border border-blue-200 focus:border-blue-400 focus:ring-blue-400 mt-2" 
                />
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="bg-blue-900 text-white">
              {searchTooltip}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      {/* Existing layout for large screens and up */}
      <div className="hidden lg:block relative flex flex-col gap-4 mb-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-blue-900">{title}</h1>
          <p className="text-sm text-blue-700/80">{description}</p>
        </div>
        {/* Controls: stacked below label on mobile, absolutely right-aligned on lg+ */}
        <div className="flex flex-col gap-2 mt-2 w-full lg:absolute lg:right-0 lg:top-0 lg:flex-row lg:items-center lg:justify-end lg:w-auto">
          <div className="flex items-center gap-2">
            <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <TableSearch 
                        value={searchValue} 
                        onChange={onSearchChange} 
                        placeholder={searchPlaceholder} 
                        className="h-10 w-full sm:w-64 px-3 rounded-full shadow-sm border border-blue-200 focus:border-blue-400 focus:ring-blue-400" 
                      />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="bg-blue-900 text-white">
                    {searchTooltip}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <div className="flex flex-row gap-0 rounded-lg shadow-sm overflow-hidden">
                <TooltipProvider delayDuration={0}>
                  {/* Refresh Button */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="rounded-none border-0 hover:bg-blue-50" 
                        aria-label="Refresh" 
                        onClick={onRefresh}
                        disabled={isRefreshing}
                      >
                        {isRefreshing ? (
                          <Loader2 className="h-4 w-4 text-blue-700 animate-spin" />
                        ) : (
                          <RefreshCw className="h-4 w-4 text-blue-700" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="bg-blue-900 text-white">
                      Refresh list
                    </TooltipContent>
                  </Tooltip>
                  {/* Column Visibility (View) Icon */}
                  <Tooltip>
                    <DropdownMenu>
                      <TooltipTrigger asChild>
                        <DropdownMenuTrigger asChild>
                          <span className="inline-flex items-center cursor-pointer p-2 rounded hover:bg-blue-50" aria-label="Column visibility">
                            <ListTodo className="h-5 w-5 text-blue-700" />
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
                  {/* Filter Button */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="rounded-none border-0 hover:bg-blue-50" aria-label="Filter" onClick={onFilterClick}>
                        <Filter className="h-4 w-4 text-blue-700/70" />
                        {activeFilterCount > 0 && (
                          <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full px-1.5 py-0.5">{activeFilterCount}</span>
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="bg-blue-900 text-white">
                      Filter
                    </TooltipContent>
                  </Tooltip>
                  {/* Sort Button */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="rounded-none border-0 hover:bg-blue-50" aria-label="Sort" onClick={onSortClick}>
                        <SortAsc className="h-4 w-4 text-blue-700" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="bg-blue-900 text-white">
                      Sort
                    </TooltipContent>
                  </Tooltip>
                  {/* Export Button */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="rounded-none border-0 hover:bg-blue-50" aria-label="Export" onClick={onExportClick}>
                        <Download className="h-4 w-4 text-blue-700" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="bg-blue-900 text-white">
                      Export
                    </TooltipContent>
                  </Tooltip>
                  {/* Print Button */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" aria-label="Print" onClick={onPrintClick}>
                        <Printer className="h-4 w-4 text-blue-700" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="bg-blue-900 text-white">
                      Print
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
            <div className="h-8 border-l border-blue-200 mx-2"></div>
            {/* Add Button */}
            <Button variant="default" size="sm" className="bg-blue-700 hover:bg-blue-800 text-white shadow-md w-full sm:w-auto" onClick={onAddClick}>
              <Plus className="h-4 w-4 mr-2" />
              {addButtonLabel}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 