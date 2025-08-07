import { useState, useEffect, useMemo, useCallback } from 'react';
import { StudentAttendance, AttendanceStatus, AttendanceType, AttendanceVerification } from '@/types/student-attendance';

interface Filters {
  departments: string[];
  courses: string[];
  yearLevels: string[];
  attendanceRates: string[];
  riskLevels: string[];
  studentStatuses: string[];
  studentTypes: string[];
  sections: string[];
  subjects: string[];
  subjectInstructors: string[];
  subjectRooms: string[];
  subjectScheduleDays: string[];
  subjectScheduleTimes: string[];
  subjectEnrollments: string[];
  enrollmentStatuses: string[];
  dateRangeStart: string[];
  dateRangeEnd: string[];
  verificationStatus: string[];
  attendanceTypes: string[];
  eventTypes: string[];
  semester: string[];
  academicYear: string[];
  attendanceStatuses: string[];
  timeOfDay: string[];
  attendanceTrends: string[];
  [key: string]: string[];
}

interface UseStudentDataReturn {
  studentsData: StudentAttendance[];
  filteredStudents: StudentAttendance[];
  sortedStudents: StudentAttendance[];
  paginatedStudents: StudentAttendance[];
  loading: boolean;
  error: string | null;
  page: number;
  pageSize: number;
  totalPages: number;
  rangeStart: number;
  rangeEnd: number;
  sortBy: 'attendance-desc' | 'attendance-asc' | 'name' | 'id' | 'status' | 'department' | 'course' | 'year-level';
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  setSortBy: (sort: 'attendance-desc' | 'attendance-asc' | 'name' | 'id' | 'status' | 'department' | 'course' | 'year-level') => void;
  refreshData: () => void;
  fetchStudentsData: () => Promise<void>;
}

export default function useStudentData(
  filters: Filters,
  searchQuery: string,
  debouncedSearch: string
): UseStudentDataReturn {
  const [studentsData, setStudentsData] = useState<StudentAttendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [sortBy, setSortBy] = useState<'attendance-desc' | 'attendance-asc' | 'name' | 'id' | 'status' | 'department' | 'course' | 'year-level'>('attendance-desc');

  // Mock data for demonstration
  const mockStudents: StudentAttendance[] = [
    {
      id: '1',
      studentName: 'John Doe',
      studentId: '2024-001',
      studentIdNumber: '2024-001',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      phoneNumber: '+1234567890',
      department: 'Computer Science',
      course: 'BSCS',
      yearLevel: 'First Year',
      gender: 'Male',
      status: 'Present',
      studentType: 'Regular',
      subjects: [],
      presentDays: 19,
      absentDays: 1,
      lateDays: 0,
      totalDays: 20,
      attendanceRate: 95.5,
      lastAttendance: new Date().toISOString(),
      lastAttendanceStatus: AttendanceStatus.PRESENT,
      lastAttendanceType: AttendanceType.REGULAR,
      lastVerificationStatus: AttendanceVerification.VERIFIED,
      riskLevel: 'NONE',
      sectionInfo: {
        sectionName: 'CS-1A',
        sectionCode: 'CS-1A',
        instructor: { name: 'Dr. Smith', email: 'dr.smith@example.com' }
      },
      academicInfo: {
        totalSubjects: 5,
        currentEnrollment: 5,
        sectionName: 'CS-1A',
        instructor: 'Dr. Smith'
      }
    },
    {
      id: '2',
      studentName: 'Jane Smith',
      studentId: '2024-002',
      studentIdNumber: '2024-002',
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane.smith@example.com',
      phoneNumber: '+1234567891',
      department: 'Computer Science',
      course: 'BSCS',
      yearLevel: 'First Year',
      gender: 'Female',
      status: 'Late',
      studentType: 'Regular',
      subjects: [],
      presentDays: 17,
      absentDays: 2,
      lateDays: 1,
      totalDays: 20,
      attendanceRate: 85.0,
      lastAttendance: new Date().toISOString(),
      lastAttendanceStatus: AttendanceStatus.LATE,
      lastAttendanceType: AttendanceType.REGULAR,
      lastVerificationStatus: AttendanceVerification.VERIFIED,
      riskLevel: 'LOW',
      sectionInfo: {
        sectionName: 'CS-1A',
        sectionCode: 'CS-1A',
        instructor: { name: 'Dr. Smith', email: 'dr.smith@example.com' }
      },
      academicInfo: {
        totalSubjects: 5,
        currentEnrollment: 5,
        sectionName: 'CS-1A',
        instructor: 'Dr. Smith'
      }
    }
  ];

  const fetchStudentsData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setStudentsData(mockStudents);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch students');
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshData = useCallback(() => {
    fetchStudentsData();
  }, [fetchStudentsData]);

  useEffect(() => {
    fetchStudentsData();
  }, [fetchStudentsData]);

  // Filter students based on search and filters
  const filteredStudents = useMemo(() => {
    return studentsData.filter(student => {
      // Search filter
      if (debouncedSearch) {
        const searchLower = debouncedSearch.toLowerCase();
        const matchesSearch = 
          student.studentName.toLowerCase().includes(searchLower) ||
          student.studentId.toLowerCase().includes(searchLower) ||
          student.email.toLowerCase().includes(searchLower) ||
          student.department.toLowerCase().includes(searchLower);
        
        if (!matchesSearch) return false;
      }

      // Department filter
      if (filters.departments.length > 0 && !filters.departments.includes(student.department)) {
        return false;
      }

      // Course filter
      if (filters.courses.length > 0 && !filters.courses.includes(student.course)) {
        return false;
      }

      // Year level filter
      if (filters.yearLevels.length > 0 && !filters.yearLevels.includes(student.yearLevel)) {
        return false;
      }

      // Risk level filter
      if (filters.riskLevels.length > 0 && student.riskLevel && !filters.riskLevels.includes(student.riskLevel)) {
        return false;
      }

      // Status filter
      if (filters.attendanceStatuses.length > 0 && !filters.attendanceStatuses.includes(student.status)) {
        return false;
      }

      return true;
    });
  }, [studentsData, debouncedSearch, filters]);

  // Sort students
  const sortedStudents = useMemo(() => {
    const sorted = [...filteredStudents];
    
    switch (sortBy) {
      case 'attendance-desc':
        return sorted.sort((a, b) => b.attendanceRate - a.attendanceRate);
      case 'attendance-asc':
        return sorted.sort((a, b) => a.attendanceRate - b.attendanceRate);
      case 'name':
        return sorted.sort((a, b) => a.studentName.localeCompare(b.studentName));
      case 'id':
        return sorted.sort((a, b) => a.studentId.localeCompare(b.studentId));
      case 'department':
        return sorted.sort((a, b) => a.department.localeCompare(b.department));
      case 'course':
        return sorted.sort((a, b) => a.course.localeCompare(b.course));
      case 'year-level':
        return sorted.sort((a, b) => a.yearLevel.localeCompare(b.yearLevel));
      default:
        return sorted;
    }
  }, [filteredStudents, sortBy]);

  // Paginate students
  const totalPages = Math.ceil(sortedStudents.length / pageSize);
  const rangeStart = (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, sortedStudents.length);
  
  const paginatedStudents = useMemo(() => {
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    return sortedStudents.slice(start, end);
  }, [sortedStudents, page, pageSize]);

  return {
    studentsData,
    filteredStudents,
    sortedStudents,
    paginatedStudents,
    loading,
    error,
    page,
    pageSize,
    totalPages,
    rangeStart,
    rangeEnd,
    sortBy,
    setPage,
    setPageSize,
    setSortBy,
    refreshData,
    fetchStudentsData
  };
} 