'use client';

import React, { useMemo, useCallback, memo } from 'react';
import { Filter, Search, X, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { useDebounce } from '@/hooks/use-debounce';

interface FilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filters: Record<string, string[]>;
  onFilterChange: (filterType: string, values: string[]) => void;
  filterOptions: Record<string, string[]>;
  totalActiveFilters: number;
  onClearAll: () => void;
  isLoading?: boolean;
}

const OptimizedFilterBar = memo<FilterBarProps>(({
  searchQuery,
  onSearchChange,
  filters,
  onFilterChange,
  filterOptions,
  totalActiveFilters,
  onClearAll,
  isLoading = false
}) => {
  const debouncedSearch = useDebounce(searchQuery, 300);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onSearchChange(e.target.value);
  }, [onSearchChange]);

  const handleFilterChange = useCallback((filterType: string, value: string, checked: boolean) => {
    const currentValues = filters[filterType] || [];
    const newValues = checked 
      ? [...currentValues, value]
      : currentValues.filter(v => v !== value);
    onFilterChange(filterType, newValues);
  }, [filters, onFilterChange]);

  const getFilterCount = useCallback((filterType: string, option: string) => {
    // This would be calculated from actual data in a real implementation
    return Math.floor(Math.random() * 50) + 1;
  }, []);

  const FilterDropdown = useMemo(() => {
    return React.memo<{
      title: string;
      icon: React.ComponentType<any>;
      options: string[];
      selectedValues: string[];
      onSelectionChange: (values: string[]) => void;
      getCount: (option: string) => number;
    }>(({ title, icon: Icon, options, selectedValues, onSelectionChange, getCount }) => {
      const [isOpen, setIsOpen] = React.useState(false);

      const handleCheckboxChange = (option: string, checked: boolean) => {
        const newValues = checked 
          ? [...selectedValues, option]
          : selectedValues.filter(v => v !== option);
        onSelectionChange(newValues);
      };

      return (
        <div className="relative">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsOpen(!isOpen)}
            className="h-8 px-3 text-xs"
            disabled={isLoading}
          >
            <Icon className="h-3 w-3 mr-1" />
            {title}
            {selectedValues.length > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 text-xs">
                {selectedValues.length}
              </Badge>
            )}
            {isOpen ? <ChevronUp className="h-3 w-3 ml-1" /> : <ChevronDown className="h-3 w-3 ml-1" />}
          </Button>

          {isOpen && (
            <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-60 overflow-y-auto">
              <div className="p-2">
                {options.map((option) => (
                  <label key={option} className="flex items-center space-x-2 p-1 hover:bg-gray-50 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedValues.includes(option)}
                      onChange={(e) => handleCheckboxChange(option, e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-sm flex-1">{option}</span>
                    <span className="text-xs text-gray-500">({getCount(option)})</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    });
  }, []);

  return (
    <div className="bg-white border-b border-gray-200 p-4 space-y-4">
      {/* Search Bar */}
      <div className="flex items-center space-x-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search students, departments, courses..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="pl-10"
            disabled={isLoading}
          />
        </div>
        
        {totalActiveFilters > 0 && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onClearAll}
                  className="h-8 px-3"
                  disabled={isLoading}
                >
                  <X className="h-3 w-3 mr-1" />
                  Clear ({totalActiveFilters})
                </Button>
              </TooltipTrigger>
              <TooltipContent>Clear all filters</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

      {/* Filter Dropdowns */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(filterOptions).map(([filterType, options]) => (
          <FilterDropdown
            key={filterType}
            title={filterType.charAt(0).toUpperCase() + filterType.slice(1)}
            icon={Filter}
            options={options}
            selectedValues={filters[filterType] || []}
            onSelectionChange={(values) => onFilterChange(filterType, values)}
            getCount={getFilterCount}
          />
        ))}
      </div>
    </div>
  );
});

OptimizedFilterBar.displayName = 'OptimizedFilterBar';

export default OptimizedFilterBar; 