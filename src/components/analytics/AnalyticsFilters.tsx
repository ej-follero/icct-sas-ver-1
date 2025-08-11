'use client';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TimeRangeSelector } from '../TimeRangeSelector';

interface TimeRange {
  start: Date;
  end: Date;
  preset: 'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom';
}

interface AnalyticsFiltersProps {
  selectedDepartment: string;
  selectedRiskLevel: string;
  departmentStats: Record<string, any>;
  onDepartmentChange: (value: string) => void;
  onRiskLevelChange: (value: string) => void;
  enableTimeRange?: boolean;
  timeRange?: TimeRange;
  onTimeRangeChange?: (timeRange: TimeRange) => void;
}

export function AnalyticsFilters({
  selectedDepartment,
  selectedRiskLevel,
  departmentStats,
  onDepartmentChange,
  onRiskLevelChange,
  enableTimeRange = false,
  timeRange,
  onTimeRangeChange
}: AnalyticsFiltersProps) {
  return (
    <div>
      <div className="flex flex-col xl:flex-row gap-2 sm:gap-3 items-start xl:items-center justify-between">
        {/* Filters */}
        <div className="flex flex-col xl:flex-row gap-2 sm:gap-3 items-start xl:items-center">
          <Select value={selectedDepartment} onValueChange={onDepartmentChange}>
            <SelectTrigger className="w-full xl:w-auto xl:min-w-[200px] xl:max-w-sm rounded text-gray-500 border-gray-300 hover:border-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <SelectValue placeholder="Department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {Object.keys(departmentStats).map(dept => (
                <SelectItem key={dept} value={dept}>{dept}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedRiskLevel} onValueChange={onRiskLevelChange}>
            <SelectTrigger className="w-full sm:w-28 lg:w-32 xl:w-28 rounded text-gray-500 border-gray-300 hover:border-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <SelectValue placeholder="Risk Level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              <SelectItem value="none">No Risk</SelectItem>
              <SelectItem value="low">Low Risk</SelectItem>
              <SelectItem value="medium">Medium Risk</SelectItem>
              <SelectItem value="high">High Risk</SelectItem>
            </SelectContent>
          </Select>

          {/* Time Range Selector */}
          {enableTimeRange && timeRange && onTimeRangeChange && (
            <TimeRangeSelector
              timeRange={timeRange}
              onTimeRangeChange={onTimeRangeChange}
              
            />
          )}
        </div>
      </div>
    </div>
  );
} 