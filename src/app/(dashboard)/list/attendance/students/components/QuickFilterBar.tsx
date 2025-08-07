import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronDown } from 'lucide-react';

interface QuickFilterBarProps {
  filters: any;
  setFilters: (filters: any) => void;
  departmentCodes: string[];
  subjectEnrollments: string[];
  courses: string[];
  yearLevels: string[];
  activeRange: 'today' | 'week' | 'month';
  setActiveRange: (range: 'today' | 'week' | 'month') => void;
  onShowAdvanced: () => void;
  showAdvanced: boolean;
}

const QuickFilterBar: React.FC<QuickFilterBarProps> = ({
  filters,
  setFilters,
  departmentCodes,
  subjectEnrollments,
  courses,
  yearLevels,
  activeRange,
  setActiveRange,
  onShowAdvanced,
  showAdvanced
}) => {
  return (
    <div className="flex flex-row flex-nowrap gap-4 overflow-x-auto pb-2">
      {/* Time Range Filter */}
      <div className="flex flex-col min-w-[140px] w-[180px] max-w-[220px]">
        <select
          value={activeRange}
          onChange={e => setActiveRange(e.target.value as 'today' | 'week' | 'month')}
          className="border border-gray-300 rounded-lg px-2 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white w-full"
        >
          <option value="today">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
        </select>
      </div>
      {/* Department Filter */}
      <div className="flex flex-col min-w-[140px] w-[180px] max-w-[220px]">
        <select
          value={filters.departments[0] || ''}
          onChange={e => setFilters({ ...filters, departments: e.target.value ? [e.target.value] : [] })}
          className="border border-gray-300 rounded-lg px-2 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white w-full"
        >
          <option value="">All Departments</option>
          {departmentCodes.map(code => (
            <option key={code} value={code}>{code}</option>
          ))}
        </select>
      </div>
      {/* Subject Filter */}
      <div className="flex flex-col min-w-[140px] w-[180px] max-w-[220px]">
        <select
          value={filters.subjects[0] || ''}
          onChange={e => setFilters({ ...filters, subjects: e.target.value ? [e.target.value] : [] })}
          className="border border-gray-300 rounded-lg px-2 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white w-full"
        >
          <option value="">All Subjects</option>
          {subjectEnrollments.map(code => (
            <option key={code} value={code}>{code}</option>
          ))}
        </select>
      </div>
      {/* Course Filter */}
      <div className="flex flex-col min-w-[140px] w-[180px] max-w-[220px]">
        <select
          value={filters.courses[0] || ''}
          onChange={e => setFilters({ ...filters, courses: e.target.value ? [e.target.value] : [] })}
          className="border border-gray-300 rounded-lg px-2 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white w-full"
        >
          <option value="">All Courses</option>
          {courses.map(course => (
            <option key={course} value={course}>{course}</option>
          ))}
        </select>
      </div>
      {/* Year Level Filter */}
      <div className="flex flex-col min-w-[140px] w-[180px] max-w-[220px]">
        <select
          value={filters.yearLevels[0] || ''}
          onChange={e => setFilters({ ...filters, yearLevels: e.target.value ? [e.target.value] : [] })}
          className="border border-gray-300 rounded-lg px-2 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white w-full"
        >
          <option value="">All Years</option>
          {yearLevels.map(yl => (
            <option key={yl} value={yl}>{yl}</option>
          ))}
        </select>
      </div>
      {/* Advanced Filters Button */}
      <div className="flex items-end min-w-[140px] w-[180px] max-w-[220px]">
        <Button
          variant="ghost"
          size="sm"
          onClick={onShowAdvanced}
          className="text-blue-800 bg-blue-100 rounded-xl hover:text-white hover:bg-blue-600 h-9 px-4 w-full"
        >
          <span className="ml-1 text-xs">Advanced Filters</span>
          <ChevronDown className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
        </Button>
      </div>
    </div>
  );
};

export default QuickFilterBar; 