import { Button } from "@/components/ui/button";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { RefreshCw, Filter, ArrowUpDown, Download, Printer } from "lucide-react";

interface TableActionsProps {
  onRefresh: () => void;
  onFilter: () => void;
  onSort: () => void;
  onExport: () => void;
  onPrint: () => void;
  isLoading?: boolean;
  className?: string;
}

export function TableActions({
  onRefresh,
  onFilter,
  onSort,
  onExport,
  onPrint,
  isLoading = false,
  className = "",
}: TableActionsProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            onClick={onRefresh}
            disabled={isLoading}
            className="hover:bg-blue-50"
          >
            <RefreshCw className={`h-4 w-4 text-blue-600 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Refresh</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            onClick={onFilter}
            className="hover:bg-blue-50"
          >
            <Filter className="h-4 w-4 text-blue-600" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Filter</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            onClick={onSort}
            className="hover:bg-blue-50"
          >
            <ArrowUpDown className="h-4 w-4 text-blue-600" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Sort</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            onClick={onExport}
            className="hover:bg-blue-50"
          >
            <Download className="h-4 w-4 text-blue-600" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Export</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            onClick={onPrint}
            className="hover:bg-blue-50"
          >
            <Printer className="h-4 w-4 text-blue-600" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Print</TooltipContent>
      </Tooltip>
    </div>
  );
} 