"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { 
  Download, 
  FileText, 
  Database, 
  Activity, 
  Settings, 
  CheckCircle,
  Loader2
} from "lucide-react";
import { toast } from "sonner";

interface SystemStatusExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  systemHealth: any;
}

export default function SystemStatusExportDialog({ 
  open, 
  onOpenChange, 
  systemHealth 
}: SystemStatusExportDialogProps) {
  const [format, setFormat] = useState<'json' | 'csv' | 'pdf'>('json');
  const [includeDetails, setIncludeDetails] = useState(true);
  const [includeAnalytics, setIncludeAnalytics] = useState(true);
  const [includeQueries, setIncludeQueries] = useState(true);
  const [includeRecommendations, setIncludeRecommendations] = useState(true);
  const [customDateRange, setCustomDateRange] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  const exportFormats = [
    {
      value: 'json',
      label: 'JSON',
      description: 'Structured data format',
      icon: <FileText className="w-4 h-4" />
    },
    {
      value: 'csv',
      label: 'CSV',
      description: 'Spreadsheet compatible',
      icon: <Database className="w-4 h-4" />
    },
    {
      value: 'pdf',
      label: 'PDF',
      description: 'Printable report',
      icon: <FileText className="w-4 h-4" />
    }
  ];

  const exportSections = [
    {
      id: 'details',
      label: 'System Details',
      description: 'Core system status and performance metrics',
      icon: <Settings className="w-4 h-4" />,
      checked: includeDetails
    },
    {
      id: 'analytics',
      label: 'Analytics Data',
      description: 'Hourly and daily performance analytics',
      icon: <Activity className="w-4 h-4" />,
      checked: includeAnalytics
    },
    {
      id: 'queries',
      label: 'Query Performance',
      description: 'Top queries and error analysis',
      icon: <Database className="w-4 h-4" />,
      checked: includeQueries
    },
    {
      id: 'recommendations',
      label: 'Recommendations',
      description: 'System optimization suggestions',
      icon: <CheckCircle className="w-4 h-4" />,
      checked: includeRecommendations
    }
  ];

  const handleExport = async () => {
    try {
      setIsExporting(true);

      const exportData = {
        format,
        includeDetails,
        includeAnalytics,
        includeQueries,
        includeRecommendations,
        dateRange: customDateRange ? {
          startDate,
          endDate
        } : undefined
      };

      const response = await fetch('/api/system-status/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(exportData),
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `system-status-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success(`System status exported successfully as ${format.toUpperCase()}`);
      onOpenChange(false);
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const getEstimatedSize = () => {
    let size = 0;
    if (includeDetails) size += 2;
    if (includeAnalytics) size += 5;
    if (includeQueries) size += 8;
    if (includeRecommendations) size += 1;
    return `${size} KB`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            Export System Status Report
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Format Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Export Format</Label>
            <div className="grid grid-cols-1 gap-3">
              {exportFormats.map((formatOption) => (
                <div
                  key={formatOption.value}
                  className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                    format === formatOption.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setFormat(formatOption.value as any)}
                >
                  <div className="flex items-center gap-2">
                    {formatOption.icon}
                    <div>
                      <div className="font-medium">{formatOption.label}</div>
                      <div className="text-sm text-gray-500">{formatOption.description}</div>
                    </div>
                  </div>
                  {format === formatOption.value && (
                    <CheckCircle className="w-5 h-5 text-blue-500 ml-auto" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Content Sections */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Include Sections</Label>
            <div className="space-y-2">
              {exportSections.map((section) => (
                <div key={section.id} className="flex items-start gap-3">
                  <Checkbox
                    id={section.id}
                    checked={
                      section.id === 'details' ? includeDetails :
                      section.id === 'analytics' ? includeAnalytics :
                      section.id === 'queries' ? includeQueries :
                      includeRecommendations
                    }
                    onCheckedChange={(checked) => {
                      if (section.id === 'details') setIncludeDetails(checked as boolean);
                      else if (section.id === 'analytics') setIncludeAnalytics(checked as boolean);
                      else if (section.id === 'queries') setIncludeQueries(checked as boolean);
                      else setIncludeRecommendations(checked as boolean);
                    }}
                  />
                  <div className="flex-1">
                    <Label htmlFor={section.id} className="flex items-center gap-2 cursor-pointer">
                      {section.icon}
                      <span className="font-medium">{section.label}</span>
                    </Label>
                    <p className="text-sm text-gray-500 mt-1">{section.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Date Range */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Checkbox
                id="customDateRange"
                checked={customDateRange}
                onCheckedChange={setCustomDateRange}
              />
              <Label htmlFor="customDateRange" className="cursor-pointer">
                Custom Date Range
              </Label>
            </div>
            
            {customDateRange && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-sm">Start Date</Label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm">End Date</Label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Export Summary */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Export Summary</span>
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                {getEstimatedSize()}
              </Badge>
            </div>
            <div className="text-sm text-gray-600 space-y-1">
              <div>Format: {format.toUpperCase()}</div>
              <div>Sections: {exportSections.filter(s => s.checked).length} of {exportSections.length}</div>
              {customDateRange && startDate && endDate && (
                <div>Date Range: {startDate} to {endDate}</div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isExporting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleExport}
              disabled={isExporting || (!includeDetails && !includeAnalytics && !includeQueries && !includeRecommendations)}
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Export Report
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
