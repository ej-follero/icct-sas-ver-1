import React, { useState, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Clock, ChevronUp, ChevronDown } from 'lucide-react';
import { Table as UITable, TableHeader as UITableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { RecentAttendanceRecord } from '@/types/student-attendance';

interface StudentAttendanceDetailTableProps {
  records: RecentAttendanceRecord[];
}

const StudentAttendanceDetailTable: React.FC<StudentAttendanceDetailTableProps> = ({ records }) => {
  const [sortField, setSortField] = useState<'timestamp' | 'status' | 'attendanceType'>('timestamp');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const sortedRecords = useMemo(() => {
    return [...records].sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      if (aValue && bValue) {
        if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [records, sortField, sortDirection]);

  const handleSort = (field: 'timestamp' | 'status' | 'attendanceType') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  if (!records || records.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Clock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
        <p>No attendance records found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Attendance History</h3>
        <Badge variant="outline">{records.length} records</Badge>
      </div>
      <div className="border rounded-lg overflow-hidden">
        <UITable>
          <UITableHeader>
            <TableRow>
              <TableHead 
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => handleSort('timestamp')}
              >
                <div className="flex items-center gap-1">
                  Date & Time
                  {sortField === 'timestamp' && (
                    sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                  )}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => handleSort('attendanceType')}
              >
                <div className="flex items-center gap-1">
                  Type
                  {sortField === 'attendanceType' && (
                    sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                  )}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => handleSort('status')}
              >
                <div className="flex items-center gap-1">
                  Status
                  {sortField === 'status' && (
                    sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                  )}
                </div>
              </TableHead>
              <TableHead>Verification</TableHead>
              <TableHead>Notes</TableHead>
            </TableRow>
          </UITableHeader>
          <TableBody>
            {sortedRecords.map((record, index) => (
              <TableRow key={index} className="hover:bg-gray-50">
                <TableCell className="font-medium">
                  {new Date(record.timestamp).toLocaleString()}
                </TableCell>
                <TableCell>{record.attendanceType}</TableCell>
                <TableCell>
                  <Badge 
                    className={`${record.status === 'PRESENT' 
                      ? 'bg-green-100 text-green-800' 
                      : record.status === 'LATE'
                      ? 'bg-yellow-100 text-yellow-800'
                      : record.status === 'ABSENT'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {record.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge 
                    className={`${record.verification === 'VERIFIED' 
                      ? 'bg-green-100 text-green-800' 
                      : record.verification === 'PENDING'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {record.verification}
                  </Badge>
                </TableCell>
                <TableCell className="max-w-xs truncate">
                  {record.notes || '-'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </UITable>
      </div>
    </div>
  );
};

export default StudentAttendanceDetailTable; 