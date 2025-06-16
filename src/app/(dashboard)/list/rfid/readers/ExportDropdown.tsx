import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { FileDown, Settings } from "lucide-react";
import { DEFAULT_EXPORT_COLUMNS } from "./constants";

interface ExportDropdownProps {
  exportColumns: { key: string; label: string; checked: boolean }[];
  setExportColumns: (cols: { key: string; label: string; checked: boolean }[]) => void;
  handleExportToCSV: () => void;
  handleExportToExcel: () => void;
  handleExportToPDF: () => void;
}

export default function ExportDropdown({
  exportColumns,
  setExportColumns,
  handleExportToCSV,
  handleExportToExcel,
  handleExportToPDF,
}: ExportDropdownProps) {
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Columns
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <div className="px-3 py-2">
            <div className="text-xs font-semibold text-blue-700 mb-1">Show columns:</div>
            {exportColumns.map((col, i) => (
              <label key={col.key} className="flex items-center gap-2 text-xs mb-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={col.checked}
                  onChange={() => setExportColumns(exportColumns.map((c, j) => j === i ? { ...c, checked: !c.checked } : c))}
                />
                {col.label}
              </label>
            ))}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="flex items-center gap-2">
            <FileDown className="h-4 w-4" />
            Export
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <div className="px-3 py-2 border-b border-blue-100">
            <div className="text-xs font-semibold text-blue-700 mb-1">Columns to export:</div>
            {exportColumns.map((col, i) => (
              <label key={col.key} className="flex items-center gap-2 text-xs mb-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={col.checked}
                  onChange={() => setExportColumns(exportColumns.map((c, j) => j === i ? { ...c, checked: !c.checked } : c))}
                />
                {col.label}
              </label>
            ))}
          </div>
          <DropdownMenuItem onClick={handleExportToCSV}>Export as CSV</DropdownMenuItem>
          <DropdownMenuItem onClick={handleExportToExcel}>Export as Excel</DropdownMenuItem>
          <DropdownMenuItem onClick={handleExportToPDF}>Export as PDF</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
} 