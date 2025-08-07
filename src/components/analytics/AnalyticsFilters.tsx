'use client';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface AnalyticsFiltersProps {
  selectedDepartment: string;
  selectedRiskLevel: string;
  departmentStats: Record<string, any>;
  onDepartmentChange: (value: string) => void;
  onRiskLevelChange: (value: string) => void;
}

export function AnalyticsFilters({
  selectedDepartment,
  selectedRiskLevel,
  departmentStats,
  onDepartmentChange,
  onRiskLevelChange
}: AnalyticsFiltersProps) {
  return (
    <div className="border-b border-gray-200 shadow-sm p-3 sm:p-4 lg:p-6">
      <div className="flex flex-col xl:flex-row gap-2 sm:gap-3 items-start xl:items-center justify-between">
        {/* Filters */}
        <div className="flex flex-col xl:flex-row gap-2 sm:gap-3 items-start xl:items-center">
          <Select value={selectedDepartment} onValueChange={onDepartmentChange}>
            <SelectTrigger className="w-full xl:w-auto xl:min-w-[200px] xl:max-w-sm">
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
            <SelectTrigger className="w-full sm:w-28 lg:w-32 xl:w-28 text-gray-700">
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
        </div>
      </div>
    </div>
  );
} 