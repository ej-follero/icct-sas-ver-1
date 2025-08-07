import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { BadgeInfo, FileText, FileSpreadsheet, Download, X, RotateCw } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEffect } from "react";

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
  pdfOrientation?: 'portrait' | 'landscape';
  setPdfOrientation?: (orientation: 'portrait' | 'landscape') => void;
  includeLogos?: boolean;
  setIncludeLogos?: (include: boolean) => void;
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
  pdfOrientation = 'portrait',
  setPdfOrientation,
  includeLogos = false,
  setIncludeLogos,
  onExport,
  title,
  tooltip,
}: ExportDialogProps) {
  
  // Handle dialog close with proper cleanup
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Reset focus to body when dialog closes
      setTimeout(() => {
        document.body.focus();
        // Remove any potential overlay issues
        const overlays = document.querySelectorAll('[data-radix-dialog-overlay]');
        overlays.forEach(overlay => {
          if (overlay instanceof HTMLElement) {
            overlay.style.pointerEvents = 'none';
          }
        });
      }, 100);
    }
    onOpenChange(newOpen);
  };

  // Cleanup effect when component unmounts or dialog closes
  useEffect(() => {
    if (!open) {
      // Ensure proper cleanup when dialog is closed
      const cleanup = () => {
        document.body.style.pointerEvents = 'auto';
        document.body.style.overflow = 'auto';
        // Remove any remaining focus traps
        const focusTraps = document.querySelectorAll('[data-radix-focus-trap]');
        focusTraps.forEach(trap => {
          if (trap instanceof HTMLElement) {
            trap.remove();
          }
        });
      };
      
      // Run cleanup after a short delay to ensure dialog is fully closed
      const timeoutId = setTimeout(cleanup, 150);
      return () => clearTimeout(timeoutId);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden bg-white/95 backdrop-blur-sm border border-blue-200 shadow-2xl rounded-2xl p-0 mx-2 my-1 sm:mx-4 sm:my-1 md:mx-6 md:my-1 lg:mx-8 lg:my-1 flex flex-col h-full">
        {/* Header with gradient background - Fixed */}
        <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 rounded-t-2xl p-6 relative flex-shrink-0">
          <div className="flex items-start gap-4 pr-24">
            {/* Export Icon */}
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Download className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-white text-2xl font-bold flex items-center gap-3">
                {title}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="text-blue-200 cursor-pointer hover:text-white transition-colors">
                        <BadgeInfo className="w-4 h-4" />
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="bg-blue-900 text-white">
                      {tooltip}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </DialogTitle>
              <p className="text-blue-100 text-sm mt-1 font-medium">Configure your export settings and format</p>
            </div>
          </div>

          {/* Close button in header - Right side */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-4 h-10 w-10 rounded-full hover:bg-white/20 text-white"
            onClick={() => handleOpenChange(false)}
            aria-label="Close dialog"
          >
            <X className="h-6 w-6" />
          </Button>
        </div>
        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="p-6 space-y-6">
            {/* Export Format Section */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-blue-200 overflow-hidden">
              <div className="p-4 bg-gradient-to-r from-gray-100 to-gray-200 border-b border-blue-300 rounded-t-xl">
                <h3 className="text-lg font-semibold text-blue-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  Export Format
                </h3>
                <p className="text-sm text-blue-700 mt-1">Choose your preferred export format</p>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-3 gap-4">
                  <Button
                    variant={exportFormat === 'pdf' ? "default" : "outline"}
                    size="default"
                    className={`w-full flex flex-col items-center gap-2 py-4 h-auto transition-all duration-200 rounded ${
                      exportFormat === 'pdf' 
                        ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg' 
                        : 'hover:bg-blue-50 hover:border-blue-300 hover:shadow-md'
                    }`}
                    onClick={() => setExportFormat('pdf')}
                  >
                    <FileText className={`h-6 w-6 ${exportFormat === 'pdf' ? 'text-white' : 'text-blue-600'}`} />
                    <span className="font-medium">PDF</span>
                    <span className="text-xs opacity-75">Document</span>
                  </Button>
                  <Button
                    variant={exportFormat === 'excel' ? "default" : "outline"}
                    size="default"
                    className={`w-full flex flex-col items-center gap-2 py-4 h-auto transition-all duration-200 rounded ${
                      exportFormat === 'excel' 
                        ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg' 
                        : 'hover:bg-blue-50 hover:border-blue-300 hover:shadow-md'
                    }`}
                    onClick={() => setExportFormat('excel')}
                  >
                    <FileSpreadsheet className={`h-6 w-6 ${exportFormat === 'excel' ? 'text-white' : 'text-blue-600'}`} />
                    <span className="font-medium">Excel</span>
                    <span className="text-xs opacity-75">Spreadsheet</span>
                  </Button>
                  <Button
                    variant={exportFormat === 'csv' ? "default" : "outline"}
                    size="default"
                    className={`w-full flex flex-col items-center gap-2 py-4 h-auto transition-all duration-200 rounded ${
                      exportFormat === 'csv' 
                        ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg' 
                        : 'hover:bg-blue-50 hover:border-blue-300 hover:shadow-md'
                    }`}
                    onClick={() => setExportFormat('csv')}
                  >
                    <FileSpreadsheet className={`h-6 w-6 ${exportFormat === 'csv' ? 'text-white' : 'text-blue-600'}`} />
                    <span className="font-medium">CSV</span>
                    <span className="text-xs opacity-75">Data File</span>
                  </Button>
                </div>
              </div>
            </div>

            {/* PDF Orientation Section - Only show when PDF is selected */}
            {exportFormat === 'pdf' && setPdfOrientation && (
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-blue-200 overflow-hidden">
                <div className="p-4 bg-gradient-to-r from-gray-100 to-gray-200 border-b border-blue-300 rounded-t-xl">
                  <h3 className="text-lg font-semibold text-blue-900 flex items-center gap-2">
                    <RotateCw className="w-5 h-5 text-blue-600" />
                    Page Orientation
                  </h3>
                  <p className="text-sm text-blue-700 mt-1">Choose the page orientation for your PDF</p>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-2 gap-4">
                    <Button
                      variant={pdfOrientation === 'portrait' ? "default" : "outline"}
                      size="default"
                      className={`w-full flex flex-col items-center gap-2 py-4 h-auto transition-all duration-200 rounded ${
                        pdfOrientation === 'portrait' 
                          ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg' 
                          : 'hover:bg-blue-50 hover:border-blue-300 hover:shadow-md'
                      }`}
                      onClick={() => setPdfOrientation('portrait')}
                    >
                      <div className="w-8 h-10 border-2 border-current rounded-sm flex items-center justify-center">
                        <div className="w-4 h-6 bg-current rounded-sm"></div>
                      </div>
                      <span className="font-medium">Portrait</span>
                      <span className="text-xs opacity-75">Taller pages</span>
                    </Button>
                    <Button
                      variant={pdfOrientation === 'landscape' ? "default" : "outline"}
                      size="default"
                      className={`w-full flex flex-col items-center gap-2 py-4 h-auto transition-all duration-200 rounded ${
                        pdfOrientation === 'landscape' 
                          ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg' 
                          : 'hover:bg-blue-50 hover:border-blue-300 hover:shadow-md'
                      }`}
                      onClick={() => setPdfOrientation('landscape')}
                    >
                      <div className="w-10 h-8 border-2 border-current rounded-sm flex items-center justify-center">
                        <div className="w-6 h-4 bg-current rounded-sm"></div>
                      </div>
                      <span className="font-medium">Landscape</span>
                      <span className="text-xs opacity-75">Wider pages</span>
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Export Options Section */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-blue-200 overflow-hidden">
              <div className="p-4 bg-gradient-to-r from-gray-100 to-gray-200 border-b border-blue-300 rounded-t-xl">
                <h3 className="text-lg font-semibold text-blue-900 flex items-center gap-2">
                  <Download className="w-5 h-5 text-blue-600" />
                  Export Options
                </h3>
                <p className="text-sm text-blue-700 mt-1">Select which columns to include in your export</p>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto">
                  {exportableColumns.map((column) => (
                    <div key={column.key} className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200">
                      <Checkbox
                        id={`export-${column.key}`}
                        checked={exportColumns.includes(column.key)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setExportColumns([...exportColumns, column.key]);
                          } else {
                            setExportColumns(exportColumns.filter((c) => c !== column.key));
                            // If logo column is deselected, also uncheck include logos
                            if (column.key === 'logo' && setIncludeLogos) {
                              setIncludeLogos(false);
                            }
                          }
                        }}
                        className="border-blue-200 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                      />
                      <Label
                        htmlFor={`export-${column.key}`}
                        className="text-sm font-medium text-blue-900 cursor-pointer flex-1"
                      >
                        {column.label}
                      </Label>
                    </div>
                  ))}
                </div>
                
                {/* Logo Option - Only show when PDF is selected */}
                {exportFormat === 'pdf' && setIncludeLogos && (
                  <div className="mt-6 pt-6 border-t border-blue-200">
                    <div className={`flex items-center space-x-3 p-3 rounded border transition-all duration-200 ${
                      exportColumns.includes('logo') 
                        ? 'bg-white border-gray-200 hover:border-blue-300 hover:bg-blue-50' 
                        : 'bg-gray-100 border-gray-300 opacity-60'
                    }`}>
                      <Checkbox
                        id="export-include-logos"
                        checked={includeLogos}
                        onCheckedChange={(checked) => setIncludeLogos(checked)}
                        disabled={!exportColumns.includes('logo')}
                        className="border-blue-200 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 disabled:opacity-50"
                      />
                      <Label
                        htmlFor="export-include-logos"
                        className={`text-sm font-medium cursor-pointer flex-1${
                          exportColumns.includes('logo') 
                            ? 'text-blue-900' 
                            : 'text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        Include Logo Images
                      </Label>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className={`cursor-help ${
                              exportColumns.includes('logo') 
                                ? 'text-blue-400' 
                                : 'text-gray-400'
                            }`}>
                              <BadgeInfo className="w-4 h-4" />
                            </span>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="bg-blue-900 text-white">
                            {exportColumns.includes('logo') 
                              ? 'Include department logos in the PDF. If no logo is available, a placeholder avatar will be shown.'
                              : 'Enable the Logo column first to include logo images in the PDF.'
                            }
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    {!exportColumns.includes('logo') && (
                      <p className="text-xs text-gray-500 mt-2 ml-6">
                        Enable the Logo column above to include logo images
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        {/* Footer with actions - Fixed */}
        <DialogFooter className="!flex !justify-between gap-4 p-6 flex-shrink-0 border-t-2 border-blue-300 bg-blue-50/80 rounded-b-2xl shadow-inner">
          <Button
            variant="outline"
            onClick={() => {
              setExportFormat(null);
              setExportColumns(exportableColumns.map(col => col.key));
              if (setPdfOrientation) {
                setPdfOrientation('portrait');
              }
              if (setIncludeLogos) {
                setIncludeLogos(false);
              }
            }}
            className="px-6 py-2 rounded-xl border-blue-300 text-blue-600 hover:bg-blue-50 hover:border-blue-400 transition-all duration-200"
          >
            Reset
          </Button>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => handleOpenChange(false)}
              className="px-6 py-2 rounded-xl transition-all duration-200"
            >
              Cancel
            </Button>
            <Button 
              onClick={onExport}
              disabled={!exportFormat}
              className="px-6 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 