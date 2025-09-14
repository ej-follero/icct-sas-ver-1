"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Download, FileText, Table, FileSpreadsheet, X, Loader2 } from "lucide-react";

interface ExportColumn {
  id: string;
  label: string;
  default: boolean;
}

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedItems?: any[];
  entityType: string;
  entityLabel: string;
  exportColumns?: ExportColumn[];
  onExport?: (options: ExportOptions) => void;
}

interface ExportOptions {
  format: 'CSV' | 'EXCEL' | 'PDF';
  columns: string[];
  includeHeaders: boolean;
  dateRange?: {
    start: string;
    end: string;
  };
}

export function ExportDialog({ 
  open, 
  onOpenChange, 
  selectedItems = [], 
  entityType, 
  entityLabel, 
  exportColumns = [],
  onExport 
}: ExportDialogProps) {
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'CSV',
    columns: exportColumns.filter(col => col.default).map(col => col.id),
    includeHeaders: true,
  });

  const [isExporting, setIsExporting] = useState(false);

  const formats = [
    { value: 'CSV', label: 'CSV', icon: <FileText className="w-4 h-4" /> },
    { value: 'EXCEL', label: 'Excel', icon: <FileSpreadsheet className="w-4 h-4" /> },
    { value: 'PDF', label: 'PDF', icon: <Table className="w-4 h-4" /> },
  ];

  const handleColumnToggle = (columnId: string, checked: boolean) => {
    setExportOptions(prev => ({
      ...prev,
      columns: checked 
        ? [...prev.columns, columnId]
        : prev.columns.filter(id => id !== columnId)
    }));
  };

  const handleSelectAllColumns = (checked: boolean) => {
    setExportOptions(prev => ({
      ...prev,
      columns: checked ? exportColumns.map(col => col.id) : []
    }));
  };

  const handleExport = async () => {
    if (exportOptions.columns.length === 0 || isExporting) {
      return;
    }

    setIsExporting(true);
    try {
      // Simulate export process with progress
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Generate filename with timestamp
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `${entityLabel}s-export-${timestamp}`;
      
      // Prepare data for export
      const exportData = selectedItems.map(item => {
        const row: any = {};
        exportOptions.columns.forEach(columnId => {
          row[columnId] = item[columnId] || '';
        });
        return row;
      });

      // Generate file based on format
      let fileContent: string;
      let mimeType: string;
      let fileExtension: string;

      switch (exportOptions.format) {
        case 'CSV':
          fileContent = generateCSV(exportData, exportOptions.columns, exportOptions.includeHeaders);
          mimeType = 'text/csv';
          fileExtension = 'csv';
          break;
        case 'EXCEL':
          // For Excel, we'll generate a CSV with .xlsx extension (simplified approach)
          fileContent = generateCSV(exportData, exportOptions.columns, exportOptions.includeHeaders);
          mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
          fileExtension = 'xlsx';
          break;
        case 'PDF':
          // For PDF, we'll generate a simple text format
          fileContent = generatePDF(exportData, exportOptions.columns, exportOptions.includeHeaders);
          mimeType = 'application/pdf';
          fileExtension = 'pdf';
          break;
        default:
          throw new Error('Unsupported export format');
      }

      // Download the file only after progress is complete
      downloadFile(fileContent, `${filename}.${fileExtension}`, mimeType);
      
      // Call the export handler if provided
      onExport?.(exportOptions);
      
      // Close dialog after successful export
      onOpenChange(false);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const generateCSV = (data: any[], columns: string[], includeHeaders: boolean): string => {
    const headers = columns.map(col => {
      const column = exportColumns.find(c => c.id === col);
      return column ? column.label : col;
    });
    
    const csvRows = [];
    
    if (includeHeaders) {
      csvRows.push(headers.join(','));
    }
    
    data.forEach(row => {
      const values = columns.map(col => {
        const value = row[col] || '';
        // Escape commas and quotes in CSV
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      });
      csvRows.push(values.join(','));
    });
    
    return csvRows.join('\n');
  };

  const generatePDF = (data: any[], columns: string[], includeHeaders: boolean): string => {
    const headers = columns.map(col => {
      const column = exportColumns.find(c => c.id === col);
      return column ? column.label : col;
    });
    
    let content = `${entityLabel}s Export Report\n`;
    content += `Generated on: ${new Date().toLocaleDateString()}\n`;
    content += `Total Records: ${data.length}\n\n`;
    
    if (includeHeaders) {
      content += headers.join('\t') + '\n';
    }
    
    data.forEach(row => {
      const values = columns.map(col => row[col] || '');
      content += values.join('\t') + '\n';
    });
    
    return content;
  };

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const allColumnsSelected = exportOptions.columns.length === exportColumns.length;
  const someColumnsSelected = exportOptions.columns.length > 0 && exportOptions.columns.length < exportColumns.length;

  // Don't render if no export columns are available
  if (!exportColumns || exportColumns.length === 0) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden rounded-xl flex flex-col p-0">
        <DialogHeader className="p-0 flex-shrink-0">
          <div className="bg-gradient-to-r from-[#1e40af] to-[#3b82f6] p-6 rounded-t-xl relative">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <Download className="w-5 h-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-white">
                  Export {entityLabel}s
                </DialogTitle>
                <p className="text-blue-100 text-sm mt-1">
                  Choose format and columns for your export
                </p>
              </div>
            </div>
            
            {/* Close Button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 top-4 h-10 w-10 rounded-full hover:bg-white/20 text-white"
              onClick={() => onOpenChange(false)}
              aria-label="Close dialog"
            >
              <X className="h-6 w-6" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 pt-6 pb-6">
            <div className="space-y-6">
              {/* Export Summary */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  Exporting <strong>{selectedItems.length}</strong> selected {entityLabel}{selectedItems.length !== 1 ? 's' : ''}
                </p>
              </div>

              {/* Format Selection */}
              <div className="space-y-3">
                <Label className="text-sm font-medium text-gray-700">Export Format</Label>
                <div className="grid grid-cols-3 gap-2">
                  {formats.map((format) => (
                    <Button
                      key={format.value}
                      variant={exportOptions.format === format.value ? "default" : "outline"}
                      size="sm"
                      onClick={() => setExportOptions(prev => ({ ...prev, format: format.value as any }))}
                      className="flex items-center gap-2 h-10"
                    >
                      {format.icon}
                      {format.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Column Selection */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium text-gray-700">Columns to Export</Label>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="select-all"
                      checked={allColumnsSelected}
                      onCheckedChange={handleSelectAllColumns}
                    />
                    <Label htmlFor="select-all" className="text-sm">
                      Select All
                    </Label>
                  </div>
                </div>
                
                <div className="space-y-2 max-h-48 overflow-y-auto border rounded-md p-3">
                  {exportColumns.map((column) => (
                    <div key={column.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={column.id}
                        checked={exportOptions.columns.includes(column.id)}
                        onCheckedChange={(checked) => handleColumnToggle(column.id, checked as boolean)}
                      />
                      <Label htmlFor={column.id} className="text-sm flex-1">
                        {column.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Options */}
              <div className="space-y-3">
                <Label className="text-sm font-medium text-gray-700">Export Options</Label>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="include-headers"
                    checked={exportOptions.includeHeaders}
                    onCheckedChange={(checked) => 
                      setExportOptions(prev => ({ ...prev, includeHeaders: checked as boolean }))
                    }
                  />
                  <Label htmlFor="include-headers" className="text-sm">
                    Include column headers
                  </Label>
                </div>
              </div>

              {/* Export Progress */}
              {isExporting && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-blue-800">Exporting data...</p>
                      <p className="text-xs text-blue-600">Please wait while we prepare your file</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Validation */}
              {exportOptions.columns.length === 0 && !isExporting && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-600">
                    Please select at least one column to export.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <DialogFooter className="flex items-center justify-between pt-6 border-t border-gray-200 flex-shrink-0 px-6 mb-6">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">
                Select format and columns to export
              </span>
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => onOpenChange(false)} 
                disabled={isExporting}
                className="rounded"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleExport} 
                disabled={isExporting || exportOptions.columns.length === 0}
                className="bg-blue-600 hover:bg-blue-700 rounded"
              >
                {isExporting ? "Exporting..." : "Export"}
              </Button>
            </div>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}