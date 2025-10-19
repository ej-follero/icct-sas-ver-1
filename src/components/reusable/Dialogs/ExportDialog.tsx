'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { FileText, Download, Table, BarChart3, X } from 'lucide-react';
import { toast } from 'sonner';

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onExport: (format: 'pdf' | 'csv' | 'excel', options: ExportOptions) => Promise<void>;
  dataCount: number;
  entityType: string;
}

interface ExportOptions {
  includeFilters: boolean;
  includeSummary: boolean;
  includeTable?: boolean;
  selectedColumns?: string[]; // columns to include in table export
}

export function ExportDialog({ open, onOpenChange, onExport, dataCount, entityType }: ExportDialogProps) {
  const [format, setFormat] = useState<'pdf' | 'csv' | 'excel'>('excel');
  const [options, setOptions] = useState<ExportOptions>({
    includeFilters: true,
    includeSummary: true,
    includeTable: true,
    selectedColumns: ['studentName', 'studentId', 'department', 'date', 'timeIn', 'timeOut', 'status', 'subject', 'room']
  });
  const [isExporting, setIsExporting] = useState(false);
  const hasData = dataCount > 0;
  const availableColumnKeys = new Set(['studentName','studentId','department','yearLevel','riskLevel','date','timeIn','timeOut','status','subject','room','notes','isManualEntry','createdAt','updatedAt']);
  const validSelectedColumns = (options.selectedColumns || []).filter(k => availableColumnKeys.has(k));
  const requireColumnsButNoneSelected = !!options.includeTable && validSelectedColumns.length === 0;

  const handleExport = async () => {
    try {
      if (!hasData) {
        toast.error('No data available to export. Please load data first.');
        return;
      }
      if (requireColumnsButNoneSelected) {
        toast.error('Please select at least one column to include in the table.');
        return;
      }
      setIsExporting(true);
      // Sanitize options before passing to caller
      const sanitized: ExportOptions = {
        ...options,
        selectedColumns: options.includeTable ? validSelectedColumns : []
      };
      await onExport(format, sanitized);
      onOpenChange(false);
    } catch (error) {
      console.error('Export failed:', error);
      toast.error(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsExporting(false);
    }
  };

  const formatOptions = [
    {
      value: 'excel' as const,
      label: 'Excel Spreadsheet',
      description: 'Best for data analysis and manipulation',
      icon: <Table className="w-4 h-4" />,
      recommended: true
    },
    {
      value: 'pdf' as const,
      label: 'PDF Report',
      description: 'Best for sharing and printing',
      icon: <FileText className="w-4 h-4" />,
      recommended: false
    },
    {
      value: 'csv' as const,
      label: 'CSV File',
      description: 'Simple data format for import into other systems',
      icon: <Download className="w-4 h-4" />,
      recommended: false
    }
  ];

  const handleSelectFormat = (value: 'pdf' | 'csv' | 'excel') => {
    setFormat(value);
  };

  // Available columns for table export
  const availableColumns = [
    { key: 'studentName', label: 'Student Name' },
    { key: 'studentId', label: 'Student ID' },
    { key: 'department', label: 'Department' },
    { key: 'yearLevel', label: 'Year Level' },
    { key: 'riskLevel', label: 'Risk Level' },
    { key: 'date', label: 'Date' },
    { key: 'timeIn', label: 'Time In' },
    { key: 'timeOut', label: 'Time Out' },
    { key: 'status', label: 'Status' },
    { key: 'subject', label: 'Subject' },
    { key: 'room', label: 'Room' },
    { key: 'notes', label: 'Notes' },
    { key: 'isManualEntry', label: 'Manual Entry' },
    { key: 'createdAt', label: 'Created At' },
    { key: 'updatedAt', label: 'Updated At' }
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl p-0 overflow-hidden rounded-xl flex flex-col max-h-[90vh]">
        {/* Accessibility - Hidden DialogTitle for screen readers */}
        <VisuallyHidden>
          <DialogTitle>Export {entityType} Data</DialogTitle>
        </VisuallyHidden>
        
        {/* Blue Header Section with Close Button */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white rounded-t-xl relative flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-white">Export {entityType} Data</h3>
              <p className="text-white/80 text-sm">
                Export {dataCount} {entityType}{dataCount === 1 ? '' : 's'} with your preferred format and options.
              </p>
            </div>
          </div>
          {/* Close Button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 h-8 w-8 text-white hover:bg-white/20 rounded-lg"
            onClick={() => onOpenChange(false)}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Content Section - Scrollable */}
        <div className="p-6 flex-1 overflow-y-auto">

        <div className="space-y-6">

          {/* Format Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-gray-900">Export Format</Label>
            <div className="flex gap-3">
              {formatOptions.map((option) => (
                <Button
                  key={option.value}
                  variant={format === option.value ? "default" : "outline"}
                  className={`flex-1 h-12 flex flex-col items-center justify-center gap-2 ${
                    format === option.value 
                      ? "bg-blue-600 hover:bg-blue-700 text-white" 
                      : "bg-white hover:bg-gray-50 text-gray-700 border-gray-300"
                  }`}
                  onClick={() => handleSelectFormat(option.value as 'pdf' | 'csv' | 'excel')}
                >
                  <div className="flex items-center gap-2">
                    {option.icon}
                    <span className="font-medium">{option.label}</span>
                  </div>
                </Button>
              ))}
            </div>
          </div>

          {/* Columns to Export */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium text-gray-900">Export Options</Label>
              <Button
                variant="ghost"
                size="sm"
                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                onClick={() => {
                  const allSelected = options.includeFilters && options.includeSummary;
                  setOptions(prev => ({
                    ...prev,
                    includeFilters: !allSelected,
                    includeSummary: !allSelected
                  }));
                }}
              >
                Select All
              </Button>
            </div>
            <div className="border border-gray-200 rounded-lg p-3 max-h-64 overflow-y-auto">
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includeFilters"
                    checked={options.includeFilters}
                    onCheckedChange={(checked) => setOptions(prev => ({ ...prev, includeFilters: !!checked }))}
                  />
                  <Label htmlFor="includeFilters" className="text-sm">
                    Include applied filters information
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includeSummary"
                    checked={options.includeSummary}
                    onCheckedChange={(checked) => setOptions(prev => ({ ...prev, includeSummary: !!checked }))}
                  />
                  <Label htmlFor="includeSummary" className="text-sm">
                    Include summary statistics
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includeTable"
                    checked={!!options.includeTable}
                    onCheckedChange={(checked) => setOptions(prev => ({ ...prev, includeTable: !!checked }))}
                  />
                  <Label htmlFor="includeTable" className="text-sm">
                    Include attendance records table
                  </Label>
                </div>
                
                {/* Column selection (only when table is included) */}
                {options.includeTable && (
                  <div className="ml-6 space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium text-gray-700">Select Columns to Include</Label>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        onClick={() => {
                          const allSelected = availableColumns.every(col => options.selectedColumns?.includes(col.key));
                          setOptions(prev => ({
                            ...prev,
                            selectedColumns: allSelected ? [] : availableColumns.map(col => col.key)
                          }));
                        }}
                      >
                        {availableColumns.every(col => options.selectedColumns?.includes(col.key)) ? 'Deselect All' : 'Select All'}
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-32 overflow-y-auto border border-gray-200 rounded p-2">
                      {availableColumns.map(col => (
                        <label key={col.key} className="flex items-center space-x-2 text-sm">
                          <Checkbox
                            checked={options.selectedColumns?.includes(col.key) || false}
                            onCheckedChange={(checked) => setOptions(prev => ({
                              ...prev,
                              selectedColumns: checked
                                ? Array.from(new Set([...(prev.selectedColumns || []), col.key]))
                                : (prev.selectedColumns || []).filter(k => k !== col.key)
                            }))}
                          />
                          <span>{col.label}</span>
                        </label>
                      ))}
                    </div>
                    {/* Preview summary */}
                    <div className="text-xs text-gray-600 flex flex-wrap items-center gap-2">
                      <span className="font-medium">Preview:</span>
                      <span>{dataCount} {entityType}{dataCount === 1 ? '' : 's'}</span>
                      <span>•</span>
                      <span>{validSelectedColumns.length} column{validSelectedColumns.length === 1 ? '' : 's'} selected</span>
                    </div>
                    {requireColumnsButNoneSelected && (
                      <div className="text-xs text-red-600">Select at least one column to export the table.</div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* removed: table column options */}

        </div>

        {/* Sticky Footer Section */}
        <div className="flex-shrink-0 bg-gray-50 border-t border-gray-200 flex justify-end gap-3 sticky bottom-0 z-10 mt-6 pt-2">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)} 
            disabled={isExporting}
            className="border-gray-300 text-gray-700 hover:bg-gray-50 rounded"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleExport} 
            disabled={isExporting || !hasData || requireColumnsButNoneSelected} 
            className="bg-blue-600 hover:bg-blue-700 text-white rounded"
          >
            {isExporting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                {!hasData ? 'No Data to Export' : requireColumnsButNoneSelected ? 'Select Columns' : 'Export Data'}
              </>
            )}
          </Button>
        </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}