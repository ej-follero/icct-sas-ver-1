import React, { useState, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { RotateCcw } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Define the types locally to avoid import issues
interface Filters extends Record<string, string[]> {
  departments: string[];
  courses: string[];
  yearLevels: string[];
  attendanceRates: string[];
  riskLevels: string[];
  subjects: string[];
  statuses: string[];
  studentStatuses: string[];
  sections: string[];
}

interface FilterPreset {
  id: string;
  name: string;
  description: string;
  icon: any;
  filters: Partial<Filters>;
}

interface AdvancedFilters {
  attendanceRangeMin: number;
  attendanceRangeMax: number;
  dateRangeStart: string;
  dateRangeEnd: string;
  lastAttendanceDays: string;
  presentDaysMin: string;
  presentDaysMax: string;
  absentDaysMin: string;
  absentDaysMax: string;
  lateDaysMin: string;
  lateDaysMax: string;
  totalDaysMin: string;
  totalDaysMax: string;
  logicalOperator: 'AND' | 'OR';
  customTextFilter: string;
  excludeInactive: boolean;
  onlyRecentEnrollments: boolean;
  verificationStatus: string[];
  attendanceTypes: string[];
  eventTypes: string[];
  semester: string[];
  academicYear: string[];
  subjectScheduleDays: string[];
  subjectScheduleTimes: string[];
  timeOfDay: string[];
  attendanceTrends: string[];
  subjectEnrollments: string[];
  enrollmentStatuses: string[];
}

// SelectDropdown component to replace the missing one
interface SelectDropdownProps {
  value: string;
  onValueChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
}

const SelectDropdown: React.FC<SelectDropdownProps> = ({ value, onValueChange, options, placeholder }) => {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

/**
 * AdvancedFilterDropdown
 *
 * A collapsible, advanced filter panel for student attendance data, supporting quick, attendance, verification, and range filters.
 *
 * Props:
 * - filters: Current filter state
 * - setFilters: Setter for filter state
 * - advancedFilters: Current advanced filter state
 * - setAdvancedFilters: Setter for advanced filter state
 * - departments, courses, yearLevels, riskLevels, studentStatuses, studentTypes, sections: Filter options
 * - getFilterCount: Function to get count for each filter option
 * - filterPresets: Array of filter preset objects
 * - applyFilterPreset: Function to apply a preset
 * - isPresetActive: Function to check if a preset is active
 * - handleClearFilters: Callback to clear all filters
 */
export const AdvancedFilterDropdown = ({
  filters,
  setFilters,
  advancedFilters,
  setAdvancedFilters,
  departments,
  courses,
  yearLevels,
  riskLevels,
  studentStatuses,
  studentTypes,
  sections,
  getFilterCount,
  filterPresets,
  applyFilterPreset,
  isPresetActive,
  handleClearFilters
}: {
  filters: Filters;
  setFilters: (filters: Filters) => void;
  advancedFilters: AdvancedFilters;
  setAdvancedFilters: React.Dispatch<React.SetStateAction<AdvancedFilters>>;
  departments: string[];
  courses: string[];
  yearLevels: string[];
  riskLevels: string[];
  studentStatuses: string[];
  studentTypes: string[];
  sections: string[];
  getFilterCount: (filterType: string, option: string) => number;
  filterPresets: FilterPreset[];
  applyFilterPreset: (preset: FilterPreset) => void;
  isPresetActive: (preset: FilterPreset) => boolean;
  handleClearFilters: () => void;
}) => {
  // Validate props
  if (!setFilters || !setAdvancedFilters || !handleClearFilters) {
    console.error('AdvancedFilterDropdown: Missing required props');
    return null;
  }

  const totalActiveFilters = useMemo(() => 
    Object.values(filters).reduce((sum, filterArray) => sum + (Array.isArray(filterArray) ? filterArray.length : 0), 0), 
    [filters]
  );
  
  const [showQuickFilters, setShowQuickFilters] = useState(true);
  const [showAttendanceFilters, setShowAttendanceFilters] = useState(true);
  const [showRangeFilters, setShowRangeFilters] = useState(true);

  // Memoized handlers for better performance
  const handleDepartmentChange = useCallback((value: string) => {
    setFilters({ ...filters, departments: value === "all" ? [] : [value] });
  }, [filters, setFilters]);

  const handleAttendanceRateChange = useCallback((value: string) => {
    setFilters({ ...filters, attendanceRates: value === "all" ? [] : [value] });
  }, [filters, setFilters]);

  const handleYearLevelChange = useCallback((value: string) => {
    setFilters({ ...filters, yearLevels: value === "all-levels" ? [] : [value] });
  }, [filters, setFilters]);

  const handleRiskLevelChange = useCallback((value: string) => {
    setFilters({ ...filters, riskLevels: value === "all-risk" ? [] : [value] });
  }, [filters, setFilters]);

  const handleCourseChange = useCallback((value: string) => {
    setFilters({ ...filters, courses: value === "all-courses" ? [] : [value] });
  }, [filters, setFilters]);

  const handleSectionChange = useCallback((value: string) => {
    setFilters({ ...filters, sections: value === "all-sections" ? [] : [value] });
  }, [filters, setFilters]);

  const handleStudentStatusChange = useCallback((value: string) => {
    setFilters({ ...filters, studentStatuses: value === "all-status" ? [] : [value] });
  }, [filters, setFilters]);

  const handleVerificationStatusChange = useCallback((value: string) => {
    setAdvancedFilters({ ...advancedFilters, verificationStatus: value === "all-status" ? [] : [value] });
  }, [advancedFilters, setAdvancedFilters]);

  const handleAttendanceTypeChange = useCallback((value: string) => {
    setAdvancedFilters({ ...advancedFilters, attendanceTypes: value === "all-types" ? [] : [value] });
  }, [advancedFilters, setAdvancedFilters]);

  const handleEventTypeChange = useCallback((value: string) => {
    setAdvancedFilters({ ...advancedFilters, eventTypes: value === "all-events" ? [] : [value] });
  }, [advancedFilters, setAdvancedFilters]);

  const handleSemesterChange = useCallback((value: string) => {
    setAdvancedFilters({ ...advancedFilters, semester: value === "all-semesters" ? [] : [value] });
  }, [advancedFilters, setAdvancedFilters]);

  const handleAcademicYearChange = useCallback((value: string) => {
    setAdvancedFilters({ ...advancedFilters, academicYear: value === "all-years" ? [] : [value] });
  }, [advancedFilters, setAdvancedFilters]);

  const handleAttendanceRangeMinChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setAdvancedFilters((prev: AdvancedFilters) => ({...prev, attendanceRangeMin: parseInt(e.target.value) || 0}));
  }, [setAdvancedFilters]);

  const handleAttendanceRangeMaxChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setAdvancedFilters((prev: AdvancedFilters) => ({...prev, attendanceRangeMax: parseInt(e.target.value) || 100}));
  }, [setAdvancedFilters]);

  const handleDateRangeStartChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setAdvancedFilters((prev: AdvancedFilters) => ({...prev, dateRangeStart: e.target.value}));
  }, [setAdvancedFilters]);

  const handleDateRangeEndChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setAdvancedFilters((prev: AdvancedFilters) => ({...prev, dateRangeEnd: e.target.value}));
  }, [setAdvancedFilters]);

  const resetAdvancedFilters = useCallback(() => {
    setAdvancedFilters({
      attendanceRangeMin: 0,
      attendanceRangeMax: 100,
      dateRangeStart: '',
      dateRangeEnd: '',
      lastAttendanceDays: '',
      presentDaysMin: '',
      presentDaysMax: '',
      absentDaysMin: '',
      absentDaysMax: '',
      lateDaysMin: '',
      lateDaysMax: '',
      totalDaysMin: '',
      totalDaysMax: '',
      logicalOperator: 'AND',
      customTextFilter: '',
      excludeInactive: false,
      onlyRecentEnrollments: false,
      verificationStatus: [],
      attendanceTypes: [],
      eventTypes: [],
      semester: [],
      academicYear: [],
      subjectScheduleDays: [],
      subjectScheduleTimes: [],
      timeOfDay: [],
      attendanceTrends: [],
      subjectEnrollments: [],
      enrollmentStatuses: []
    });
  }, [setAdvancedFilters]);
  return (
    <div className="space-y-8">
      {/* Quick Filters Section (collapsible) */}
      <div className="bg-blue-50/50 rounded-xl border border-blue-100 shadow-sm p-4">
        <button
          type="button"
          className="flex items-center gap-2 mb-3 w-full"
          onClick={() => setShowQuickFilters((prev) => !prev)}
        >
          <h4 className="text-xs font-semibold text-blue-900 flex-1 text-left">Quick Filters</h4>
          <span>{showQuickFilters ? '▲' : '▼'}</span>
        </button>
        {showQuickFilters && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
            {/* Department Filter */}
            <div className="flex flex-col">
              <label className="text-xs font-semibold text-blue-700 mb-1 flex items-center gap-1">Department</label>
              <SelectDropdown
                value={filters.departments[0] || "all"}
                onValueChange={handleDepartmentChange}
                options={[
                  { value: "all", label: "All Departments" },
                  ...departments.map((dept) => ({ value: dept, label: dept })),
                ]}
                placeholder="All Departments"
              />
            </div>
            {/* Attendance Rate Filter */}
            <div className="flex flex-col">
              <label className="text-xs font-semibold text-blue-700 mb-1 flex items-center gap-1">Attendance Rate</label>
              <SelectDropdown
                value={filters.attendanceRates[0] || "all"}
                onValueChange={handleAttendanceRateChange}
                options={[
                  { value: "all", label: "All Rates" },
                  { value: "High (≥90%)", label: "High (≥90%)" },
                  { value: "Medium (75-89%)", label: "Medium (75-89%)" },
                  { value: "Low (<75%)", label: "Low (<75%)" },
                ]}
                placeholder="All Rates"
              />
            </div>
            {/* Year Level Filter */}
            <div className="flex flex-col">
              <label className="text-xs font-semibold text-blue-700 mb-1 flex items-center gap-1">Year Level</label>
              <SelectDropdown
                value={filters.yearLevels[0] || "all-levels"}
                onValueChange={handleYearLevelChange}
                options={[
                  { value: "all-levels", label: "All Levels" },
                  ...yearLevels.map((level) => ({ value: level, label: level })),
                ]}
                placeholder="All Levels"
              />
            </div>
            {/* Risk Level Filter */}
            <div className="flex flex-col">
              <label className="text-xs font-semibold text-blue-700 mb-1 flex items-center gap-1">Risk Level</label>
              <SelectDropdown
                value={filters.riskLevels[0] || "all-risk"}
                onValueChange={handleRiskLevelChange}
                options={[
                  { value: "all-risk", label: "All Risk Levels" },
                  ...riskLevels.map((risk) => ({ value: risk, label: risk })),
                ]}
                placeholder="All Risk Levels"
              />
            </div>
            {/* Course Filter */}
            <div className="flex flex-col">
              <label className="text-xs font-semibold text-blue-700 mb-1 flex items-center gap-1">Course</label>
              <SelectDropdown
                value={filters.courses[0] || "all-courses"}
                onValueChange={handleCourseChange}
                options={[
                  { value: "all-courses", label: "All Courses" },
                  ...courses.map((course) => ({ value: course, label: course })),
                ]}
                placeholder="All Courses"
              />
            </div>
            {/* Section Filter */}
            <div className="flex flex-col">
              <label className="text-xs font-semibold text-blue-700 mb-1 flex items-center gap-1">Section</label>
              <SelectDropdown
                value={filters.sections[0] || "all-sections"}
                onValueChange={handleSectionChange}
                options={[
                  { value: "all-sections", label: "All Sections" },
                  ...sections.map((section) => ({ value: section, label: section })),
                ]}
                placeholder="All Sections"
              />
            </div>
          </div>
        )}
      </div>
      <div className="border-b border-blue-200 my-2"></div>
      {/* Attendance & Verification Filters Section (collapsible) */}
      <div className="bg-blue-50/50 rounded-xl border border-blue-100 shadow-sm p-4">
        <button
          type="button"
          className="flex items-center gap-2 mb-3 w-full"
          onClick={() => setShowAttendanceFilters((prev) => !prev)}
        >
          <h4 className="text-xs font-semibold text-blue-900 flex-1 text-left">Attendance & Verification Filters</h4>
          <span>{showAttendanceFilters ? '▲' : '▼'}</span>
        </button>
        {showAttendanceFilters && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
            {/* Verification Status Filter */}
            <div className="flex flex-col">
              <label className="text-xs font-semibold text-blue-700 mb-1 flex items-center gap-1">Verification Status</label>
              <SelectDropdown
                value={advancedFilters.verificationStatus[0] || "all-status"}
                onValueChange={handleVerificationStatusChange}
                options={[
                  { value: "all-status", label: "All Statuses" },
                  { value: "PENDING", label: "Pending" },
                  { value: "VERIFIED", label: "Verified" },
                  { value: "DISPUTED", label: "Disputed" },
                  { value: "REJECTED", label: "Rejected" },
                ]}
                placeholder="All Statuses"
              />
            </div>
            {/* Attendance Type Filter */}
            <div className="flex flex-col">
              <label className="text-xs font-semibold text-blue-700 mb-1 flex items-center gap-1">Attendance Type</label>
              <SelectDropdown
                value={advancedFilters.attendanceTypes[0] || "all-types"}
                onValueChange={handleAttendanceTypeChange}
                options={[
                  { value: "all-types", label: "All Types" },
                  { value: "RFID_SCAN", label: "RFID Scan" },
                  { value: "MANUAL_ENTRY", label: "Manual Entry" },
                  { value: "ONLINE", label: "Online" },
                ]}
                placeholder="All Types"
              />
            </div>
            {/* Event Type Filter */}
            <div className="flex flex-col">
              <label className="text-xs font-semibold text-blue-700 mb-1 flex items-center gap-1">Event Type</label>
              <SelectDropdown
                value={advancedFilters.eventTypes[0] || "all-events"}
                onValueChange={handleEventTypeChange}
                options={[
                  { value: "all-events", label: "All Events" },
                  { value: "REGULAR", label: "Regular" },
                  { value: "EVENT", label: "Event" },
                ]}
                placeholder="All Events"
              />
            </div>
            {/* Semester Filter */}
            <div className="flex flex-col">
              <label className="text-xs font-semibold text-blue-700 mb-1 flex items-center gap-1">Semester</label>
              <SelectDropdown
                value={advancedFilters.semester[0] || "all-semesters"}
                onValueChange={handleSemesterChange}
                options={[
                  { value: "all-semesters", label: "All Semesters" },
                  { value: "2024-1", label: "2024-1" },
                  { value: "2024-2", label: "2024-2" },
                  { value: "2023-1", label: "2023-1" },
                ]}
                placeholder="All Semesters"
              />
            </div>
            {/* Academic Year Filter */}
            <div className="flex flex-col">
              <label className="text-xs font-semibold text-blue-700 mb-1 flex items-center gap-1">Academic Year</label>
              <SelectDropdown
                value={advancedFilters.academicYear[0] || "all-years"}
                onValueChange={handleAcademicYearChange}
                options={[
                  { value: "all-years", label: "All Years" },
                  { value: "2023-2024", label: "2023-2024" },
                  { value: "2022-2023", label: "2022-2023" },
                  { value: "2021-2022", label: "2021-2022" },
                ]}
                placeholder="All Years"
              />
            </div>
            {/* Student Status Filter */}
            <div className="flex flex-col">
              <label className="text-xs font-medium text-blue-700 mb-2 flex items-center gap-2">Student Status</label>
              <SelectDropdown
                value={filters.studentStatuses[0] || "all-status"}
                onValueChange={handleStudentStatusChange}
                options={[
                  { value: "all-status", label: "All Status" },
                  { value: "ACTIVE", label: "Active" },
                  { value: "INACTIVE", label: "Inactive" },
                ]}
                placeholder="All Status"
              />
            </div>
          </div>
        )}
      </div>
      <div className="border-b border-blue-200 my-2"></div>
      {/* Range Filters Section (collapsible) */}
      <div className="bg-blue-50/50 rounded-xl border border-blue-100 shadow-sm p-4">
        <button
          type="button"
          className="flex items-center gap-2 mb-3 w-full"
          onClick={() => setShowRangeFilters((prev) => !prev)}
        >
          <h4 className="text-xs font-semibold text-blue-900 flex-1 text-left">Range Filters</h4>
          <span>{showRangeFilters ? '▲' : '▼'}</span>
        </button>
        {showRangeFilters && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Attendance Range */}
            <div className="bg-white rounded-lg p-3 border border-blue-100 shadow-sm rounded-xl">
              <label className="text-xs font-medium text-blue-700 mb-2 flex items-center gap-2">Attendance Range (%)</label>
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={advancedFilters.attendanceRangeMin}
                    onChange={handleAttendanceRangeMinChange}
                    className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none text-blue-700 bg-gray-50"
                    placeholder="Min"
                  />
                </div>
                <span className="text-xs text-gray-500 font-medium">to</span>
                <div className="flex-1">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={advancedFilters.attendanceRangeMax}
                    onChange={handleAttendanceRangeMaxChange}
                    className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none text-blue-700 bg-gray-50"
                    placeholder="Max"
                  />
                </div>
              </div>
            </div>
            {/* Date Range */}
            <div className="bg-white rounded-xl p-3 border border-blue-100 shadow-sm">
              <label className="text-xs font-medium text-blue-700 mb-2 flex items-center gap-2">Date Range</label>
              <div className="flex flex-row items-end gap-2">
                <div className="flex-1 min-w-0">
                  <input
                    type="date"
                    value={advancedFilters.dateRangeStart}
                    onChange={handleDateRangeStartChange}
                    className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none text-blue-700 bg-gray-50"
                  />
                </div>
                <span className="text-xs text-gray-500 mb-3">to</span>
                <div className="flex-1 min-w-0">
                  <input
                    type="date"
                    value={advancedFilters.dateRangeEnd}
                    onChange={handleDateRangeEndChange}
                    className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none text-blue-700 bg-gray-50"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      {/* Action Buttons remain at the bottom */}
      <div className="flex items-center justify-between pt-3 border-t border-blue-100">
        <div className="flex items-center gap-2">
          <Button
            onClick={resetAdvancedFilters}
            size="sm"
            className="h-7 px-3 text-xs rounded border-blue-200"
          >
            <RotateCcw className="w-3 h-3 mr-1" />
            Reset Filters
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse"></div>
          <span className="text-xs text-blue-600 font-medium">
            {totalActiveFilters > 0
              ? `${totalActiveFilters} filter${totalActiveFilters !== 1 ? 's' : ''} active`
              : 'No filters applied'}
          </span>
        </div>
      </div>
    </div>
  );
}; 