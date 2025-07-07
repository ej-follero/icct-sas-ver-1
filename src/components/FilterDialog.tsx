'use client';

import { useState, useEffect } from 'react';
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
  const [isOpen, setIsOpen] = useState(false);
  const [localFilters, setLocalFilters] = useState<Record<string, string[]>>(filters);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const handleOptionToggle = (sectionKey: string, value: string) => {
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
  };

  const handleSectionToggle = (sectionKey: string, checked: boolean) => {
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
  };

  const handleApply = () => {
    onApplyFilters(localFilters);
    setIsOpen(false);
  };

  const handleClear = () => {
    setLocalFilters({});
    onClearFilters();
    setIsOpen(false);
  };

  const handleCancel = () => {
    setLocalFilters(filters);
    setIsOpen(false);
  };

  const getTotalActiveFilters = () => {
    return Object.values(localFilters).reduce((total, values) => total + values.length, 0);
  };

  const isSectionPartiallySelected = (sectionKey: string) => {
    const section = filterSections.find(s => s.key === sectionKey);
    if (!section) return false;
    
    const selectedCount = localFilters[sectionKey]?.length || 0;
    return selectedCount > 0 && selectedCount < section.options.length;
  };

  const isSectionFullySelected = (sectionKey: string) => {
    const section = filterSections.find(s => s.key === sectionKey);
    if (!section) return false;
    
    const selectedCount = localFilters[sectionKey]?.length || 0;
    return selectedCount === section.options.length;
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="border-blue-200 text-blue-700 hover:bg-blue-50">
            <Filter className="w-4 h-4 mr-2" />
            Filters
            {getTotalActiveFilters() > 0 && (
              <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 text-xs">
                {getTotalActiveFilters()}
              </Badge>
            )}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filter Instructors
            {getTotalActiveFilters() > 0 && (
              <Badge variant="secondary" className="ml-2">
                {getTotalActiveFilters()} active
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col h-full">
          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-6">
              {filterSections.map((section) => (
                <div key={section.key} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={isSectionFullySelected(section.key)}
                        ref={(ref) => {
                          if (ref) {
                            ref.indeterminate = isSectionPartiallySelected(section.key);
                          }
                        }}
                        onCheckedChange={(checked) => 
                          handleSectionToggle(section.key, checked as boolean)
                        }
                      />
                      <h3 className="font-medium text-gray-900">{section.title}</h3>
                    </div>
                    {localFilters[section.key]?.length > 0 && (
                      <Badge variant="outline" className="text-xs">
                        {localFilters[section.key].length} selected
                      </Badge>
                    )}
                  </div>
                  
                  <div className="ml-6 space-y-2">
                    {section.options.map((option) => (
                      <div key={option.value} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={localFilters[section.key]?.includes(option.value) || false}
                            onCheckedChange={() => handleOptionToggle(section.key, option.value)}
                          />
                          <span className="text-sm text-gray-700">{option.label}</span>
                        </div>
                        <Badge variant="outline" className="text-xs">
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

          <div className="flex items-center justify-between pt-4 border-t">
            <Button variant="outline" onClick={handleClear}>
              <X className="w-4 h-4 mr-2" />
              Clear All
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button onClick={handleApply}>
                <Check className="w-4 h-4 mr-2" />
                Apply Filters
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 