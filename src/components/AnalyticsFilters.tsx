"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp, Filter, X } from 'lucide-react';

export interface FilterOptions {
  departments: Array<{ id: string; name: string }>;
  courses: Array<{ id: string; name: string; departmentId: string }>;
  subjects: Array<{ id: string; name: string; courseId: string }>;
  sections: Array<{ id: string; name: string; subjectId: string }>;
}

export interface AnalyticsFilters {
  departmentId?: string;
  courseId?: string;
  subjectId?: string;
  sectionId?: string;
}

interface AnalyticsFiltersProps {
  filters: AnalyticsFilters;
  onFiltersChange: (filters: AnalyticsFilters) => void;
  filterOptions: FilterOptions;
  loading?: boolean;
}

export function AnalyticsFilters({
  filters,
  onFiltersChange,
  filterOptions,
  loading = false
}: AnalyticsFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);

  // Calculate active filters count
  useEffect(() => {
    const count = Object.values(filters).filter(value => value && value !== 'all').length;
    setActiveFiltersCount(count);
  }, [filters]);

  // Filter courses based on selected department
  const filteredCourses = filters.departmentId && filters.departmentId !== 'all'
    ? filterOptions.courses.filter(course => course.departmentId === filters.departmentId)
    : filterOptions.courses;

  // Filter subjects based on selected course
  const filteredSubjects = filters.courseId && filters.courseId !== 'all'
    ? filterOptions.subjects.filter(subject => subject.courseId === filters.courseId)
    : filterOptions.subjects;

  // Filter sections based on selected subject
  const filteredSections = filters.subjectId && filters.subjectId !== 'all'
    ? filterOptions.sections.filter(section => section.subjectId === filters.subjectId)
    : filterOptions.sections;

  const handleFilterChange = (key: keyof AnalyticsFilters, value: string) => {
    const newFilters = { ...filters };
    
    if (value === 'all') {
      delete newFilters[key];
    } else {
      newFilters[key] = value;
    }

    // Reset dependent filters when parent filter changes
    if (key === 'departmentId') {
      delete newFilters.courseId;
      delete newFilters.subjectId;
      delete newFilters.sectionId;
    } else if (key === 'courseId') {
      delete newFilters.subjectId;
      delete newFilters.sectionId;
    } else if (key === 'subjectId') {
      delete newFilters.sectionId;
    }

    onFiltersChange(newFilters);
  };

  const clearAllFilters = () => {
    onFiltersChange({});
  };

  const getFilterLabel = (key: keyof AnalyticsFilters) => {
    const labels = {
      departmentId: 'Department',
      courseId: 'Course',
      subjectId: 'Subject',
      sectionId: 'Section'
    };
    return labels[key];
  };

  const getFilterValue = (key: keyof AnalyticsFilters) => {
    const value = filters[key];
    if (!value || value === 'all') return 'All';
    
    const options = {
      departmentId: filterOptions.departments,
      courseId: filteredCourses,
      subjectId: filteredSubjects,
      sectionId: filteredSections
    };
    
    const option = options[key].find(opt => opt.id === value);
    return option?.name || 'All';
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Analytics Filters
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {activeFiltersCount} active
              </Badge>
            )}
          </CardTitle>
          {activeFiltersCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4 mr-1" />
              Clear All
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Primary Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Department Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              Department
            </label>
            <Select
              value={filters.departmentId || 'all'}
              onValueChange={(value) => handleFilterChange('departmentId', value)}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {filterOptions.departments.map((dept) => (
                  <SelectItem key={dept.id} value={dept.id}>
                    {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Course Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              Course
            </label>
            <Select
              value={filters.courseId || 'all'}
              onValueChange={(value) => handleFilterChange('courseId', value)}
              disabled={loading || filteredCourses.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select course" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Courses</SelectItem>
                {filteredCourses.map((course) => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Subject Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              Subject
            </label>
            <Select
              value={filters.subjectId || 'all'}
              onValueChange={(value) => handleFilterChange('subjectId', value)}
              disabled={loading || filteredSubjects.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select subject" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subjects</SelectItem>
                {filteredSubjects.map((subject) => (
                  <SelectItem key={subject.id} value={subject.id}>
                    {subject.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Advanced Filters */}
        <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-between p-0 h-auto font-normal"
            >
              <span className="text-sm text-muted-foreground">
                Advanced Filters
              </span>
              {showAdvanced ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 pt-4">
            {/* Section Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                Section
              </label>
              <Select
                value={filters.sectionId || 'all'}
                onValueChange={(value) => handleFilterChange('sectionId', value)}
                disabled={loading || filteredSections.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select section" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sections</SelectItem>
                  {filteredSections.map((section) => (
                    <SelectItem key={section.id} value={section.id}>
                      {section.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Active Filters Display */}
        {activeFiltersCount > 0 && (
          <div className="pt-4 border-t">
            <div className="flex flex-wrap gap-2">
              {Object.entries(filters).map(([key, value]) => {
                if (!value || value === 'all') return null;
                return (
                  <Badge
                    key={key}
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    {getFilterLabel(key as keyof AnalyticsFilters)}: {getFilterValue(key as keyof AnalyticsFilters)}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 hover:bg-transparent"
                      onClick={() => handleFilterChange(key as keyof AnalyticsFilters, 'all')}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
