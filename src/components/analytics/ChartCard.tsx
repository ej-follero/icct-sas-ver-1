'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Maximize2, Minimize2, Info, Settings, AlertTriangle } from 'lucide-react';

interface ChartCardProps {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  chartId: string;
  children: React.ReactNode;
  showFilters?: boolean;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  expandedCharts: Set<string>;
  onToggleExpansion: (chartId: string) => void;
  onChartClick?: (data: any, chartType: string) => void;
  chartType: string;
}

export function ChartCard({
  title,
  icon: Icon,
  chartId,
  children,
  showFilters = true,
  loading = false,
  error = null,
  onRetry,
  expandedCharts,
  onToggleExpansion,
  onChartClick,
  chartType
}: ChartCardProps) {
  const [showChartFilters, setShowChartFilters] = useState(false);

  const handleChartClick = (data: any) => {
    if (onChartClick) {
      onChartClick(data, chartType);
    }
  };

  return (
    <Card className={`border border-blue-200 transition-all duration-300 ${
      expandedCharts.has(chartId) ? 'lg:col-span-2' : ''
    }`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Icon className="w-5 h-5" />
            {title}
            <Tooltip>
              <TooltipTrigger>
                <Info className="w-4 h-4 text-gray-400" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Click on data points to drill down into specific details</p>
              </TooltipContent>
            </Tooltip>
          </CardTitle>
          <div className="flex items-center gap-2">
            {showFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowChartFilters(!showChartFilters)}
                className="h-8 px-2 text-xs"
              >
                <Settings className="w-3 h-3 mr-1" />
                Filters
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onToggleExpansion(chartId)}
            >
              {expandedCharts.has(chartId) ? (
                <Minimize2 className="w-4 h-4" />
              ) : (
                <Maximize2 className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-64 bg-gray-100 rounded animate-pulse flex items-center justify-center">
            <div className="text-gray-500">Loading chart...</div>
          </div>
        ) : error ? (
          <div className="h-64 flex items-center justify-center">
            <div className="text-center">
              <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
              <p className="text-red-500">{error}</p>
              {onRetry && (
                <Button onClick={onRetry} className="mt-2" size="sm">
                  Retry
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div onClick={handleChartClick}>
            {children}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 