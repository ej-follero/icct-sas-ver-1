import React, { useState, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Filter, Settings, RotateCcw, Users, Building, GraduationCap, Calendar, TrendingUp, AlertTriangle, User, UserCheck, BookOpen, MapPin, Target } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import FilterDropdown from '@/components/reusable/FilterDropdown';

// Local type definitions
interface Filters {
  departments: string[];
  courses: string[];
  yearLevels: string[];
  sections: string[];
  attendanceRates: string[];
  riskLevels: string[];
  studentStatuses: string[];
  studentTypes: string[];
  subjects: string[];
  subjectInstructors: string[];
  subjectRooms: string[];
  dateRangeStart: string;
  dateRangeEnd: string;
}

interface FilterPreset {
  id: string;
  name: string;
  description: string;
  icon: any;
  filters: Partial<Filters>;
}

/**
 * SimplifiedFilterBar
 *
 * A clean, organized filter interface showing only core filters for student attendance data.
 *
 * Props:
 * - filters: Current filter state
 * - setFilters: Setter for filter state
 * - filterOptions: Object containing arrays of options for each filter
 * - getFilterCount: Function to get count for each filter option
 * - filterPresets: Array of filter preset objects
 * - applyFilterPreset: Function to apply a preset
 * - isPresetActive: Function to check if a preset is active
 * - onAdvancedFilter: Callback for advanced filter button
 * - totalActiveFilters: Number of active filters
 */
export const SimplifiedFilterBar = ({
  filters,
  setFilters,
  filterOptions,
  getFilterCount,
  filterPresets,
  applyFilterPreset,
  isPresetActive,
  onAdvancedFilter,
  totalActiveFilters
}: {
  filters: Filters;
  setFilters: React.Dispatch<React.SetStateAction<Filters>>;
  filterOptions: {
    departments: string[];
    courses: string[];
    yearLevels: string[];
    sections: string[];
    attendanceRates: string[];
    riskLevels: string[];
    studentStatuses: string[];
    studentTypes: string[];
    subjects: string[];
    subjectInstructors: string[];
    subjectRooms: string[];
  };
  getFilterCount: (filterType: string, option: string) => number;
  filterPresets: FilterPreset[];
  applyFilterPreset: (preset: FilterPreset) => void;
  isPresetActive: (preset: FilterPreset) => boolean;
  onAdvancedFilter: () => void;
  totalActiveFilters: number;
}) => {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const handleDropdownToggle = useCallback((dropdownName: string) => {
    setOpenDropdown(openDropdown === dropdownName ? null : dropdownName);
  }, [openDropdown]);

  const handleFilterChange = useCallback((filterType: keyof Filters, values: string[]) => {
    setFilters((prev: Filters) => ({
      ...prev,
      [filterType]: values
    }));
  }, [setFilters]);

  const handleClearFilters = useCallback(() => {
    setFilters({
      departments: [],
      courses: [],
      yearLevels: [],
      sections: [],
      attendanceRates: [],
      riskLevels: [],
      studentStatuses: [],
      studentTypes: [],
      subjects: [],
      subjectInstructors: [],
      subjectRooms: [],
      dateRangeStart: '',
      dateRangeEnd: '',
    });
  }, [setFilters]);

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
          </div>
          {totalActiveFilters > 0 && (
            <Badge variant="secondary" className="bg-blue-100 text-blue-700">
              {totalActiveFilters} active
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onAdvancedFilter}
                  className="text-gray-600 hover:text-gray-800"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Advanced
                </Button>
              </TooltipTrigger>
              <TooltipContent>Advanced filtering options</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          {totalActiveFilters > 0 && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClearFilters}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <RotateCcw className="w-4 h-4 mr-1" />
                    Clear All
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Clear all active filters</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </div>
      {/* Filter Presets */}
      {filterPresets.length > 0 && (
        <div className="mb-6">
          <div className="text-sm font-medium text-gray-700 mb-3">Quick Filters:</div>
          <div className="flex flex-wrap gap-2">
            {filterPresets.map((preset) => (
              <Button
                key={preset.id}
                variant={isPresetActive(preset) ? "default" : "outline"}
                size="sm"
                onClick={() => applyFilterPreset(preset)}
                className={`text-xs ${
                  isPresetActive(preset) 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <preset.icon className="w-3 h-3 mr-1" />
                {preset.name}
              </Button>
            ))}
          </div>
        </div>
      )}
      {/* Core Filter Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
        {/* Student Demographics */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
            <Users className="w-4 h-4" />
            Student Demographics
          </h4>
          <div className="space-y-2">
            <FilterDropdown
              title="Department"
              icon={Building}
              options={filterOptions.departments}
              selectedValues={filters.departments}
              onSelectionChange={(values: string[]) => handleFilterChange('departments', values)}
              getCount={(option: string) => getFilterCount('departments', option)}
              isOpen={openDropdown === 'departments'}
              onToggle={() => handleDropdownToggle('departments')}
            />
            <FilterDropdown
              title="Course"
              icon={GraduationCap}
              options={filterOptions.courses}
              selectedValues={filters.courses}
              onSelectionChange={(values) => handleFilterChange('courses', values)}
              getCount={(option) => getFilterCount('courses', option)}
              isOpen={openDropdown === 'courses'}
              onToggle={() => handleDropdownToggle('courses')}
            />
            <FilterDropdown
              title="Year Level"
              icon={Calendar}
              options={filterOptions.yearLevels}
              selectedValues={filters.yearLevels}
              onSelectionChange={(values) => handleFilterChange('yearLevels', values)}
              getCount={(option) => getFilterCount('yearLevels', option)}
              isOpen={openDropdown === 'yearLevels'}
              onToggle={() => handleDropdownToggle('yearLevels')}
            />
            <FilterDropdown
              title="Section"
              icon={Users}
              options={filterOptions.sections}
              selectedValues={filters.sections}
              onSelectionChange={(values) => handleFilterChange('sections', values)}
              getCount={(option) => getFilterCount('sections', option)}
              isOpen={openDropdown === 'sections'}
              onToggle={() => handleDropdownToggle('sections')}
            />
          </div>
        </div>
        {/* Attendance Criteria */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Attendance Criteria
          </h4>
          <div className="space-y-2">
            <FilterDropdown
              title="Attendance Rate"
              icon={Target}
              options={filterOptions.attendanceRates}
              selectedValues={filters.attendanceRates}
              onSelectionChange={(values) => handleFilterChange('attendanceRates', values)}
              getCount={(option) => getFilterCount('attendanceRates', option)}
              isOpen={openDropdown === 'attendanceRates'}
              onToggle={() => handleDropdownToggle('attendanceRates')}
            />
            <FilterDropdown
              title="Risk Level"
              icon={AlertTriangle}
              options={filterOptions.riskLevels}
              selectedValues={filters.riskLevels}
              onSelectionChange={(values) => handleFilterChange('riskLevels', values)}
              getCount={(option) => getFilterCount('riskLevels', option)}
              isOpen={openDropdown === 'riskLevels'}
              onToggle={() => handleDropdownToggle('riskLevels')}
            />
          </div>
        </div>
        {/* Student Information */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
            <User className="w-4 h-4" />
            Student Information
          </h4>
          <div className="space-y-2">
            <FilterDropdown
              title="Student Status"
              icon={UserCheck}
              options={filterOptions.studentStatuses}
              selectedValues={filters.studentStatuses}
              onSelectionChange={(values) => handleFilterChange('studentStatuses', values)}
              getCount={(option) => getFilterCount('studentStatuses', option)}
              isOpen={openDropdown === 'studentStatuses'}
              onToggle={() => handleDropdownToggle('studentStatuses')}
            />
            <FilterDropdown
              title="Student Type"
              icon={UserCheck}
              options={filterOptions.studentTypes}
              selectedValues={filters.studentTypes}
              onSelectionChange={(values) => handleFilterChange('studentTypes', values)}
              getCount={(option) => getFilterCount('studentTypes', option)}
              isOpen={openDropdown === 'studentTypes'}
              onToggle={() => handleDropdownToggle('studentTypes')}
            />
          </div>
        </div>
        {/* Subject Information */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            Subject Information
          </h4>
          <div className="space-y-2">
            <FilterDropdown
              title="Subject"
              icon={BookOpen}
              options={filterOptions.subjects}
              selectedValues={filters.subjects}
              onSelectionChange={(values) => handleFilterChange('subjects', values)}
              getCount={(option) => getFilterCount('subjects', option)}
              isOpen={openDropdown === 'subjects'}
              onToggle={() => handleDropdownToggle('subjects')}
            />
            <FilterDropdown
              title="Instructor"
              icon={User}
              options={filterOptions.subjectInstructors}
              selectedValues={filters.subjectInstructors}
              onSelectionChange={(values) => handleFilterChange('subjectInstructors', values)}
              getCount={(option) => getFilterCount('subjectInstructors', option)}
              isOpen={openDropdown === 'subjectInstructors'}
              onToggle={() => handleDropdownToggle('subjectInstructors')}
            />
            <FilterDropdown
              title="Room"
              icon={MapPin}
              options={filterOptions.subjectRooms}
              selectedValues={filters.subjectRooms}
              onSelectionChange={(values) => handleFilterChange('subjectRooms', values)}
              getCount={(option) => getFilterCount('subjectRooms', option)}
              isOpen={openDropdown === 'subjectRooms'}
              onToggle={() => handleDropdownToggle('subjectRooms')}
            />
          </div>
        </div>
      </div>
    </div>
  );
}; 