import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { BadgeInfo } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';

interface StatusOption<T extends string = string> {
  value: T;
  label: string;
}

interface FilterField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'select';
  badgeType?: 'active' | 'range';
  minKey?: string;
  maxKey?: string;
  options?: { value: string; label: string }[];
}

interface FilterDialogProps<T extends string = string> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  statusFilter: T;
  setStatusFilter: (status: T) => void;
  statusOptions: StatusOption<T>[];
  advancedFilters: Record<string, string>;
  setAdvancedFilters: (filters: Record<string, string>) => void;
  fields: FilterField[];
  onReset: () => void;
  onApply: () => void;
  activeAdvancedCount?: number;
  title?: string;
  tooltip?: string;
}

export const FilterDialog = <T extends string = string>({
  open,
  onOpenChange,
  statusFilter,
  setStatusFilter,
  statusOptions,
  advancedFilters,
  setAdvancedFilters,
  fields,
  onReset,
  onApply,
  activeAdvancedCount,
  title = 'Filter',
  tooltip = 'Filter by multiple criteria. Use advanced filters for more specific conditions.'
}: FilterDialogProps<T>) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:w-[500px] max-h-[90vh] overflow-y-auto bg-white/90 border border-blue-100 shadow-lg rounded-xl py-6 sm:py-8 px-4 sm:px-6">
        <DialogHeader>
          <DialogTitle className="text-blue-900 text-lg sm:text-xl flex items-center gap-2 mb-4 sm:mb-6">
            {title}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="text-blue-400 cursor-pointer">
                    <BadgeInfo className="w-4 h-4" />
                  </span>
                </TooltipTrigger>
                <TooltipContent side="right" className="bg-blue-900 text-white">
                  {tooltip}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 sm:space-y-8">
          {/* Status Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-md font-semibold text-blue-900">Status</h3>
              </div>
              <Badge variant="outline" className="text-xs font-normal bg-blue-50 text-blue-700 border-blue-200">
                {statusOptions.find(opt => opt.value === statusFilter)?.label || statusFilter}
              </Badge>
            </div>
            <div className="h-px bg-blue-100 w-full mb-4 sm:mb-8"></div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4 mt-4 sm:mt-6">
              {statusOptions.map(opt => (
                <Button
                  key={opt.value}
                  variant={statusFilter === opt.value ? 'default' : 'outline'}
                  size="sm"
                  className={`px-3 py-2 text-sm sm:text-base whitespace-nowrap transition-all duration-150 ${
                    statusFilter === opt.value 
                      ? 'bg-blue-600 hover:bg-blue-700' 
                      : 'hover:bg-blue-50 border-blue-200 text-blue-700'
                  }`}
                  style={{ minWidth: 0, width: 'auto' }}
                  onClick={() => setStatusFilter(opt.value)}
                >
                  {opt.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Advanced Filters Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-md font-semibold text-blue-900">Advanced Filters</h3>
              </div>
              {activeAdvancedCount !== undefined && activeAdvancedCount > 0 && (
                <Badge variant="outline" className="text-xs font-normal bg-blue-50 text-blue-700 border-blue-200">
                  {activeAdvancedCount} active
                </Badge>
              )}
            </div>
            <div className="h-px bg-blue-100 w-full mb-4 sm:mb-8"></div>
            <div className="space-y-4 sm:space-y-6">
              {fields.map(field => {
                if (field.type === 'number' && field.minKey && field.maxKey) {
                  return (
                    <div key={field.key} className="space-y-2">
                      <Label className="text-sm text-blue-900 flex items-center gap-2">
                        {field.label}
                        {(advancedFilters[field.minKey] || advancedFilters[field.maxKey]) && (
                          <Badge variant="outline" className="text-xs font-normal bg-blue-50 text-blue-700 border-blue-200">Range</Badge>
                        )}
                      </Label>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="relative">
                          <Input
                            type="number"
                            placeholder={`Min ${field.label.toLowerCase()}`}
                            value={advancedFilters[field.minKey] || ''}
                            onChange={e => setAdvancedFilters({ ...advancedFilters, [field.minKey!]: e.target.value })}
                            className="border-blue-200 focus:border-blue-400 focus:ring-blue-400 pr-8 text-sm sm:text-base h-9 sm:h-10"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs sm:text-sm">min</span>
                        </div>
                        <div className="relative">
                          <Input
                            type="number"
                            placeholder={`Max ${field.label.toLowerCase()}`}
                            value={advancedFilters[field.maxKey] || ''}
                            onChange={e => setAdvancedFilters({ ...advancedFilters, [field.maxKey!]: e.target.value })}
                            className="border-blue-200 focus:border-blue-400 focus:ring-blue-400 pr-8 text-sm sm:text-base h-9 sm:h-10"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs sm:text-sm">max</span>
                        </div>
                      </div>
                    </div>
                  );
                }
                if ((field.type === 'select' || (field.type === 'text' && field.options)) && field.options) {
                  return (
                    <div key={field.key} className="space-y-2">
                      <Label className="text-sm text-blue-900 flex items-center gap-2">
                        {field.label}
                      </Label>
                      <Select
                        value={advancedFilters[field.key] || 'all'}
                        onValueChange={v => setAdvancedFilters({ ...advancedFilters, [field.key]: v })}
                      >
                        <SelectTrigger className="w-full border-blue-200 focus:border-blue-400 focus:ring-blue-400 text-sm sm:text-base h-9 sm:h-10">
                          <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
                        </SelectTrigger>
                        <SelectContent>
                          {field.options.map(opt => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  );
                }
                return (
                  <div key={field.key} className="space-y-2">
                    <Label htmlFor={`${field.key}-filter`} className="text-sm text-blue-900 flex items-center gap-2">
                      {field.label}
                      {field.badgeType === 'active' && advancedFilters[field.key] && (
                        <Badge variant="outline" className="text-xs font-normal bg-blue-50 text-blue-700 border-blue-200">Active</Badge>
                      )}
                    </Label>
                    <Input
                      id={`${field.key}-filter`}
                      type={field.type}
                      placeholder={`Filter by ${field.label.toLowerCase()}...`}
                      value={advancedFilters[field.key] || ''}
                      onChange={e => setAdvancedFilters({ ...advancedFilters, [field.key]: e.target.value })}
                      className="border-blue-200 focus:border-blue-400 focus:ring-blue-400 text-sm sm:text-base h-9 sm:h-10"
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-4 mt-6 sm:mt-10">
          <Button
            variant="outline"
            onClick={onReset}
            className="flex-1 sm:flex-none sm:w-32 border border-blue-300 text-blue-500 text-sm sm:text-base h-9 sm:h-10"
          >
            Reset
          </Button>
          <Button
            onClick={() => {
              onApply();
              onOpenChange(false);
            }}
            className="flex-1 sm:flex-none sm:w-32 bg-blue-600 hover:bg-blue-700 text-white text-sm sm:text-base h-9 sm:h-10"
          >
            Apply Filters
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}; 