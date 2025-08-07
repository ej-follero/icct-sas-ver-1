import React from 'react';
import { Button } from '@/components/ui/button';

interface AdvancedFilterBarProps {
  advancedFilters: any;
  setAdvancedFilters: (filters: any) => void;
  filterOptions: {
    verificationStatus: string[];
    attendanceTypes: string[];
    eventTypes: string[];
    semester: string[];
    academicYear: string[];
    // Add more as needed
  };
  onReset: () => void;
}

const AdvancedFilterBar: React.FC<AdvancedFilterBarProps> = ({
  advancedFilters,
  setAdvancedFilters,
  filterOptions,
  onReset
}) => {
  return (
    <div className="space-y-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Verification Status */}
        <div className="flex flex-col">
          <label className="text-xs font-semibold text-blue-700 mb-1">Verification Status</label>
          <select
            value={advancedFilters.verificationStatus[0] || ''}
            onChange={e => setAdvancedFilters({ ...advancedFilters, verificationStatus: e.target.value ? [e.target.value] : [] })}
            className="border border-gray-300 rounded px-2 py-1 text-sm bg-white"
          >
            <option value="">All Statuses</option>
            {filterOptions.verificationStatus.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
        {/* Attendance Type */}
        <div className="flex flex-col">
          <label className="text-xs font-semibold text-blue-700 mb-1">Attendance Type</label>
          <select
            value={advancedFilters.attendanceTypes[0] || ''}
            onChange={e => setAdvancedFilters({ ...advancedFilters, attendanceTypes: e.target.value ? [e.target.value] : [] })}
            className="border border-gray-300 rounded px-2 py-1 text-sm bg-white"
          >
            <option value="">All Types</option>
            {filterOptions.attendanceTypes.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
        {/* Event Type */}
        <div className="flex flex-col">
          <label className="text-xs font-semibold text-blue-700 mb-1">Event Type</label>
          <select
            value={advancedFilters.eventTypes[0] || ''}
            onChange={e => setAdvancedFilters({ ...advancedFilters, eventTypes: e.target.value ? [e.target.value] : [] })}
            className="border border-gray-300 rounded px-2 py-1 text-sm bg-white"
          >
            <option value="">All Events</option>
            {filterOptions.eventTypes.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
        {/* Semester */}
        <div className="flex flex-col">
          <label className="text-xs font-semibold text-blue-700 mb-1">Semester</label>
          <select
            value={advancedFilters.semester[0] || ''}
            onChange={e => setAdvancedFilters({ ...advancedFilters, semester: e.target.value ? [e.target.value] : [] })}
            className="border border-gray-300 rounded px-2 py-1 text-sm bg-white"
          >
            <option value="">All Semesters</option>
            {filterOptions.semester.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
        {/* Academic Year */}
        <div className="flex flex-col">
          <label className="text-xs font-semibold text-blue-700 mb-1">Academic Year</label>
          <select
            value={advancedFilters.academicYear[0] || ''}
            onChange={e => setAdvancedFilters({ ...advancedFilters, academicYear: e.target.value ? [e.target.value] : [] })}
            className="border border-gray-300 rounded px-2 py-1 text-sm bg-white"
          >
            <option value="">All Years</option>
            {filterOptions.academicYear.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={onReset}>
          Reset Advanced Filters
        </Button>
      </div>
    </div>
  );
};

export default AdvancedFilterBar; 