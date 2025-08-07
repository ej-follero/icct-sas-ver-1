'use client';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from 'lucide-react';

interface TimeRange {
  start: Date;
  end: Date;
  preset: 'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom';
}

interface TimeRangeSelectorProps {
  timeRange: TimeRange;
  onTimeRangeChange: (range: TimeRange) => void;
}

export function TimeRangeSelector({ timeRange, onTimeRangeChange }: TimeRangeSelectorProps) {
  const presets = [
    { label: 'Today', value: 'today' },
    { label: 'This Week', value: 'week' },
    { label: 'This Month', value: 'month' },
    { label: 'This Quarter', value: 'quarter' },
    { label: 'This Year', value: 'year' },
    { label: 'Custom', value: 'custom' }
  ];

  return (
    <div className="flex items-center gap-3 p-3">
      <Select 
        value={timeRange.preset} 
        onValueChange={(preset) => onTimeRangeChange({ ...timeRange, preset: preset as any })}
      >
        <SelectTrigger className="w-32">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {presets.map(preset => (
            <SelectItem key={preset.value} value={preset.value}>
              {preset.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {timeRange.preset === 'custom' && (
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={timeRange.start.toISOString().split('T')[0]}
            onChange={(e) => onTimeRangeChange({
              ...timeRange,
              start: new Date(e.target.value)
            })}
            className="px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-600">to</span>
          <input
            type="date"
            value={timeRange.end.toISOString().split('T')[0]}
            onChange={(e) => onTimeRangeChange({
              ...timeRange,
              end: new Date(e.target.value)
            })}
            className="px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      )}
    </div>
  );
} 