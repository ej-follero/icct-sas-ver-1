'use client';

import React, { useMemo, useCallback, memo } from 'react';
import { FixedSizeList as List } from 'react-window';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { Eye, Edit, Trash2 } from 'lucide-react';
import { StudentAttendance } from '@/types/student-attendance';

interface StudentTableProps {
  students: StudentAttendance[];
  selectedIds: Set<string>;
  onSelectionChange: (studentId: string, selected: boolean) => void;
  onSelectAll: (selected: boolean) => void;
  onStudentClick: (student: StudentAttendance) => void;
  onViewStudent: (student: StudentAttendance) => void;
  onEditStudent: (student: StudentAttendance) => void;
  onDeleteStudent: (student: StudentAttendance) => void;
  sortBy: string;
  onSortChange: (field: string) => void;
  isLoading?: boolean;
  height?: number;
  itemHeight?: number;
}

const OptimizedStudentTable = memo<StudentTableProps>(({
  students,
  selectedIds,
  onSelectionChange,
  onSelectAll,
  onStudentClick,
  onViewStudent,
  onEditStudent,
  onDeleteStudent,
  sortBy,
  onSortChange,
  isLoading = false,
  height = 600,
  itemHeight = 60
}) => {
  const allSelected = students.length > 0 && students.every(s => selectedIds.has(s.id));
  const someSelected = students.some(s => selectedIds.has(s.id)) && !allSelected;

  const handleSelectAll = useCallback((checked: boolean) => {
    onSelectAll(checked);
  }, [onSelectAll]);

  const handleRowSelect = useCallback((studentId: string, checked: boolean) => {
    onSelectionChange(studentId, checked);
  }, [onSelectionChange]);

  const getAttendanceRateColor = useCallback((rate: number) => {
    if (rate >= 90) return { text: 'text-green-700', bg: 'bg-green-100', border: 'border-green-200' };
    if (rate >= 75) return { text: 'text-yellow-700', bg: 'bg-yellow-100', border: 'border-yellow-200' };
    return { text: 'text-red-700', bg: 'bg-red-100', border: 'border-red-200' };
  }, []);

  const getStatusConfig = useCallback((status: string) => {
    const configs = {
      'ACTIVE': { color: 'text-green-700', bg: 'bg-green-100', label: 'Active' },
      'INACTIVE': { color: 'text-gray-700', bg: 'bg-gray-100', label: 'Inactive' },
      'TRANSFERRED': { color: 'text-blue-700', bg: 'bg-blue-100', label: 'Transferred' },
      'GRADUATED': { color: 'text-purple-700', bg: 'bg-purple-100', label: 'Graduated' }
    };
    return configs[status as keyof typeof configs] || configs.INACTIVE;
  }, []);

  const SortableHeader = useMemo(() => {
    return React.memo<{
      field: string;
      label: string;
      currentSort: string;
      onSort: (field: string) => void;
    }>(({ field, label, currentSort, onSort }) => {
      const isActive = currentSort === field || currentSort === `${field}-desc`;
      const isDesc = currentSort === `${field}-desc`;

      return (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onSort(field)}
          className="h-8 px-2 font-medium text-xs hover:bg-gray-100"
        >
          {label}
          {isActive && (
            <span className="ml-1">
              {isDesc ? '↓' : '↑'}
            </span>
          )}
        </Button>
      );
    });
  }, []);

  const StudentRow = useMemo(() => {
    return React.memo<{
      index: number;
      style: React.CSSProperties;
      data: {
        students: StudentAttendance[];
        selectedIds: Set<string>;
        onSelectionChange: (studentId: string, selected: boolean) => void;
        onStudentClick: (student: StudentAttendance) => void;
        onViewStudent: (student: StudentAttendance) => void;
        onEditStudent: (student: StudentAttendance) => void;
        onDeleteStudent: (student: StudentAttendance) => void;
        getAttendanceRateColor: (rate: number) => { text: string; bg: string; border: string };
        getStatusConfig: (status: string) => { color: string; bg: string; label: string };
      };
    }>(({ index, style, data }) => {
      const student = data.students[index];
      const isSelected = data.selectedIds.has(student.id);
      const attendanceColor = data.getAttendanceRateColor(student.attendanceRate);
      const statusConfig = data.getStatusConfig(student.status);

      return (
        <div
          style={style}
          className={`flex items-center border-b border-gray-100 hover:bg-gray-50 transition-colors ${
            isSelected ? 'bg-blue-50' : ''
          }`}
        >
          {/* Select Checkbox */}
          <div className="w-12 flex justify-center">
            <Checkbox
              checked={isSelected}
              onCheckedChange={(checked) => data.onSelectionChange(student.id, checked as boolean)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          {/* Student Info */}
          <div className="flex-1 flex items-center space-x-3 px-4 py-2">
            <div className="relative">
              <Avatar className="h-10 w-10 ring-1 ring-gray-200">
                <AvatarImage src={student.avatarUrl} className="object-cover" />
                <AvatarFallback className="bg-blue-100 text-blue-700 font-bold text-sm">
                  {`${student.firstName?.[0] || ''}${student.lastName?.[0] || ''}` || 
                   student.studentName.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              {student.status === 'ACTIVE' && (
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border border-white"></div>
              )}
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <div className="font-semibold text-gray-900 truncate">
                {student.studentName}
              </div>
              <div className="text-sm text-gray-600 truncate">{student.studentId}</div>
            </div>
          </div>

          {/* Department */}
          <div className="w-32 px-4 py-2 text-sm text-gray-700 truncate">
            {student.department}
          </div>

          {/* Course */}
          <div className="w-32 px-4 py-2 text-sm text-gray-700 truncate">
            {student.course}
          </div>

          {/* Year Level */}
          <div className="w-24 px-4 py-2 text-sm text-gray-700 text-center">
            {student.yearLevel}
          </div>

          {/* Attendance Rate */}
          <div className="w-32 px-4 py-2 text-center">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${attendanceColor.text} ${attendanceColor.bg} ${attendanceColor.border} border`}>
              {student.attendanceRate}%
            </span>
          </div>

          {/* Status */}
          <div className="w-24 px-4 py-2 text-center">
            <Badge className={`${statusConfig.color} ${statusConfig.bg} text-xs px-3 py-1 rounded-full`}>
              {statusConfig.label}
            </Badge>
          </div>

          {/* Actions */}
          <div className="w-32 px-4 py-2 flex items-center justify-center space-x-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      data.onViewStudent(student);
                    }}
                  >
                    <Eye className="h-4 w-4 text-blue-600" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>View Details</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      data.onEditStudent(student);
                    }}
                  >
                    <Edit className="h-4 w-4 text-green-600" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Edit Student</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      data.onDeleteStudent(student);
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Delete Student</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      );
    });
  }, []);

  const listData = useMemo(() => ({
    students,
    selectedIds,
    onSelectionChange: handleRowSelect,
    onStudentClick,
    onViewStudent,
    onEditStudent,
    onDeleteStudent,
    getAttendanceRateColor,
    getStatusConfig
  }), [
    students,
    selectedIds,
    handleRowSelect,
    onStudentClick,
    onViewStudent,
    onEditStudent,
    onDeleteStudent,
    getAttendanceRateColor,
    getStatusConfig
  ]);

  if (isLoading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="p-4 border-b border-gray-200">
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          </div>
        </div>
        <div className="p-4">
          <div className="space-y-3">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="animate-pulse flex items-center space-x-4">
                <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg">
      {/* Table Header */}
      <div className="border-b border-gray-200 bg-gray-50">
        <div className="flex items-center h-12 px-4">
          <div className="w-12 flex justify-center">
            <Checkbox
              checked={allSelected}
              ref={(el) => {
                if (el) el.indeterminate = someSelected;
              }}
              onCheckedChange={handleSelectAll}
            />
          </div>
          
          <div className="flex-1 flex items-center space-x-3 px-4">
            <span className="font-medium text-sm text-gray-700">Student</span>
          </div>
          
          <div className="w-32 px-4">
            <SortableHeader
              field="department"
              label="Department"
              currentSort={sortBy}
              onSort={onSortChange}
            />
          </div>
          
          <div className="w-32 px-4">
            <SortableHeader
              field="course"
              label="Course"
              currentSort={sortBy}
              onSort={onSortChange}
            />
          </div>
          
          <div className="w-24 px-4">
            <SortableHeader
              field="yearLevel"
              label="Year Level"
              currentSort={sortBy}
              onSort={onSortChange}
            />
          </div>
          
          <div className="w-32 px-4">
            <SortableHeader
              field="attendanceRate"
              label="Attendance Rate"
              currentSort={sortBy}
              onSort={onSortChange}
            />
          </div>
          
          <div className="w-24 px-4">
            <SortableHeader
              field="status"
              label="Status"
              currentSort={sortBy}
              onSort={onSortChange}
            />
          </div>
          
          <div className="w-32 px-4 text-center">
            <span className="font-medium text-sm text-gray-700">Actions</span>
          </div>
        </div>
      </div>

      {/* Virtualized Table Body */}
      <div style={{ height }}>
        <List
          height={height}
          itemCount={students.length}
          itemSize={itemHeight}
          itemData={listData}
        >
          {StudentRow}
        </List>
      </div>

      {students.length === 0 && !isLoading && (
        <div className="p-8 text-center text-gray-500">
          No students found matching your criteria.
        </div>
      )}
    </div>
  );
});

OptimizedStudentTable.displayName = 'OptimizedStudentTable';

export default OptimizedStudentTable; 