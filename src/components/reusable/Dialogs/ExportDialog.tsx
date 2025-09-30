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
  entityType: 'student' | 'instructor';
}

interface ExportOptions {
  includeCharts: boolean;
  includeFilters: boolean;
  includeSummary: boolean;
}

export function ExportDialog({ open, onOpenChange, onExport, dataCount, entityType }: ExportDialogProps) {
  const [format, setFormat] = useState<'pdf' | 'csv' | 'excel'>('excel');
  const [options, setOptions] = useState<ExportOptions>({
    includeCharts: true,
    includeFilters: true,
    includeSummary: true
  });
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      await onExport(format, options);
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl p-0 overflow-hidden rounded-xl flex flex-col max-h-[90vh]">
        {/* Accessibility - Hidden DialogTitle for screen readers */}
        <VisuallyHidden>
          <DialogTitle>Export {entityType === 'student' ? 'Student' : 'Instructor'} Data</DialogTitle>
        </VisuallyHidden>
        
        {/* Blue Header Section with Close Button */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 text-white rounded-t-xl relative flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-white">Export {entityType === 'student' ? 'Student' : 'Instructor'} Data</h3>
              <p className="text-white/80 text-sm">
                Export {dataCount} {entityType}s with your preferred format and options.
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
          {/* Information Bar */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-blue-800 text-sm font-medium">
              Exporting <strong>{dataCount}</strong> selected {entityType}s
            </p>
          </div>

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
                  onClick={() => setFormat(option.value as 'pdf' | 'csv' | 'excel')}
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
              <Label className="text-sm font-medium text-gray-900">Columns to Export</Label>
              <Button
                variant="ghost"
                size="sm"
                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                onClick={() => {
                  const allSelected = options.includeCharts && options.includeFilters && options.includeSummary;
                  setOptions(prev => ({
                    ...prev,
                    includeCharts: !allSelected,
                    includeFilters: !allSelected,
                    includeSummary: !allSelected
                  }));
                }}
              >
                Select All
              </Button>
            </div>
            <div className="border border-gray-200 rounded-lg p-3 max-h-48 overflow-y-auto">
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includeCharts"
                    checked={options.includeCharts}
                    onCheckedChange={(checked) => setOptions(prev => ({ ...prev, includeCharts: !!checked }))}
                  />
                  <Label htmlFor="includeCharts" className="text-sm">
                    Include charts and visualizations
                  </Label>
                </div>
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
              </div>
            </div>
          </div>

          {/* Export Options */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-gray-900">Export Options</Label>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeHeaders"
                  checked={true}
                  disabled
                />
                <Label htmlFor="includeHeaders" className="text-sm">
                  Include column headers
                </Label>
              </div>
            </div>
          </div>

          {/* Data Preview */}
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="text-sm text-gray-600">
              <strong>Export Preview:</strong>
            </div>
            <div className="text-sm text-gray-500 mt-1">
              • {dataCount} {entityType}s
            </div>
            <div className="text-sm text-gray-500">
              • Format: {format.toUpperCase()}
            </div>
            {options.includeCharts && (
              <div className="text-sm text-gray-500">
                • Charts and visualizations included
              </div>
            )}
          </div>
        </div>

        {/* Sticky Footer Section */}
        <div className="flex-shrink-0 px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3 rounded-b-xl shadow-lg sticky bottom-0 z-10">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)} 
            disabled={isExporting}
            className="border-gray-300 text-gray-700 hover:bg-gray-50 px-6"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleExport} 
            disabled={isExporting} 
            className="bg-blue-600 hover:bg-blue-700 text-white px-6"
          >
            {isExporting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Export Data
              </>
            )}
          </Button>
        </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}