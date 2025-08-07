import { StudentAttendance } from '@/types/student-attendance';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import React from 'react';

// Custom cell components
export const StudentAvatarCell = ({ student }: { student: StudentAttendance }) => (
  <div className="flex items-center gap-3">
    <div className="relative">
      <Avatar className="h-10 w-10 ring-1 ring-gray-200">
        <AvatarImage src={student.avatarUrl} className="object-cover" />
        <AvatarFallback className="bg-blue-100 text-blue-700 font-bold text-sm">
          {`${student.firstName?.[0] || ''}${student.lastName?.[0] || ''}` || student.studentName.split(' ').map(n => n[0]).join('')}
        </AvatarFallback>
      </Avatar>
      {student.status === 'ACTIVE' && (
        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border border-white"></div>
      )}
    </div>
    <div className="flex flex-col min-w-0 flex-1">
      <div className="font-semibold text-gray-900 truncate flex items-center gap-1">
        <span>{student.studentName}</span>
      </div>
      <div className="text-sm text-gray-600 truncate">{student.studentId}</div>
    </div>
  </div>
);

export const AttendanceRateBadge = ({ rate }: { rate: number }) => {
  const getAttendanceRateColor = (rate: number) => {
    if (rate >= 90) return { text: 'text-green-700', bg: 'bg-green-100', border: 'border-green-200', hex: '#10b981' };
    if (rate >= 75) return { text: 'text-yellow-700', bg: 'bg-yellow-100', border: 'border-yellow-200', hex: '#f59e0b' };
    return { text: 'text-red-700', bg: 'bg-red-100', border: 'border-red-200', hex: '#ef4444' };
  };
  const { text, bg, border } = getAttendanceRateColor(rate);
  return (
    <div className="flex items-center justify-center">
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${text} ${bg} ${border} border`}>
        {rate}%
      </span>
    </div>
  );
};

export const StatusBadge = ({ status }: { status: string }) => {
  const statusConfig = {
    'ACTIVE': { color: 'text-green-700', bg: 'bg-green-100', label: 'Active' },
    'INACTIVE': { color: 'text-gray-700', bg: 'bg-gray-100', label: 'Inactive' },
    'TRANSFERRED': { color: 'text-blue-700', bg: 'bg-blue-100', label: 'Transferred' },
    'GRADUATED': { color: 'text-purple-700', bg: 'bg-purple-100', label: 'Graduated' }
  };
  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.INACTIVE;
  const canEditStatus = true; // Replace with actual permission check
  return (
    <div className="flex items-center justify-center">
      <Badge 
        className={`${config.color} ${config.bg} text-xs px-3 py-1 rounded-full cursor-pointer hover:bg-blue-100`}
        onClick={(e) => {
          e.stopPropagation();
          toast.info('Status editing feature coming soon!');
        }}
      >
        {config.label}
      </Badge>
    </div>
  );
};

// Table column config
export const STUDENT_ATTENDANCE_COLUMNS = [
  { header: "Select", accessor: "select", className: "w-12 text-center" },
  { 
    header: "Student", 
    accessor: "studentName", 
    className: "text-blue-900 align-middle", 
    sortable: true,
    render: (student: StudentAttendance) => <StudentAvatarCell student={student} />
  },
  { header: "Department", accessor: "department", className: "text-blue-900 text-center align-middle", sortable: true },
  { header: "Course", accessor: "course", className: "text-blue-900 text-center align-middle", sortable: true },
  { header: "Year Level", accessor: "yearLevel", className: "text-blue-900 text-center align-middle", sortable: true },
  { 
    header: "Attendance Rate", 
    accessor: "attendanceRate", 
    className: "text-center align-middle", 
    sortable: true,
    render: (student: StudentAttendance) => <AttendanceRateBadge rate={student.attendanceRate} />
  },
  { 
    header: "Status", 
    accessor: "status", 
    className: "text-center align-middle", 
    render: (student: StudentAttendance) => <StatusBadge status={student.status} />,
    sortable: true
  },
  { 
    header: "Actions", 
    accessor: "actions", 
    className: "text-center align-middle w-32",
    render: (student: StudentAttendance) => null
  }
]; 