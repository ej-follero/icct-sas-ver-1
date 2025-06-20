import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { BadgeInfo, FileText, FileSpreadsheet } from "lucide-react";

interface ExportColumn {
  key: string;
  label: string;
}

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exportableColumns: ExportColumn[];
  exportColumns: string[];
  setExportColumns: (columns: string[]) => void;
  exportFormat: 'pdf' | 'excel' | 'csv' | null;
  setExportFormat: (format: 'pdf' | 'excel' | 'csv' | null) => void;
  onExport: () => void;
  title: string;
  tooltip: string;
}

export function ExportDialog({
  open,
  onOpenChange,
  exportableColumns,
  exportColumns,
  setExportColumns,
  exportFormat,
  setExportFormat,
  onExport,
  title,
  tooltip,
}: ExportDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-white/90 border border-blue-100 shadow-lg rounded-xl py-8 px-6">
        <DialogHeader>
          <DialogTitle className="text-blue-900 text-xl flex items-center gap-2 mb-6">
            {title}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="text-blue-400 cursor-pointer">
                    <BadgeInfo className="w-4 h-4" />
                  </span>
                </TooltipTrigger>
                <TooltipContent side="right" className="bg-blue-900 text-white">
                  {tooltip}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-8">
          {/* Export Format Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <h3 className="text-md font-semibold text-blue-900">Export Format</h3>
              </div>
            </div>
            <div className="h-px bg-blue-100 w-full mb-8"></div>
            <div className="grid grid-cols-3 gap-4 mt-6">
              <Button
                variant={exportFormat === 'pdf' ? "default" : "outline"}
                size="sm"
                className={`w-full flex flex-col items-center gap-1 py-3 ${exportFormat === 'pdf' ? 'bg-blue-600 hover:bg-blue-700' : 'hover:bg-blue-50'}`}
                onClick={() => setExportFormat('pdf')}
              >
                <FileText className="h-5 w-5 text-blue-700" />
                <span className="text-xs">PDF</span>
              </Button>
              <Button
                variant={exportFormat === 'excel' ? "default" : "outline"}
                size="sm"
                className={`w-full flex flex-col items-center gap-1 py-3 ${exportFormat === 'excel' ? 'bg-blue-600 hover:bg-blue-700' : 'hover:bg-blue-50'}`}
                onClick={() => setExportFormat('excel')}
              >
                <FileSpreadsheet className="h-5 w-5 text-blue-700" />
                <span className="text-xs">Excel</span>
              </Button>
              <Button
                variant={exportFormat === 'csv' ? "default" : "outline"}
                size="sm"
                className={`w-full flex flex-col items-center gap-1 py-3 ${exportFormat === 'csv' ? 'bg-blue-600 hover:bg-blue-700' : 'hover:bg-blue-50'}`}
                onClick={() => setExportFormat('csv')}
              >
                <FileSpreadsheet className="h-5 w-5 text-blue-700" />
                <span className="text-xs">CSV</span>
              </Button>
            </div>
          </div>

          {/* Export Options Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <h3 className="text-md font-semibold text-blue-900">Export Options</h3>
              </div>
            </div>
            <div className="h-px bg-blue-100 w-full mb-8"></div>
            <div className="space-y-6">
              {exportableColumns.map((column) => (
                <div key={column.key} className="flex items-center space-x-2">
                  <Checkbox
                    id={`export-${column.key}`}
                    checked={exportColumns.includes(column.key)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setExportColumns([...exportColumns, column.key]);
                      } else {
                        setExportColumns(exportColumns.filter((c) => c !== column.key));
                      }
                    }}
                    className="border-blue-200 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                  />
                  <Label
                    htmlFor={`export-${column.key}`}
                    className="text-sm text-blue-900 cursor-pointer"
                  >
                    {column.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter className="gap-4 mt-10">
          <Button
            variant="outline"
            onClick={() => {
              setExportFormat(null);
              setExportColumns(exportableColumns.map(col => col.key));
            }}
            className="w-32 border border-blue-300 text-blue-500"
          >
            Reset
          </Button>
          <Button 
            onClick={onExport}
            className="w-32 bg-blue-600 hover:bg-blue-700 text-white"
            disabled={!exportFormat}
          >
            Export
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 