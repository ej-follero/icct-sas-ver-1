'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Filter, X, Check } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

interface FilterOption {
  value: string;
  label: string;
  count: number;
}

interface FilterSection {
  key: string;
  title: string;
  options: FilterOption[];
}

interface FilterDialogProps {
  filters: Record<string, string[]>;
  filterSections: FilterSection[];
  onApplyFilters: (filters: Record<string, string[]>) => void;
  onClearFilters: () => void;
  trigger?: React.ReactNode;
}

export function FilterDialog({
  filters,
  filterSections,
  onApplyFilters,
  onClearFilters,
  trigger
}: FilterDialogProps) {
  // Validate props
  if (!onApplyFilters || !onClearFilters) {
    console.error('FilterDialog: Missing required props');
    return null;
  }

  const [isOpen, setIsOpen] = useState(false);
  const [localFilters, setLocalFilters] = useState<Record<string, string[]>>(filters);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const handleOptionToggle = useCallback((sectionKey: string, value: string) => {
    try {
      setLocalFilters(prev => {
        const currentValues = prev[sectionKey] || [];
        const newValues = currentValues.includes(value)
          ? currentValues.filter(v => v !== value)
          : [...currentValues, value];
        
        return {
          ...prev,
          [sectionKey]: newValues
        };
      });
    } catch (error) {
      console.error('Error toggling option:', error);
    }
  }, []);

  const handleSectionToggle = useCallback((sectionKey: string, checked: boolean) => {
    try {
      if (checked) {
        // Select all options in the section
        const allValues = filterSections
          .find(section => section.key === sectionKey)
          ?.options.map(option => option.value) || [];
        
        setLocalFilters(prev => ({
          ...prev,
          [sectionKey]: allValues
        }));
      } else {
        // Clear all options in the section
        setLocalFilters(prev => ({
          ...prev,
          [sectionKey]: []
        }));
      }
    } catch (error) {
      console.error('Error toggling section:', error);
    }
  }, [filterSections]);

  const handleApply = useCallback(() => {
    try {
      onApplyFilters(localFilters);
      setIsOpen(false);
    } catch (error) {
      console.error('Error applying filters:', error);
    }
  }, [onApplyFilters, localFilters]);

  const handleClear = useCallback(() => {
    try {
      setLocalFilters({});
      onClearFilters();
      setIsOpen(false);
    } catch (error) {
      console.error('Error clearing filters:', error);
    }
  }, [onClearFilters]);

  const handleCancel = useCallback(() => {
    try {
      setLocalFilters(filters);
      setIsOpen(false);
    } catch (error) {
      console.error('Error canceling filters:', error);
    }
  }, [filters]);

  const getTotalActiveFilters = useMemo(() => {
    return Object.values(localFilters).reduce((total, values) => total + values.length, 0);
  }, [localFilters]);

  const isSectionPartiallySelected = useCallback((sectionKey: string) => {
    const section = filterSections.find(s => s.key === sectionKey);
    if (!section) return false;
    
    const selectedCount = localFilters[sectionKey]?.length || 0;
    return selectedCount > 0 && selectedCount < section.options.length;
  }, [filterSections, localFilters]);

  const isSectionFullySelected = useCallback((sectionKey: string) => {
    const section = filterSections.find(s => s.key === sectionKey);
    if (!section) return false;
    
    const selectedCount = localFilters[sectionKey]?.length || 0;
    return selectedCount === section.options.length;
  }, [filterSections, localFilters]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="border-blue-200 text-blue-700 hover:bg-blue-50">
            <Filter className="w-4 h-4 mr-2" />
            Filters
            {getTotalActiveFilters > 0 && (
              <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 text-xs">
                {getTotalActiveFilters}
              </Badge>
            )}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent 
        className="max-w-2xl max-h-[80vh] overflow-hidden"
        role="dialog"
        aria-labelledby="filter-dialog-title"
        aria-describedby="filter-dialog-description"
      >
        <DialogHeader>
          <DialogTitle 
            id="filter-dialog-title"
            className="flex items-center gap-2"
          >
            <Filter className="w-5 h-5" aria-hidden="true" />
            Filter Instructors
            {getTotalActiveFilters > 0 && (
              <Badge variant="secondary" className="ml-2" aria-label={`${getTotalActiveFilters} active filters`}>
                {getTotalActiveFilters} active
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col h-full">
          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-6">
              {filterSections.map((section) => (
                <div key={section.key} className="space-y-3" role="group" aria-labelledby={`section-${section.key}-title`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id={`section-${section.key}`}
                        checked={isSectionFullySelected(section.key)}
                        ref={(ref) => {
                          if (ref && 'indeterminate' in ref) {
                            (ref as any).indeterminate = isSectionPartiallySelected(section.key);
                          }
                        }}
                        onCheckedChange={(checked) => 
                          handleSectionToggle(section.key, checked as boolean)
                        }
                        aria-label={`Select all ${section.title.toLowerCase()}`}
                      />
                      <h3 id={`section-${section.key}-title`} className="font-medium text-gray-900">{section.title}</h3>
                    </div>
                    {localFilters[section.key]?.length > 0 && (
                      <Badge variant="outline" className="text-xs" aria-label={`${localFilters[section.key].length} selected`}>
                        {localFilters[section.key].length} selected
                      </Badge>
                    )}
                  </div>
                  
                  <div className="ml-6 space-y-2" role="group" aria-labelledby={`section-${section.key}-title`}>
                    {section.options.map((option) => (
                      <div key={option.value} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id={`option-${section.key}-${option.value}`}
                            checked={localFilters[section.key]?.includes(option.value) || false}
                            onCheckedChange={() => handleOptionToggle(section.key, option.value)}
                            aria-label={`Filter by ${option.label}`}
                          />
                          <label 
                            htmlFor={`option-${section.key}-${option.value}`}
                            className="text-sm text-gray-700 cursor-pointer"
                          >
                            {option.label}
                          </label>
                        </div>
                        <Badge variant="outline" className="text-xs" aria-label={`${option.count} items`}>
                          {option.count}
                        </Badge>
                      </div>
                    ))}
                  </div>
                  
                  <Separator />
                </div>
              ))}
            </div>
          </ScrollArea>

          <div className="flex items-center justify-between pt-4 border-t" role="group" aria-label="Filter actions">
            <Button 
              variant="outline" 
              onClick={handleClear}
              aria-label="Clear all filters"
            >
              <X className="w-4 h-4 mr-2" aria-hidden="true" />
              Clear All
            </Button>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={handleCancel}
                aria-label="Cancel filter changes"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleApply}
                aria-label="Apply selected filters"
              >
                <Check className="w-4 h-4 mr-2" aria-hidden="true" />
                Apply Filters
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 