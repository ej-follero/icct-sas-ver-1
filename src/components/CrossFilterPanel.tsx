'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Filter, X } from 'lucide-react';

interface CrossFilterPanelProps {
  activeFilters: Record<string, any>;
  onApplyFilter: (key: string, value: any) => void;
  onClearFilter: (key: string) => void;
  onResetAll: () => void;
}

export function CrossFilterPanel({ 
  activeFilters, 
  onApplyFilter, 
  onClearFilter, 
  onResetAll 
}: CrossFilterPanelProps) {
  if (Object.keys(activeFilters).length === 0) {
    return null;
  }

  return (
    <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-blue-600" />
          <span className="font-medium text-blue-800">Active Cross-Filters</span>
        </div>
        <Button variant="outline" size="sm" onClick={onResetAll}>
          Clear All
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {Object.entries(activeFilters).map(([key, value]) => {
          // Format the value for display
          let displayValue = value;
          if (typeof value === 'object' && value !== null) {
            if (key === 'timeRange' && value.preset) {
              displayValue = value.preset === 'custom' 
                ? `${value.start?.toLocaleDateString()} - ${value.end?.toLocaleDateString()}`
                : value.preset;
            } else {
              displayValue = JSON.stringify(value);
            }
          }
          
          return (
            <Badge key={key} variant="secondary" className="bg-blue-100 text-blue-800">
              {key}: {displayValue}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onClearFilter(key)}
                className="ml-2 h-4 w-4 p-0 hover:bg-blue-200"
              >
                <X className="w-3 h-3" />
              </Button>
            </Badge>
          );
        })}
      </div>
    </div>
  );
} 