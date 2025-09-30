"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ChevronLeft, ChevronRight, Download, X, Calendar, Copy, Printer, ClipboardList, User } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface AttendanceRecord {
  id: string;
  date: string;
  timeIn?: string;
  timeOut?: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
  subject: string;
  room: string;
  notes?: string;
  isManualEntry: boolean;
  createdAt: string;
  updatedAt: string;
}

interface StudentData {
  studentId: string;
  studentName: string;
  studentIdNum: string;
  department: string;
  attendanceRate: number;
  attendedClasses: number;
  absentClasses: number;
  lateClasses: number;
  totalScheduledClasses: number;
  subjects: string[];
  avatarUrl?: string;
}

interface StudentAttendanceRecordsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student: StudentData | null;
  records?: AttendanceRecord[];
  loading?: boolean;
  showCopyButton?: boolean;
  showPrintButton?: boolean;
  showExportButton?: boolean;
}

export default function StudentAttendanceRecordsDialog({
  open,
  onOpenChange,
  student,
  records = [],
  loading = false,
  showCopyButton = true,
  showPrintButton = true,
  showExportButton = true
}: StudentAttendanceRecordsDialogProps) {
  const [dateRange, setDateRange] = useState("last-30-days");
  const [selectedSubject, setSelectedSubject] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [fetchedRecords, setFetchedRecords] = useState<AttendanceRecord[] | null>(null);
  const [fetching, setFetching] = useState(false);
  
  // Date picker state
  const [customDateRange, setCustomDateRange] = useState<{ start: Date; end: Date }>({
    start: new Date(),
    end: new Date()
  });
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [selectionMode, setSelectionMode] = useState<'single' | 'range'>('single');
  const [rangeSelectionStep, setRangeSelectionStep] = useState<'start' | 'end'>('start');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [hoveredDate, setHoveredDate] = useState<Date | null>(null);

  // Initialize custom date range when dialog opens
  useEffect(() => {
    if (open && student) {
      const today = new Date();
      setCustomDateRange({
        start: today,
        end: today
      });
    }
  }, [open, student]);

  // Helper functions
  const copyToClipboard = async (text: string, fieldLabel: string) => {
    try {
      await navigator.clipboard.writeText(text.toString());
      toast.success(`${fieldLabel} copied to clipboard`);
    } catch (err) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const handlePrint = () => {
    toast.success('Print dialog opened');
  };

  const handleExport = () => {
    toast.info('Export functionality coming soon');
  };

  // Date picker helper functions
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= lastDay || currentDate.getDay() !== 0) {
      days.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return days;
  };

  const handleDateClick = (date: Date, event: React.MouseEvent) => {
    const newDate = new Date(date);
    newDate.setHours(0, 0, 0, 0);
    
    if (selectionMode === 'single') {
      setCustomDateRange({
        start: newDate,
        end: newDate
      });
      // Trigger data refresh for single date selection
      setDateRange('custom');
    } else {
      if (rangeSelectionStep === 'start') {
        setCustomDateRange({
          start: newDate,
          end: newDate
        });
        setRangeSelectionStep('end');
      } else {
        const currentStart = new Date(customDateRange.start);
        currentStart.setHours(0, 0, 0, 0);
        
        if (newDate < currentStart) {
          setCustomDateRange({
            start: newDate,
            end: currentStart
          });
        } else {
          setCustomDateRange({
            start: currentStart,
            end: newDate
          });
        }
        setRangeSelectionStep('start');
        // Trigger data refresh for range completion
        setDateRange('custom');
      }
    }
  };

  const isInRange = (date: Date) => {
    if (!customDateRange.start || !customDateRange.end) return false;
    
    const start = new Date(customDateRange.start);
    const end = new Date(customDateRange.end);
    const current = new Date(date);
    
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    current.setHours(0, 0, 0, 0);
    
    return current >= start && current <= end;
  };

  const isRangeBoundary = (date: Date) => {
    if (!customDateRange.start || !customDateRange.end) return false;
    
    const start = new Date(customDateRange.start);
    const end = new Date(customDateRange.end);
    const current = new Date(date);
    
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    current.setHours(0, 0, 0, 0);
    
    return current.getTime() === start.getTime() || current.getTime() === end.getTime();
  };

  const isRangeStart = (date: Date) => {
    if (!customDateRange.start) return false;
    
    const start = new Date(customDateRange.start);
    const current = new Date(date);
    
    start.setHours(0, 0, 0, 0);
    current.setHours(0, 0, 0, 0);
    
    return current.getTime() === start.getTime();
  };

  const isRangeEnd = (date: Date) => {
    if (!customDateRange.end) return false;
    
    const end = new Date(customDateRange.end);
    const current = new Date(date);
    
    end.setHours(0, 0, 0, 0);
    current.setHours(0, 0, 0, 0);
    
    return current.getTime() === end.getTime();
  };

  const toggleSelectionMode = () => {
    setSelectionMode(prev => prev === 'single' ? 'range' : 'single');
    setRangeSelectionStep('start');
    const today = new Date();
    setCustomDateRange({
      start: today,
      end: today
    });
  };

  const navigateMonth = (direction: 'prev' | 'next', event: React.MouseEvent) => {
    const newMonth = new Date(currentMonth);
    if (direction === 'prev') {
      newMonth.setMonth(newMonth.getMonth() - 1);
    } else {
      newMonth.setMonth(newMonth.getMonth() + 1);
    }
    setCurrentMonth(newMonth);
  };

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

  const formatDateRange = () => {
    if (customDateRange.start.getTime() === customDateRange.end.getTime()) {
      return customDateRange.start.toLocaleDateString('en-US', { 
        day: 'numeric', 
        month: 'short', 
        year: 'numeric' 
      });
    } else {
      const startStr = customDateRange.start.toLocaleDateString('en-US', { 
        day: 'numeric', 
        month: 'short' 
      });
      const endStr = customDateRange.end.toLocaleDateString('en-US', { 
        day: 'numeric', 
        month: 'short', 
        year: 'numeric' 
      });
      return `${startStr} - ${endStr}`;
    }
  };

  // Prefer records passed via props; otherwise, try to map student.attendanceRecords from API
  const mappedStudentRecords: AttendanceRecord[] = Array.isArray((student as any)?.attendanceRecords)
    ? ((student as any).attendanceRecords as any[]).slice(0, 50).map((r: any) => ({
        id: String(r.attendanceId ?? `${r.timestamp}-${r.subjectSchedId ?? ''}`),
        date: new Date(r.timestamp).toLocaleDateString(),
        timeIn: r.status === 'PRESENT' || r.status === 'LATE' ? new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined,
        timeOut: r.checkOutTime ? new Date(r.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined,
        status: r.status,
        subject: r.subjectSchedule?.subject?.subjectName || 'Unknown Subject',
        room: r.subjectSchedule?.room?.roomNo || 'Unknown Room',
        notes: r.notes,
        isManualEntry: r.attendanceType === 'MANUAL_ENTRY',
        createdAt: new Date(r.timestamp).toISOString(),
        updatedAt: new Date(r.timestamp).toISOString()
      }))
    : [];

  const baseRecords = records.length > 0 ? records : mappedStudentRecords;

  // Fetch records from API when filters change
  useEffect(() => {
    if (!student) return;
    const fetchFiltered = async () => {
      try {
        setFetching(true);
        const params = new URLSearchParams();
        params.append('studentId', student?.studentId || '');

        // Date range presets
        const now = new Date();
        let start: Date | null = null;
        let end: Date | null = now;
        if (dateRange === 'last-7-days') {
          start = new Date();
          start.setDate(start.getDate() - 7);
        } else if (dateRange === 'last-30-days') {
          start = new Date();
          start.setDate(start.getDate() - 30);
        } else if (dateRange === 'this-month') {
          start = new Date(now.getFullYear(), now.getMonth(), 1);
        } else if (dateRange === 'this-semester') {
          // Approximate to last 4 months
          start = new Date();
          start.setMonth(start.getMonth() - 4);
        } else if (dateRange === 'custom') {
          start = customDateRange.start;
          end = customDateRange.end;
        }

        if (start) params.append('startDate', start.toISOString());
        if (end) params.append('endDate', end.toISOString());

        if (selectedStatus !== 'all') params.append('status', selectedStatus);
        if (selectedSubject !== 'all') params.append('subjectName', selectedSubject);

        const res = await fetch(`/api/attendance/students?${params.toString()}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const stud = Array.isArray(data) ? data[0] : null;
        const apiRecords: AttendanceRecord[] = Array.isArray(stud?.attendanceRecords)
          ? stud.attendanceRecords.map((r: any) => ({
              id: String(r.attendanceId ?? `${r.timestamp}-${r.subjectSchedId ?? ''}`),
              date: new Date(r.timestamp).toLocaleDateString(),
              timeIn: r.status === 'PRESENT' || r.status === 'LATE' ? new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined,
              timeOut: r.checkOutTime ? new Date(r.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined,
              status: r.status,
              subject: r.subjectSchedule?.subject?.subjectName || 'Unknown Subject',
              room: r.subjectSchedule?.room?.roomNo || 'Unknown Room',
              notes: r.notes,
              isManualEntry: r.attendanceType === 'MANUAL_ENTRY',
              createdAt: new Date(r.timestamp).toISOString(),
              updatedAt: new Date(r.timestamp).toISOString()
            }))
          : [];
        setFetchedRecords(apiRecords);
      } catch (err) {
        console.error('Failed to fetch filtered records:', err);
        setFetchedRecords([]);
      } finally {
        setFetching(false);
      }
    };
    fetchFiltered();
  }, [student, dateRange, selectedStatus, selectedSubject, customDateRange]);

  const allRecords = fetchedRecords !== null ? fetchedRecords : baseRecords;

  // Filter records based on current filters
  const filteredRecords = useMemo(() => {
    let filtered = allRecords;

    // Subject filter
    if (selectedSubject !== 'all') {
      filtered = filtered.filter(record => record.subject === selectedSubject);
    }

    // Status filter
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(record => record.status === selectedStatus);
    }

    return filtered;
  }, [allRecords, selectedSubject, selectedStatus]);

  // Pagination
  const totalPages = Math.ceil(filteredRecords.length / pageSize);
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedRecords = filteredRecords.slice(startIndex, endIndex);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [selectedSubject, selectedStatus, dateRange]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PRESENT': return 'bg-green-100 text-green-800 border-green-200';
      case 'LATE': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'ABSENT': return 'bg-red-100 text-red-800 border-red-200';
      case 'EXCUSED': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (!student) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden p-0 rounded-xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 rounded-t-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold text-white">
                  Student Attendance Records
                </DialogTitle>
                <p className="text-blue-100 text-sm">
                  {student.studentName} • {student.studentIdNum}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-full hover:bg-white/20 text-white"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-6 w-6" />
            </Button>
          </div>
          
          {/* Student Stats */}
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/10 rounded-xl p-3">
              <div className="text-2xl font-bold text-white">{student.attendanceRate}%</div>
              <div className="text-blue-100 text-sm">Overall Attendance</div>
            </div>
            <div className="bg-white/10 rounded-xl p-3">
              <div className="text-2xl font-bold text-green-400">{student.attendedClasses}</div>
              <div className="text-blue-100 text-sm">Present</div>
            </div>
            <div className="bg-white/10 rounded-xl p-3">
              <div className="text-2xl font-bold text-red-400">{student.absentClasses}</div>
              <div className="text-blue-100 text-sm">Absent</div>
            </div>
            <div className="bg-white/10 rounded-xl p-3">
              <div className="text-2xl font-bold text-yellow-400">{student.lateClasses}</div>
              <div className="text-blue-100 text-sm">Late</div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="p-6 border-b bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Date Range</label>
              <div className="flex gap-2">
                <Select value={dateRange} onValueChange={(value) => {
                  setDateRange(value);
                  if (value === 'custom') {
                    // Initialize with today's date if not set
                    if (!customDateRange.start || !customDateRange.end) {
                      const today = new Date();
                      setCustomDateRange({
                        start: today,
                        end: today
                      });
                    }
                    setIsDatePickerOpen(true);
                  }
                }}>
                  <SelectTrigger className="rounded border-gray-300 bg-white text-gray-700 hover:bg-gray-50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="last-7-days">Last 7 Days</SelectItem>
                    <SelectItem value="last-30-days">Last 30 Days</SelectItem>
                    <SelectItem value="this-month">This Month</SelectItem>
                    <SelectItem value="this-semester">This Semester</SelectItem>
                    <SelectItem value="custom">Custom Range</SelectItem>
                  </SelectContent>
                </Select>
                
                {dateRange === 'custom' && (
                  <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="rounded border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                        onClick={() => setIsDatePickerOpen(true)}
                      >
                        <Calendar className="w-4 h-4 mr-2" />
                        {formatDateRange()}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent 
                      className="w-auto p-4 rounded-xl" 
                      align="start" 
                      side="bottom" 
                      sideOffset={5}
                      alignOffset={-20}
                      avoidCollisions={true}
                      collisionPadding={20}
                      onOpenAutoFocus={(e) => e.preventDefault()}
                    >
                      <div className="p-0">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold text-blue-900">Select Date Range</h3>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsDatePickerOpen(false)}
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
                                onClick={() => {
                                  setSelectionMode('single');
                                  setRangeSelectionStep('start');
                                  const today = new Date();
                                  setCustomDateRange({ start: today, end: today });
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
                                onClick={() => {
                                  setSelectionMode('range');
                                  setRangeSelectionStep('start');
                                  const today = new Date();
                                  setCustomDateRange({ start: today, end: today });
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
                            onClick={() => {
                              const today = new Date();
                              setCustomDateRange({
                                start: today,
                                end: today
                              });
                              // Trigger data refresh
                              setDateRange('custom');
                            }}
                          >
                            Clear
                          </Button>
                          <Button
                            size="sm"
                            className="rounded"
                            onClick={() => {
                              setIsDatePickerOpen(false);
                              // Trigger data refresh by updating the dateRange to force useEffect
                              setDateRange('custom');
                            }}
                          >
                            Apply
                          </Button>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                )}
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Subject</label>
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger className="rounded border-gray-300 bg-white text-gray-700 hover:bg-gray-50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All subjects</SelectItem>
                  {student.subjects?.map((subject) => (
                    <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                  )) || []}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Status</label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="rounded border-gray-300 bg-white text-gray-700 hover:bg-gray-50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="PRESENT">Present</SelectItem>
                  <SelectItem value="LATE">Late</SelectItem>
                  <SelectItem value="ABSENT">Absent</SelectItem>
                  <SelectItem value="EXCUSED">Excused</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Records Table */}
        <div className="flex-1 overflow-y-auto">
          {fetching ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading attendance records...</p>
              </div>
            </div>
          ) : paginatedRecords.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <ClipboardList className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No attendance records found</p>
                <p className="text-gray-500 text-sm">Try adjusting your filters</p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Date</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Subject</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Room</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Time In</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Time Out</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {paginatedRecords.map((record) => (
                    <tr key={record.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">{record.date}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{record.subject}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{record.room}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{record.timeIn || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{record.timeOut || '-'}</td>
                      <td className="px-4 py-3">
                        <Badge className={`${getStatusColor(record.status)} text-xs px-2 py-1 rounded-full`}>
                          {record.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 max-w-xs truncate">
                        {record.notes || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 bg-gray-50 border-t border-gray-200 flex-shrink-0">
          <div className="flex items-center gap-4">
            {filteredRecords.length > 0 && (
              <div className="text-sm text-gray-700">
                Showing {startIndex + 1} to {Math.min(endIndex, filteredRecords.length)} of {filteredRecords.length} records
              </div>
            )}
            {filteredRecords.length > 0 && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="rounded"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </Button>
                <span className="text-sm text-gray-700 px-3">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="rounded"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            {showCopyButton && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(student.studentName, 'Student Name')}
                className="rounded border-blue-300 text-blue-700 hover:bg-blue-50"
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy
              </Button>
            )}
            {showPrintButton && (
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrint}
                className="rounded border-blue-300 text-blue-700 hover:bg-blue-50"
              >
                <Printer className="w-4 h-4 mr-2" />
                Print
              </Button>
            )}
            {showExportButton && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                className="rounded border-blue-300 text-blue-700 hover:bg-blue-50"
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
