"use client";

import { useState, useMemo, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Download, X, Calendar, Copy, Printer, ClipboardList } from "lucide-react";
import { toast } from "sonner";

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

interface InstructorData {
  instructorId: string;
  instructorName: string;
  employeeId: string;
  department: string;
  attendanceRate: number;
  attendedClasses: number;
  absentClasses: number;
  lateClasses: number;
  totalScheduledClasses: number;
  subjects: string[];
  avatarUrl?: string;
}

interface AttendanceRecordsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  instructor: InstructorData | null;
  records?: AttendanceRecord[];
  loading?: boolean;
  showCopyButton?: boolean;
  showPrintButton?: boolean;
  showExportButton?: boolean;
}

export default function AttendanceRecordsDialog({
  open,
  onOpenChange,
  instructor,
  records = [],
  loading = false,
  showCopyButton = true,
  showPrintButton = true,
  showExportButton = true
}: AttendanceRecordsDialogProps) {
  const [dateRange, setDateRange] = useState("last-30-days");
  const [selectedSubject, setSelectedSubject] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [fetchedRecords, setFetchedRecords] = useState<AttendanceRecord[] | null>(null);
  const [fetching, setFetching] = useState(false);

  // Do not early return before hooks; guard rendering later to keep hook order stable

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

  // Prefer records passed via props; otherwise, try to map instructor.attendanceRecords from API
  const mappedInstructorRecords: AttendanceRecord[] = Array.isArray((instructor as any)?.attendanceRecords)
    ? ((instructor as any).attendanceRecords as any[]).slice(0, 50).map((r: any) => ({
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

  const baseRecords = records.length > 0 ? records : mappedInstructorRecords;

  // Fetch records from API when filters change
  useEffect(() => {
    if (!instructor) return;
    const fetchFiltered = async () => {
      try {
        setFetching(true);
        const params = new URLSearchParams();
        params.append('instructorId', instructor?.instructorId || '');

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
          // No-op for now (could wire to a real date picker later)
          start = null;
          end = null;
        }

        if (start) params.append('startDate', start.toISOString());
        if (end) params.append('endDate', end.toISOString());

        if (selectedStatus !== 'all') params.append('status', selectedStatus);
        if (selectedSubject !== 'all') params.append('subjectName', selectedSubject);

        const res = await fetch(`/api/attendance/instructors?${params.toString()}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const inst = Array.isArray(data) ? data[0] : null;
        const apiRecords: AttendanceRecord[] = Array.isArray(inst?.attendanceRecords)
          ? inst.attendanceRecords.map((r: any) => ({
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
        setPage(1);
      } catch (e) {
        // Fallback to base records on error
        setFetchedRecords(null);
      } finally {
        setFetching(false);
      }
    };

    fetchFiltered();
  }, [instructor, dateRange, selectedSubject, selectedStatus]);

  const displayRecords = fetchedRecords ?? baseRecords;

  // Ensure current page stays within bounds when data changes
  const totalRecords = displayRecords.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const paginatedRecords = useMemo(() => {
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return displayRecords.slice(startIndex, endIndex);
  }, [displayRecords, page, pageSize]);

  const rangeStart = totalRecords === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, totalRecords);

  // Compute a sliding window of page numbers (max 5)
  const visiblePages = useMemo(() => {
    const windowSize = 5;
    if (totalPages <= windowSize) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const start = Math.max(1, Math.min(page - 2, totalPages - (windowSize - 1)));
    return Array.from({ length: windowSize }, (_, i) => start + i);
  }, [page, totalPages]);

  // Guard rendering when no instructor is provided (hooks above still called consistently)
  if (!instructor) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-full w-full max-h-[90vh] overflow-hidden bg-white/95 backdrop-blur-sm border border-blue-200 shadow-2xl rounded-2xl p-0 mx-2 my-1 sm:max-w-[900px] sm:mx-4 sm:my-1 md:max-w-[1100px] md:mx-6 md:my-1 lg:max-w-[1300px] lg:mx-8 lg:my-1 flex flex-col h-full">
        {/* Header with gradient background - ViewDialog style */}
        <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 rounded-t-2xl p-6 relative flex-shrink-0">
          <div className="flex items-start gap-4 pr-24">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center overflow-hidden">
              <ClipboardList className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-white text-2xl font-bold flex items-center gap-3">
                Attendance Records
                <Badge className="bg-white/20 text-white border-white/30">
                  {instructor?.attendanceRate || 0}% Overall
                </Badge>
              </DialogTitle>
              <p className="text-blue-100 text-sm mt-1 font-medium">{instructor?.instructorName || 'N/A'} • {instructor?.employeeId || 'N/A'} • {instructor?.department || 'N/A'}</p>
            </div>
          </div>
          
          {/* Action buttons in header - Right side */}
          <div className="absolute right-4 top-4 flex items-center gap-2">
            {showCopyButton && (
              <Button
                variant="ghost"
                size="lg"
                className="text-white hover:bg-white/20 hover:text-white rounded"
                onClick={() => copyToClipboard(instructor?.instructorName || 'N/A', 'Instructor Name')}
              >
                <Copy className="w-4 h-4 mr-1" />
                Copy
              </Button>
            )}
            {showPrintButton && (
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20 rounded"
                onClick={handlePrint}
              >
                <Printer className="w-4 h-4 mr-1" />
                Print
              </Button>
            )}
            {showExportButton && (
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20 rounded"
                onClick={handleExport}
              >
                <Download className="w-4 h-4 mr-1" />
                Export
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-full hover:bg-white/20 text-white"
              onClick={() => onOpenChange(false)}
              aria-label="Close dialog"
            >
              <X className="h-6 w-6" />
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          <div className="p-6 space-y-6 max-h-full overflow-y-auto">
            {/* Quick Stats Row */}
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-green-50 border border-green-200 rounded p-4 text-center">
                <div className="text-2xl font-bold text-green-700">{instructor?.attendedClasses || 0}</div>
                <div className="text-sm text-green-600">Classes Attended</div>
              </div>
              <div className="bg-red-50 border border-red-200 rounded p-4 text-center">
                <div className="text-2xl font-bold text-red-700">{instructor?.absentClasses || 0}</div>
                <div className="text-sm text-red-600">Classes Missed</div>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded p-4 text-center">
                <div className="text-2xl font-bold text-yellow-700">{instructor?.lateClasses || 0}</div>
                <div className="text-sm text-yellow-600">Late Arrivals</div>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded p-4 text-center">
                <div className="text-2xl font-bold text-blue-700">{instructor?.totalScheduledClasses || 0}</div>
                <div className="text-sm text-blue-600">Total Scheduled</div>
              </div>
            </div>

            {/* Filters Section */}
            <div className="bg-gray-50 border border-gray-200 rounded p-4">
              <div className="flex flex-wrap gap-3 items-center justify-end">
                <Select value={dateRange} onValueChange={(v) => setDateRange(v)}>
                  <SelectTrigger className="w-full sm:w-44 text-sm text-gray-500 min-w-0 rounded border-gray-300 bg-white hover:bg-gray-50">
                    <SelectValue placeholder="Date Range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="last-30-days">Last 30 days</SelectItem>
                    <SelectItem value="last-7-days">Last 7 days</SelectItem>
                    <SelectItem value="this-month">This month</SelectItem>
                    <SelectItem value="this-semester">This semester</SelectItem>
                    <SelectItem value="custom">Custom range</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={selectedSubject} onValueChange={(v) => setSelectedSubject(v)}>
                  <SelectTrigger className="w-full sm:w-44 text-sm text-gray-500 min-w-0 rounded border-gray-300 bg-white hover:bg-gray-50">
                    <SelectValue placeholder="All subjects" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All subjects</SelectItem>
                    {instructor?.subjects?.map((subject) => (
                      <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                    )) || []}
                  </SelectContent>
                </Select>

                <Select value={selectedStatus} onValueChange={(v) => setSelectedStatus(v)}>
                  <SelectTrigger className="w-full sm:w-44 text-sm text-gray-500 min-w-0 rounded border-gray-300 bg-white hover:bg-gray-50">
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="PRESENT">Present</SelectItem>
                    <SelectItem value="ABSENT">Absent</SelectItem>
                    <SelectItem value="LATE">Late</SelectItem>
                    <SelectItem value="EXCUSED">Excused</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Attendance Records Table */}
            <div className="border border-gray-200 rounded overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                <h4 className="font-semibold text-gray-900">Recent Attendance Records</h4>
                <p className="text-sm text-gray-600">Showing last 50 records</p>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time In</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time Out</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Room</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedRecords.map((record, i) => (
                      <tr key={record.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900">{record.date}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{record.timeIn || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{record.timeOut || '-'}</td>
                        <td className="px-4 py-3">
                          <Badge className={
                            record.status === 'ABSENT' ? 'bg-red-100 text-red-800' :
                            record.status === 'LATE' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }>
                            {record.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">{record.subject}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{record.room}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">{record.notes || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination */}
              <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">
                    Showing {rangeStart} to {rangeEnd} of {totalRecords} records
                  </span>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="rounded" disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    {visiblePages.map((p) => (
                      <Button
                        key={p}
                        size="sm"
                        variant={p === page ? "default" : "outline"}
                        className="rounded"
                        onClick={() => setPage(p)}
                      >
                        {p}
                      </Button>
                    ))}
                    <Button size="sm" variant="outline" className="rounded" disabled={page === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
