import React from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { User, Hash, Mail, BarChart3, CheckCircle, AlertCircle, Clock, Calendar as CalendarIcon } from "lucide-react";
import { StudentAttendance } from '@/types/student-attendance';

interface StudentAttendanceExpanderProps {
  student: StudentAttendance;
}

export const StudentAttendanceExpander: React.FC<StudentAttendanceExpanderProps> = ({ student }) => {
  return (
    <div className="flex flex-col md:flex-row gap-8 p-8 bg-white shadow-lg border border-blue-100">
      {/* Profile Section */}
      <div className="flex-1 min-w-0 flex flex-col gap-6">
        <div className="flex items-center gap-6 mb-4">
          <Avatar className="h-20 w-20 ring-4 ring-blue-200 shadow-md">
            <AvatarImage src={student.avatarUrl} className="object-cover" />
            <AvatarFallback className="bg-blue-100 text-blue-700 font-bold text-2xl">
              {`${student.firstName?.[0] || ''}${student.lastName?.[0] || ''}` || student.studentName.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="text-2xl font-extrabold text-blue-900 flex items-center gap-2">
              <User className="w-6 h-6 text-blue-400" />
              {student.studentName}
            </div>
            <div className="text-base text-blue-700 flex items-center gap-2 mt-1">
              <Hash className="w-5 h-5 text-blue-300" />
              {student.studentId}
            </div>
          </div>
        </div>
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="text-lg font-semibold text-blue-800 mb-2 flex items-center gap-2">
            <Mail className="w-5 h-5 text-blue-400" />Contact Information
          </div>
          <div className="text-sm text-blue-900 mb-1"><span className="font-medium">Email:</span> {student.email || 'N/A'}</div>
          <div className="text-sm text-blue-900 mb-1"><span className="font-medium">Phone:</span> {student.phoneNumber || 'N/A'}</div>
          <div className="text-sm text-blue-900"><span className="font-medium">Student Type:</span> {student.studentType || 'N/A'}</div>
        </div>
      </div>
      {/* Divider for desktop */}
      <div className="hidden md:block w-px bg-blue-100 mx-2" />
      {/* Attendance Breakdown Section */}
      <div className="flex-1 min-w-0 flex flex-col gap-6">
        <div className="bg-blue-50 rounded-lg p-4 h-full flex flex-col justify-between">
          <div className="text-lg font-semibold text-blue-800 mb-2 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-400" />Attendance Breakdown
          </div>
          <div className="flex flex-col gap-3 mt-2">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <span className="font-medium text-blue-900">Present Days:</span>
              <span className="text-lg font-bold text-green-700">{student.presentDays ?? 'N/A'}</span>
            </div>
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <span className="font-medium text-blue-900">Absent Days:</span>
              <span className="text-lg font-bold text-red-700">{student.absentDays ?? 'N/A'}</span>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-yellow-400" />
              <span className="font-medium text-blue-900">Late Days:</span>
              <span className="text-lg font-bold text-yellow-700">{student.lateDays ?? 'N/A'}</span>
            </div>
            <div className="flex items-center gap-3">
              <CalendarIcon className="w-5 h-5 text-blue-400" />
              <span className="font-medium text-blue-900">Last Attendance:</span>
              <span className="text-lg font-bold text-blue-900">{student.lastAttendance ? new Date(student.lastAttendance).toLocaleDateString() : 'N/A'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 