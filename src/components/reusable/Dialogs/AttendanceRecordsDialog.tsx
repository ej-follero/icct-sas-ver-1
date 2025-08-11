"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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

  if (!instructor) return null;

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

  // Mock data for demonstration
  const mockRecords = Array.from({ length: 10 }, (_, i) => ({
    id: `record-${i}`,
    date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toLocaleDateString(),
    timeIn: i % 4 === 0 ? undefined : '8:00 AM',
    timeOut: i % 4 === 0 ? undefined : '5:00 PM',
    status: (i % 4 === 0 ? 'ABSENT' : i % 5 === 0 ? 'LATE' : 'PRESENT') as 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED',
    subject: instructor.subjects[i % instructor.subjects.length],
    room: `A-${200 + (i % 5)}`,
    notes: i % 4 === 0 ? 'Sick leave' : i % 5 === 0 ? 'Traffic delay' : undefined,
    isManualEntry: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }));

  const displayRecords = records.length > 0 ? records : mockRecords;

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
                  {instructor.attendanceRate}% Overall
                </Badge>
              </DialogTitle>
              <p className="text-blue-100 text-sm mt-1 font-medium">{instructor.instructorName} • {instructor.employeeId} • {instructor.department}</p>
            </div>
          </div>
          
          {/* Action buttons in header - Right side */}
          <div className="absolute right-4 top-4 flex items-center gap-2">
            {showCopyButton && (
              <Button
                variant="ghost"
                size="lg"
                className="text-white hover:bg-white/20 hover:text-white rounded"
                onClick={() => copyToClipboard(instructor.instructorName, 'Instructor Name')}
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
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-700">{instructor.attendedClasses}</div>
                <div className="text-sm text-green-600">Classes Attended</div>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-red-700">{instructor.absentClasses}</div>
                <div className="text-sm text-red-600">Classes Missed</div>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-yellow-700">{instructor.lateClasses}</div>
                <div className="text-sm text-yellow-600">Late Arrivals</div>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-700">{instructor.totalScheduledClasses}</div>
                <div className="text-sm text-blue-600">Total Scheduled</div>
              </div>
            </div>

            {/* Filters Section */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex flex-wrap gap-4 items-center">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-700">Date Range:</label>
                  <select 
                    className="text-sm border border-gray-300 rounded px-3 py-1"
                    value={dateRange}
                    onChange={(e) => setDateRange(e.target.value)}
                  >
                    <option value="last-30-days">Last 30 days</option>
                    <option value="last-7-days">Last 7 days</option>
                    <option value="this-month">This month</option>
                    <option value="this-semester">This semester</option>
                    <option value="custom">Custom range</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-700">Subject:</label>
                  <select 
                    className="text-sm border border-gray-300 rounded px-3 py-1"
                    value={selectedSubject}
                    onChange={(e) => setSelectedSubject(e.target.value)}
                  >
                    <option value="all">All subjects</option>
                    {instructor.subjects.map(subject => (
                      <option key={subject} value={subject}>{subject}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-700">Status:</label>
                  <select 
                    className="text-sm border border-gray-300 rounded px-3 py-1"
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                  >
                    <option value="all">All statuses</option>
                    <option value="PRESENT">Present</option>
                    <option value="ABSENT">Absent</option>
                    <option value="LATE">Late</option>
                    <option value="EXCUSED">Excused</option>
                  </select>
                </div>

              </div>
            </div>

            {/* Attendance Records Table */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
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
                    {displayRecords.map((record, i) => (
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
                    Showing 1 to 10 of 1,234 records
                  </span>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" disabled>
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="outline">1</Button>
                    <Button size="sm" variant="outline">2</Button>
                    <Button size="sm" variant="outline">3</Button>
                    <Button size="sm" variant="outline">
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
