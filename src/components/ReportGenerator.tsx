"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  FileText, 
  Download, 
  Printer, 
  Mail, 
  Calendar, 
  Filter,
  BarChart3,
  TrendingUp,
  Users,
  Clock,
  CheckCircle,
  AlertTriangle,
  X,
  Loader2
} from "lucide-react";
import { ICCT_CLASSES } from "@/lib/colors";

interface ReportGeneratorProps {
  title: string;
  description?: string;
  data: any[];
  columns: {
    key: string;
    label: string;
    type?: 'text' | 'number' | 'date' | 'percentage' | 'status';
    format?: (value: any) => string;
  }[];
  exportFormats?: ('csv' | 'pdf' | 'excel')[];
  onGenerate?: (config: ReportConfig) => Promise<void>;
  className?: string;
}

interface ReportConfig {
  format: 'csv' | 'pdf' | 'excel';
  dateRange: {
    start: string;
    end: string;
  };
  filters: Record<string, any>;
  columns: string[];
  includeCharts: boolean;
  includeSummary: boolean;
}

const ReportGenerator: React.FC<ReportGeneratorProps> = ({
  title,
  description,
  data,
  columns,
  exportFormats = ['csv', 'pdf'],
  onGenerate,
  className = ""
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [config, setConfig] = useState<ReportConfig>({
    format: 'csv',
    dateRange: {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
      end: new Date().toISOString().split('T')[0]
    },
    filters: {},
    columns: columns.map(col => col.key),
    includeCharts: true,
    includeSummary: true
  });

  const handleGenerate = async () => {
    if (!onGenerate) {
      // Default export functionality
      await handleDefaultExport();
    } else {
      setIsGenerating(true);
      try {
        await onGenerate(config);
      } catch (error) {
        console.error('Report generation failed:', error);
      } finally {
        setIsGenerating(false);
        setIsOpen(false);
      }
    }
  };

  const handleDefaultExport = async () => {
    if (config.format === 'csv') {
      exportToCSV();
    } else if (config.format === 'pdf') {
      await exportToPDF();
    }
    setIsOpen(false);
  };

  const exportToCSV = () => {
    const headers = config.columns.map(col => {
      const column = columns.find(c => c.key === col);
      return column?.label || col;
    });

    const rows = data.map(item => 
      config.columns.map(col => {
        const value = item[col];
        const column = columns.find(c => c.key === col);
        return column?.format ? column.format(value) : value;
      })
    );

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportToPDF = async () => {
    // This would require a PDF library like jsPDF or react-pdf
    // For now, we'll show a placeholder
    alert('PDF export functionality requires additional setup with jsPDF or similar library');
  };

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'csv':
        return <FileText className="w-4 h-4" />;
      case 'pdf':
        return <FileText className="w-4 h-4" />;
      case 'excel':
        return <BarChart3 className="w-4 h-4" />;
      default:
        return <Download className="w-4 h-4" />;
    }
  };

  return (
    <>
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="h-5 w-5" />
            {title}
          </CardTitle>
          {description && (
            <p className="text-sm text-gray-600">{description}</p>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-800">{data.length}</p>
              <p className="text-xs text-blue-600">Total Records</p>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-800">{config.columns.length}</p>
              <p className="text-xs text-green-600">Columns</p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setIsOpen(true)}
              className="h-8"
            >
              <Download className="w-3 h-3 mr-1" />
              Generate
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => window.print()}
              className="h-8"
            >
              <Printer className="w-3 h-3 mr-1" />
              Print
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Report Configuration Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Generate {title}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Format Selection */}
            <div>
              <Label>Export Format</Label>
              <Select 
                value={config.format} 
                onValueChange={(value: 'csv' | 'pdf' | 'excel') => 
                  setConfig(prev => ({ ...prev, format: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {exportFormats.map(format => (
                    <SelectItem key={format} value={format}>
                      <div className="flex items-center gap-2">
                        {getFormatIcon(format)}
                        {format.toUpperCase()}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={config.dateRange.start}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    dateRange: { ...prev.dateRange, start: e.target.value }
                  }))}
                />
              </div>
              <div>
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={config.dateRange.end}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    dateRange: { ...prev.dateRange, end: e.target.value }
                  }))}
                />
              </div>
            </div>

            {/* Column Selection */}
            <div>
              <Label>Include Columns</Label>
              <div className="grid grid-cols-2 gap-2 mt-2 max-h-32 overflow-y-auto">
                {columns.map(column => (
                  <div key={column.key} className="flex items-center space-x-2">
                    <Checkbox
                      id={column.key}
                      checked={config.columns.includes(column.key)}
                      onCheckedChange={(checked) => {
                        setConfig(prev => ({
                          ...prev,
                          columns: checked 
                            ? [...prev.columns, column.key]
                            : prev.columns.filter(col => col !== column.key)
                        }));
                      }}
                    />
                    <Label htmlFor={column.key} className="text-sm">
                      {column.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Options */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeCharts"
                  checked={config.includeCharts}
                  onCheckedChange={(checked) => 
                    setConfig(prev => ({ ...prev, includeCharts: !!checked }))
                  }
                />
                <Label htmlFor="includeCharts">Include Charts & Graphs</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeSummary"
                  checked={config.includeSummary}
                  onCheckedChange={(checked) => 
                    setConfig(prev => ({ ...prev, includeSummary: !!checked }))
                  }
                />
                <Label htmlFor="includeSummary">Include Summary Statistics</Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleGenerate}
              disabled={isGenerating}
              className={`${ICCT_CLASSES.bg.primary} hover:${ICCT_CLASSES.bg.secondary}`}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Generate Report
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ReportGenerator; 