import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import TableSearch from "@/components/reusable/Search/TableSearch";
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
  searchPlaceholder = "Search...",
  searchTooltip = "Search by name, code, or other fields",
  columnOptions,
  visibleColumns,
  setVisibleColumns,
}: Omit<TableHeaderSectionProps, 'onRefresh' | 'isRefreshing' | 'onFilterClick' | 'onSortClick' | 'onExportClick' | 'onPrintClick' | 'onAddClick' | 'activeFilterCount' | 'addButtonLabel'>) {
  return (
    <div className="print:hidden">
      {/* Responsive header row for small screens */}
      <div className="flex flex-col gap-4 mb-6 lg:hidden">
        <div className="flex items-center justify-between w-full">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-bold text-blue-900">{title}</h1>
            <p className="text-sm text-blue-700/80">{description}</p>
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
        {/* Search bar for large screens */}
        <div className="flex flex-col gap-2 mt-2 w-full lg:w-auto">
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
        </div>
      </div>
    </div>
  );
} 