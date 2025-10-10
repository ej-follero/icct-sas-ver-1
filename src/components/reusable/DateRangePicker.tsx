"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar as ShadCalendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { X } from "lucide-react";

export type RangeValue = { start: Date; end: Date };

interface DateRangePickerProps {
  mode?: "single" | "range";
  value: Date | RangeValue;
  onChange: (value: Date | RangeValue) => void;
  showModeToggle?: boolean;
  className?: string;
}

export function DateRangePicker({ mode = "range", value, onChange, showModeToggle = true, className }: DateRangePickerProps) {
  const [selectionMode, setSelectionMode] = React.useState<"single" | "range">(mode);

  const isRange = selectionMode === "range";
  const current = value as any;

  const formatSummary = () => {
    if (!isRange) {
      const d = (value as Date) ?? new Date();
      return d.toLocaleDateString();
    }
    const { start, end } = value as RangeValue;
    const s = start ? start.toLocaleDateString() : "";
    const e = end ? end.toLocaleDateString() : s;
    return `${s} - ${e}`;
  };

  return (
    <div className={cn("flex items-start gap-4", className)}>
      {showModeToggle && (
        <div className="flex bg-white rounded p-1 border h-fit">
          <button
            onClick={() => setSelectionMode("single")}
            className={cn(
              "px-3 py-1 text-xs font-medium rounded transition-colors",
              selectionMode === "single" ? "bg-blue-600 text-white" : "text-gray-600 hover:text-gray-800"
            )}
          >
            Single Date
          </button>
          <button
            onClick={() => setSelectionMode("range")}
            className={cn(
              "px-3 py-1 text-xs font-medium rounded transition-colors",
              selectionMode === "range" ? "bg-blue-600 text-white" : "text-gray-600 hover:text-gray-800"
            )}
          >
            Date Range
          </button>
        </div>
      )}

      <div className={cn(selectionMode === "range" ? "grid grid-cols-2 gap-4" : "flex items-start gap-4")}>
        {selectionMode === "range" ? (
          <>
            <div>
              <div className="text-xs font-medium text-gray-600 mb-1">Start</div>
              <ShadCalendar
                // @ts-ignore
                mode={'single'}
                selected={current?.start instanceof Date ? current.start : undefined}
                onSelect={(d: Date | undefined) => {
                  if (!d) return;
                  const start = new Date(d); start.setHours(0,0,0,0);
                  const end = current?.end instanceof Date ? new Date(current.end) : new Date(start);
                  end.setHours(23,59,59,999);
                  if (end < start) end.setTime(start.getTime());
                  onChange({ start, end });
                }}
              />
            </div>
            <div>
              <div className="text-xs font-medium text-gray-600 mb-1">End</div>
              <ShadCalendar
                // @ts-ignore
                mode={'single'}
                selected={current?.end instanceof Date ? current.end : undefined}
                onSelect={(d: Date | undefined) => {
                  if (!d) return;
                  const end = new Date(d); end.setHours(23,59,59,999);
                  const start = current?.start instanceof Date ? new Date(current.start) : new Date(end);
                  start.setHours(0,0,0,0);
                  if (end < start) start.setTime(end.getTime());
                  onChange({ start, end });
                }}
              />
            </div>
          </>
        ) : (
          <ShadCalendar
            // @ts-ignore - single date
            mode={'single'}
            selected={value instanceof Date ? value : undefined}
            onSelect={(d: Date | undefined) => {
              if (!d) return;
              const start = new Date(d); start.setHours(0,0,0,0);
              onChange(start);
            }}
          />
        )}
        <div className="flex items-center justify-between gap-2 mt-2">
          <span className="text-xs text-gray-600">{formatSummary()}</span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="rounded text-gray-500"
              onClick={() => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                if (isRange) {
                  onChange({ start: today, end: today });
                } else {
                  onChange(today);
                }
              }}
            >
              Clear
            </Button>
            <Button size="sm" className="rounded" onClick={() => { /* consumer triggers fetch via onChange */ }}>
              Apply
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DateRangePicker;

// Popover version with blue header UI
interface DateRangePickerPopoverProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode?: "single" | "range";
  value: Date | RangeValue;
  onChange: (value: Date | RangeValue) => void;
  onApply?: () => void;
  trigger?: React.ReactNode;
}

export function DateRangePickerPopover({ open, onOpenChange, mode = "range", value, onChange, onApply, trigger }: DateRangePickerPopoverProps) {
  const [selectionMode, setSelectionMode] = React.useState<"single" | "range">(mode);
  const isRange = selectionMode === "range";
  const current = value as any;

  React.useEffect(() => {
    setSelectionMode(mode);
  }, [mode]);

  const formatSummary = () => {
    // Handle both Date and RangeValue defensively
    if (value instanceof Date) {
      return value.toLocaleDateString();
    }
    if (value && (value as any).start) {
      const { start, end } = value as RangeValue;
      const s = start ? start.toLocaleDateString() : "";
      const e = end ? end.toLocaleDateString() : s;
      return `${s} - ${e}`;
    }
    return new Date().toLocaleDateString();
  };

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        {trigger || (
          <Button variant="outline" className="w-full justify-start text-left font-normal">
            {formatSummary()}
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="flex flex-col">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 text-white rounded-t-lg">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold text-white">Select Date Range</h4>
                <p className="text-white/80 text-xs mt-1">Click to select a single date or switch to range.</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-white hover:bg-white/20 rounded"
                onClick={() => onOpenChange(false)}
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          </div>

          {/* Body */}
          <div className="p-3">
            <div className="flex items-center justify-end mb-3">
              <div className="flex bg-white rounded p-1 border">
                <button
                  onClick={() => setSelectionMode("single")}
                  className={cn(
                    "px-2 py-1 text-xs font-medium rounded transition-colors",
                    selectionMode === "single" ? "bg-blue-600 text-white" : "text-gray-600 hover:text-gray-800"
                  )}
                >
                  Single Date
                </button>
                <button
                  onClick={() => setSelectionMode("range")}
                  className={cn(
                    "px-2 py-1 text-xs font-medium rounded transition-colors",
                    selectionMode === "range" ? "bg-blue-600 text-white" : "text-gray-600 hover:text-gray-800"
                  )}
                >
                  Date Range
                </button>
              </div>
            </div>

            {isRange ? (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-xs font-medium text-gray-600 mb-1">Start</div>
                  <ShadCalendar
                    // @ts-ignore
                    mode={'single'}
                    selected={current?.start instanceof Date ? current.start : undefined}
                    onSelect={(d: Date | undefined) => {
                      if (!d) return;
                      const start = new Date(d); start.setHours(0,0,0,0);
                      const end = current?.end instanceof Date ? new Date(current.end) : new Date(start);
                      end.setHours(23,59,59,999);
                      if (end < start) end.setTime(start.getTime());
                      onChange({ start, end });
                    }}
                  />
                </div>
                <div>
                  <div className="text-xs font-medium text-gray-600 mb-1">End</div>
                  <ShadCalendar
                    // @ts-ignore
                    mode={'single'}
                    selected={current?.end instanceof Date ? current.end : undefined}
                    onSelect={(d: Date | undefined) => {
                      if (!d) return;
                      const end = new Date(d); end.setHours(23,59,59,999);
                      const start = current?.start instanceof Date ? new Date(current.start) : new Date(end);
                      start.setHours(0,0,0,0);
                      if (end < start) start.setTime(end.getTime());
                      onChange({ start, end });
                    }}
                  />
                </div>
              </div>
            ) : (
              <ShadCalendar
                // @ts-ignore
                mode={'single'}
                selected={value instanceof Date ? value : undefined}
                onSelect={(d: Date | undefined) => {
                  if (!d) return;
                  const start = new Date(d); start.setHours(0,0,0,0);
                  onChange(start);
                }}
              />
            )}

            <div className="flex items-center justify-between gap-2 mt-3">
              <span className="text-xs text-gray-600">{formatSummary()}</span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded text-gray-500 h-7 px-2 text-xs"
                  onClick={() => {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    if (isRange) {
                      onChange({ start: today, end: today });
                    } else {
                      onChange(today);
                    }
                  }}
                >
                  Clear
                </Button>
                <Button size="sm" className="rounded h-7 px-2 text-xs" onClick={() => { onApply?.(); onOpenChange(false); }}>
                  Apply
                </Button>
              </div>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// Keep the dialog version for backward compatibility
interface DateRangePickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode?: "single" | "range";
  value: Date | RangeValue;
  onChange: (value: Date | RangeValue) => void;
  onApply?: () => void;
}

export function DateRangePickerDialog({ open, onOpenChange, mode = "range", value, onChange, onApply }: DateRangePickerDialogProps) {
  const [selectionMode, setSelectionMode] = React.useState<"single" | "range">(mode);
  const isRange = selectionMode === "range";
  const current = value as any;

  React.useEffect(() => {
    setSelectionMode(mode);
  }, [mode]);

  const formatSummary = () => {
    // Handle both Date and RangeValue defensively
    if (value instanceof Date) {
      return value.toLocaleDateString();
    }
    if (value && (value as any).start) {
      const { start, end } = value as RangeValue;
      const s = start ? start.toLocaleDateString() : "";
      const e = end ? end.toLocaleDateString() : s;
      return `${s} - ${e}`;
    }
    return new Date().toLocaleDateString();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden rounded-xl flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white rounded-t-xl relative">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-lg font-semibold text-white">Select Date Range</DialogTitle>
              <p className="text-white/80 text-sm mt-1">Click to select a single date or switch to range.</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-white hover:bg-white/20 rounded-lg"
              onClick={() => onOpenChange(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Body */}
        <div className="p-4">
          <div className="flex items-center justify-end mb-3">
            <div className="flex bg-white rounded p-1 border">
              <button
                onClick={() => setSelectionMode("single")}
                className={cn(
                  "px-3 py-1 text-xs font-medium rounded transition-colors",
                  selectionMode === "single" ? "bg-blue-600 text-white" : "text-gray-600 hover:text-gray-800"
                )}
              >
                Single Date
              </button>
              <button
                onClick={() => setSelectionMode("range")}
                className={cn(
                  "px-3 py-1 text-xs font-medium rounded transition-colors",
                  selectionMode === "range" ? "bg-blue-600 text-white" : "text-gray-600 hover:text-gray-800"
                )}
              >
                Date Range
              </button>
            </div>
          </div>

          {isRange ? (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs font-medium text-gray-600 mb-1">Start</div>
                <ShadCalendar
                  // @ts-ignore
                  mode={'single'}
                  selected={current?.start instanceof Date ? current.start : undefined}
                  onSelect={(d: Date | undefined) => {
                    if (!d) return;
                    const start = new Date(d); start.setHours(0,0,0,0);
                    const end = current?.end instanceof Date ? new Date(current.end) : new Date(start);
                    end.setHours(23,59,59,999);
                    if (end < start) end.setTime(start.getTime());
                    onChange({ start, end });
                  }}
                />
              </div>
              <div>
                <div className="text-xs font-medium text-gray-600 mb-1">End</div>
                <ShadCalendar
                  // @ts-ignore
                  mode={'single'}
                  selected={current?.end instanceof Date ? current.end : undefined}
                  onSelect={(d: Date | undefined) => {
                    if (!d) return;
                    const end = new Date(d); end.setHours(23,59,59,999);
                    const start = current?.start instanceof Date ? new Date(current.start) : new Date(end);
                    start.setHours(0,0,0,0);
                    if (end < start) start.setTime(end.getTime());
                    onChange({ start, end });
                  }}
                />
              </div>
            </div>
          ) : (
            <ShadCalendar
              // @ts-ignore
              mode={'single'}
              selected={value instanceof Date ? value : undefined}
              onSelect={(d: Date | undefined) => {
                if (!d) return;
                const start = new Date(d); start.setHours(0,0,0,0);
                onChange(start);
              }}
            />
          )}

          <div className="flex items-center justify-between gap-2 mt-3">
            <span className="text-xs text-gray-600">{formatSummary()}</span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="rounded text-gray-500"
                onClick={() => {
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  if (isRange) {
                    onChange({ start: today, end: today });
                  } else {
                    onChange(today);
                  }
                }}
              >
                Clear
              </Button>
              <Button size="sm" className="rounded" onClick={() => { onApply?.(); onOpenChange(false); }}>
                Apply
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}


