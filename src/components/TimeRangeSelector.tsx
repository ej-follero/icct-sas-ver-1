'use client';

import { useState, useEffect, useRef } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface TimeRange {
  start: Date;
  end: Date;
  preset: 'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom';
}

interface TimeRangeSelectorProps {
  timeRange: TimeRange;
  onTimeRangeChange: (range: TimeRange) => void;
  onCustomRangeApply?: () => void;
}

interface DatePickerPopoverProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  timeRange: TimeRange;
  onTimeRangeChange: (range: TimeRange) => void;
  onCustomRangeApply?: () => void;
  trigger: React.ReactNode;
}

// Reusable DatePickerPopover Component
function DatePickerPopover({ isOpen, onOpenChange, timeRange, onTimeRangeChange, onCustomRangeApply, trigger }: DatePickerPopoverProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [hoveredDate, setHoveredDate] = useState<Date | null>(null);
  const [selectionMode, setSelectionMode] = useState<'single' | 'range'>('range');
  const [rangeSelectionStep, setRangeSelectionStep] = useState<'start' | 'end'>('start');
  // Local draft state to avoid committing until Apply is pressed
  const [rangeDraftStart, setRangeDraftStart] = useState<Date>(() => {
    const d = new Date(timeRange.start); d.setHours(0,0,0,0); return d;
  });
  const [rangeDraftEnd, setRangeDraftEnd] = useState<Date>(() => {
    const d = new Date(timeRange.end); d.setHours(0,0,0,0); return d;
  });

  // Initialize draft range when the popover opens
  useEffect(() => {
    if (isOpen) {
      const s = new Date(timeRange.start); s.setHours(0,0,0,0);
      const e = new Date(timeRange.end); e.setHours(0,0,0,0);
      setRangeDraftStart(s);
      setRangeDraftEnd(e);
      setRangeSelectionStep('start');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Generate calendar days for a given month
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const calendarStart = new Date(firstDayOfMonth);
    const dow = calendarStart.getDay(); // 0=Sun,1=Mon,...
    const mondayOffset = (dow === 0) ? -6 : (1 - dow); // start from Monday
    calendarStart.setDate(calendarStart.getDate() + mondayOffset);

    const days: Date[] = [];
    for (let i = 0; i < 42; i++) {
      days.push(new Date(calendarStart));
      calendarStart.setDate(calendarStart.getDate() + 1);
    }
    return days;
  };

  // Handle date selection
  const handleDateClick = (date: Date, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    // Allow selection regardless of current preset; we'll commit as 'custom' when needed
    
    const newDate = new Date(date);
    newDate.setHours(0, 0, 0, 0);
    
    if (selectionMode === 'single') {
      // Single: update local draft only; commit on Apply
      const selected = new Date(newDate); selected.setHours(0,0,0,0);
      setRangeDraftStart(selected);
      setRangeDraftEnd(selected);
      setRangeSelectionStep('start');
    } else {
      // Range selection (two clicks)
      if (rangeSelectionStep === 'start') {
        setRangeDraftStart(newDate);
        const end = new Date(newDate); end.setHours(0,0,0,0);
        setRangeDraftEnd(end);
        setRangeSelectionStep('end');
      } else {
        // finalize draft in correct order
        if (newDate < rangeDraftStart) {
          const start = new Date(newDate); start.setHours(0,0,0,0);
          const end = new Date(rangeDraftStart); end.setHours(0,0,0,0);
          setRangeDraftStart(start);
          setRangeDraftEnd(end);
        } else {
          const end = new Date(newDate); end.setHours(0,0,0,0);
          setRangeDraftEnd(end);
        }
        setRangeSelectionStep('start');
      }
    }
  };

  // Check if date is in range (for visual highlighting)
  const isInRange = (date: Date) => {
    if (timeRange.preset !== 'custom') return false;
    if (!rangeDraftStart || !rangeDraftEnd) return false;
    
    const start = new Date(rangeDraftStart);
    const end = new Date(rangeDraftEnd);
    const current = new Date(date);
    
    // Reset time to compare only dates
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    current.setHours(0, 0, 0, 0);
    
    return current >= start && current <= end;
  };

  // Check if date is start or end of range
  const isRangeBoundary = (date: Date) => {
    if (timeRange.preset !== 'custom') return false;
    if (!rangeDraftStart || !rangeDraftEnd) return false;
    
    const start = new Date(rangeDraftStart);
    const end = new Date(rangeDraftEnd);
    const current = new Date(date);
    
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    current.setHours(0, 0, 0, 0);
    
    return current.getTime() === start.getTime() || current.getTime() === end.getTime();
  };

  // Check if date is the start of range
  const isRangeStart = (date: Date) => {
    if (timeRange.preset !== 'custom') return false;
    if (!rangeDraftStart) return false;
    
    const start = new Date(rangeDraftStart);
    const current = new Date(date);
    
    start.setHours(0, 0, 0, 0);
    current.setHours(0, 0, 0, 0);
    
    return current.getTime() === start.getTime();
  };

  // Check if date is the end of range
  const isRangeEnd = (date: Date) => {
    if (timeRange.preset !== 'custom') return false;
    if (!rangeDraftEnd) return false;
    
    const end = new Date(rangeDraftEnd);
    const current = new Date(date);
    
    end.setHours(0, 0, 0, 0);
    current.setHours(0, 0, 0, 0);
    
    return current.getTime() === end.getTime();
  };

  // Toggle selection mode
  const toggleSelectionMode = () => {
    const next = selectionMode === 'single' ? 'range' : 'single';
    setSelectionMode(next);
    setRangeSelectionStep('start');
    // Keep draft range locally; do not commit to parent here
    const d = new Date(); d.setHours(0,0,0,0);
    setRangeDraftStart(d);
    const e = new Date(d); e.setHours(0,0,0,0);
    setRangeDraftEnd(e);
  };

  // Navigate months
  const navigateMonth = (direction: 'prev' | 'next', event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
    const newMonth = new Date(currentMonth);
    if (direction === 'prev') {
      newMonth.setMonth(newMonth.getMonth() - 1);
    } else {
      newMonth.setMonth(newMonth.getMonth() + 1);
    }
    setCurrentMonth(newMonth);
  };

  // Get next month for second calendar
  const getNextMonth = () => {
    const nextMonth = new Date(currentMonth);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    return nextMonth;
  };

  const renderCalendar = (month: Date, isSecondCalendar = false) => {
    const days = getDaysInMonth(month);
    const monthName = month.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    
    return (
      <div className="w-64">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-blue-900">{monthName}</h3>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={(event) => navigateMonth('prev', event)}
              className="h-6 w-6 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
            >
              <ChevronLeft className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(event) => navigateMonth('next', event)}
              className="h-6 w-6 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
            >
              <ChevronRight className="h-3 w-3" />
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-7 gap-1 text-xs">
          {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map(day => (
            <div key={day} className="h-8 flex items-center justify-center text-blue-600 font-medium">
              {day}
            </div>
          ))}
          
          {days.map((day, index) => {
            const isCurrentMonth = day.getMonth() === month.getMonth();
            const isSelected = isRangeBoundary(day);
            const isStart = isRangeStart(day);
            const isEnd = isRangeEnd(day);
            const inRange = isInRange(day);
            const isHovered = hoveredDate && day.getTime() === hoveredDate.getTime();
            
            return (
              <button
                type="button"
                key={index}
                onClick={(event) => handleDateClick(day, event)}
                onMouseEnter={() => setHoveredDate(day)}
                onMouseLeave={() => setHoveredDate(null)}
                className={cn(
                  "h-8 w-8 rounded-full text-xs font-medium transition-colors relative",
                  !isCurrentMonth && "text-gray-300",
                  isCurrentMonth && "text-blue-900 hover:bg-blue-50",
                  // Single date selection
                  selectionMode === 'single' && isSelected && "bg-blue-600 text-white hover:bg-blue-700 ring-2 ring-blue-200",
                  // Range selection styling
                  selectionMode === 'range' && isStart && "bg-blue-600 text-white hover:bg-blue-700 ring-2 ring-blue-200",
                  selectionMode === 'range' && isEnd && "bg-blue-600 text-white hover:bg-blue-700 ring-2 ring-blue-200",
                  selectionMode === 'range' && inRange && !isStart && !isEnd && "bg-blue-100 text-blue-700",
                  isHovered && !isSelected && !inRange && "bg-blue-50"
                )}
              >
                {day.getDate()}
                {/* Visual indicators for range boundaries */}
                {selectionMode === 'range' && isStart && (
                  <div className="absolute -top-1 -left-1 w-2 h-2 bg-blue-600 rounded-full"></div>
                )}
                {selectionMode === 'range' && isEnd && (
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-600 rounded-full"></div>
                )}
                {/* Single date indicator */}
                {selectionMode === 'single' && isSelected && (
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-600 rounded-full"></div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <Popover open={isOpen} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        {trigger}
      </PopoverTrigger>
      
      <PopoverContent 
        className="w-auto p-4 rounded-xl" 
        align="start" 
        side="bottom" 
        sideOffset={8}
        alignOffset={0}
        avoidCollisions={true}
        collisionPadding={12}
        onOpenAutoFocus={(e) => { try { e.preventDefault(); } catch {} }}
      >
          <div className="p-0">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-blue-900">Select Date Range</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  onOpenChange(false);
                }}
                className="h-6 w-6 p-0 rounded-full"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

          {/* Selection Mode Toggle */}
          <div className="flex items-center justify-end mb-4 rounded">
            <div className="flex items-center gap-2">
              <div className="flex bg-white rounded p-1 border">
                <button
                  type="button"
                  onClick={() => {
                    setSelectionMode('single');
                    setRangeSelectionStep('start');
                    const d = new Date(); d.setHours(0,0,0,0);
                    onTimeRangeChange({ ...timeRange, start: d, end: d, preset: 'custom' });
                  }}
                  className={cn(
                    "px-3 py-1 text-xs font-medium rounded transition-colors",
                    selectionMode === 'single' 
                      ? "bg-blue-600 text-white" 
                      : "text-gray-600 hover:text-gray-800"
                  )}
                >
                  Single Date
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectionMode('range');
                    setRangeSelectionStep('start');
                    const d = new Date(); d.setHours(0,0,0,0);
                    onTimeRangeChange({ ...timeRange, start: d, end: d, preset: 'custom' });
                  }}
                  className={cn(
                    "px-3 py-1 text-xs font-medium rounded transition-colors",
                    selectionMode === 'range' 
                      ? "bg-blue-600 text-white" 
                      : "text-gray-600 hover:text-gray-800"
                  )}
                >
                  Date Range
                </button>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="mb-4 p-2 bg-blue-50 rounded border border-blue-100">
            <div className="text-xs text-blue-700">
              {selectionMode === 'single' ? (
                <span>💡 Click any date to select it. The same date will be used for both start and end.</span>
              ) : (
                <span>
                  💡 {rangeSelectionStep === 'start' 
                    ? 'Click a date to set the start of your range.' 
                    : 'Click a date to set the end of your range. Dates will be automatically ordered.'}
                </span>
              )}
            </div>
          </div>
          
          <div className={cn("flex gap-4 w-full", selectionMode === 'single' ? "justify-center" : "justify-start")}>
            {renderCalendar(currentMonth)}
            {selectionMode === 'range' && renderCalendar(getNextMonth(), true)}
          </div>
          
          <div className="flex items-center justify-end gap-2 mt-4 pt-4 border-t">
            <Button
              variant="outline"
              className="rounded text-gray-500"
              size="sm"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                // Clear selection
                const today = new Date();
                today.setHours(0,0,0,0);
                onTimeRangeChange({ ...timeRange, start: today, end: today, preset: 'custom' });
              }}
            >
              Clear
            </Button>
            <Button
              size="sm"
              className="rounded"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                // Commit draft to parent
                onTimeRangeChange({
                  ...timeRange,
                  start: rangeDraftStart,
                  end: rangeDraftEnd,
                  preset: 'custom'
                });
                onOpenChange(false);
                if (onCustomRangeApply) onCustomRangeApply();
              }}
            >
              Apply
            </Button>
          </div>

        </div>
      </PopoverContent>
    </Popover>
  );
}

export function TimeRangeSelector({ timeRange, onTimeRangeChange, onCustomRangeApply }: TimeRangeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const suppressCloseRef = useRef(false);
  const handlePopoverOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && suppressCloseRef.current) return;
    setIsOpen(nextOpen);
  };



  const presets = [
    { label: 'Today', value: 'today' },
    { label: 'This Week', value: 'week' },
    { label: 'This Month', value: 'month' },
    { label: 'This Quarter', value: 'quarter' },
    { label: 'This Year', value: 'year' },
    { label: 'Custom', value: 'custom' }
  ];

  // Format date range for display
  const formatDateRange = () => {
    if (timeRange.preset === 'custom') {
      if (timeRange.start.getTime() === timeRange.end.getTime()) {
        // Single date
        return timeRange.start.toLocaleDateString('en-US', { 
          day: 'numeric', 
          month: 'short', 
          year: 'numeric' 
        });
      } else {
        // Date range
        const startStr = timeRange.start.toLocaleDateString('en-US', { 
          day: 'numeric', 
          month: 'short' 
        });
        const endStr = timeRange.end.toLocaleDateString('en-US', { 
          day: 'numeric', 
          month: 'short', 
          year: 'numeric' 
        });
        return `${startStr} - ${endStr}`;
      }
    }
    return presets.find(p => p.value === timeRange.preset)?.label || 'Custom';
  };

  return (
    <div className="flex items-center gap-3">
      <Select 
        value={timeRange.preset} 
          onValueChange={(preset) => {
          const now = new Date(); now.setHours(0,0,0,0);
          if (preset === 'custom') {
            onTimeRangeChange({ start: now, end: now, preset: 'custom' });
            setTimeout(() => setIsOpen(true), 100);
          } else {
            onTimeRangeChange({ ...timeRange, preset: preset as any });
          }
        }}
      >
        <SelectTrigger className="w-auto min-w-[200px] rounded text-gray-500 border-gray-300 hover:border-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
          <SelectValue>
            {timeRange.preset === 'custom' ? formatDateRange() : presets.find(p => p.value === timeRange.preset)?.label}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {presets.map(preset => (
            <SelectItem key={preset.value} value={preset.value}>
              {preset.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {timeRange.preset === 'custom' && (
        <DatePickerPopover
          isOpen={isOpen}
          onOpenChange={handlePopoverOpenChange}
          timeRange={timeRange}
          onTimeRangeChange={onTimeRangeChange}
          onCustomRangeApply={onCustomRangeApply}
          trigger={
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsOpen(true)}
              className="h-8 px-3 rounded"
            >
              <Calendar className="w-3 h-3 mr-2" /> Pick dates
            </Button>
          }
        />
      )}
    </div>
  );
} 