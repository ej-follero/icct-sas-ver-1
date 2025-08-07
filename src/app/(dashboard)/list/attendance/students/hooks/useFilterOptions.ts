import { useState, useCallback, useMemo, useEffect } from 'react';
import { StudentAttendance } from '@/types/student-attendance';

interface FilterOptions {
  [key: string]: string[];
  departments: string[];
  departmentCodes: string[];
  courses: string[];
  courseCodes: string[];
  sections: string[];
  sectionCodes: string[];
  subjects: string[];
  subjectCodes: string[];
  instructors: string[];
  instructorNames: string[];
  rooms: string[];
  roomNumbers: string[];
  yearLevels: string[];
  riskLevels: string[];
  studentStatuses: string[];
  studentTypes: string[];
  enrollmentStatuses: string[];
  attendanceRates: string[];
  attendanceStatuses: string[];
  timeOfDay: string[];
  attendanceTrends: string[];
  verificationStatus: string[];
  attendanceTypes: string[];
  eventTypes: string[];
  semester: string[];
  academicYear: string[];
  subjectInstructors: string[];
  subjectRooms: string[];
  subjectScheduleDays: string[];
  subjectScheduleTimes: string[];
  instructorTypes: string[];
  roomTypes: string[];
}

interface UseFilterOptionsReturn {
  filterOptions: FilterOptions;
  loading: boolean;
  error: string | null;
  refreshOptions: () => void;
  getFilterCount: (filterType: string, option: string) => number;
}

// Mock data for fallback when API fails
const getMockFilterOptions = (): FilterOptions => ({
  departments: ['CS - Computer Science', 'IT - Information Technology', 'CE - Computer Engineering', 'EE - Electrical Engineering'],
  departmentCodes: ['CS', 'IT', 'CE', 'EE'],
  courses: ['BSCS', 'BSIT', 'BSCE', 'BSEE'],
  courseCodes: ['BSCS', 'BSIT', 'BSCE', 'BSEE'],
  sections: ['A', 'B', 'C', 'D', 'E'],
  sectionCodes: ['A', 'B', 'C', 'D', 'E'],
  subjects: ['Programming Fundamentals', 'Database Management', 'Web Development', 'Computer Networks', 'Data Structures'],
  subjectCodes: ['CS101', 'CS201', 'CS301', 'CS401', 'CS501'],
  instructors: ['John Doe', 'Jane Smith', 'Mike Johnson', 'Sarah Wilson', 'David Brown'],
  instructorNames: ['John Doe', 'Jane Smith', 'Mike Johnson', 'Sarah Wilson', 'David Brown'],
  rooms: ['Room 101', 'Room 102', 'Room 103', 'Room 201', 'Room 202'],
  roomNumbers: ['101', '102', '103', '201', '202'],
  yearLevels: ['FIRST_YEAR', 'SECOND_YEAR', 'THIRD_YEAR', 'FOURTH_YEAR'],
  riskLevels: ['HIGH', 'MEDIUM', 'LOW', 'NONE'],
  studentStatuses: ['ACTIVE', 'INACTIVE', 'SUSPENDED'],
  studentTypes: ['REGULAR', 'IRREGULAR'],
  enrollmentStatuses: ['ENROLLED', 'DROPPED', 'GRADUATED', 'TRANSFERRED'],
  attendanceRates: ['High (≥90%)', 'Medium (75-89%)', 'Low (<75%)'],
  attendanceStatuses: ['PRESENT', 'LATE', 'ABSENT', 'EXCUSED'],
  timeOfDay: ['Morning (6AM-12PM)', 'Afternoon (12PM-6PM)', 'Evening (6PM-12AM)', 'Night (12AM-6AM)'],
  attendanceTrends: ['Improving', 'Declining', 'Stable', 'Fluctuating'],
  verificationStatus: ['PENDING', 'VERIFIED', 'DISPUTED', 'REJECTED'],
  attendanceTypes: ['RFID_SCAN', 'MANUAL_ENTRY', 'ONLINE'],
  eventTypes: ['REGULAR_CLASS', 'MAKEUP_CLASS', 'EXAM', 'SPECIAL_EVENT'],
  semester: ['FIRST_SEMESTER', 'SECOND_SEMESTER', 'THIRD_SEMESTER'],
  academicYear: ['2023-2024', '2024-2025', '2025-2026'],
  subjectScheduleDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
  subjectScheduleTimes: ['8:00 AM - 9:00 AM', '9:00 AM - 10:00 AM', '10:00 AM - 11:00 AM', '11:00 AM - 12:00 PM'],
  instructorTypes: ['FULL_TIME', 'PART_TIME', 'VISITING'],
  roomTypes: ['LECTURE_HALL', 'LABORATORY', 'SEMINAR_ROOM'],
  subjectInstructors: ['John Doe', 'Jane Smith', 'Mike Johnson', 'Sarah Wilson', 'David Brown'],
  subjectRooms: ['Room 101', 'Room 102', 'Room 103', 'Room 201', 'Room 202'],
});

export const useFilterOptions = (studentsData: StudentAttendance[]): UseFilterOptionsReturn => {
  const [filterOptions, setFilterOptions] = useState<FilterOptions>(getMockFilterOptions());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch filter options from API
  const fetchFilterOptions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/attendance/filters');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Transform the API data to match our filter structure
      const transformedOptions: FilterOptions = {
        // Department filters - use displayName for better UX
        departments: data.departments ? data.departments.map((d: any) => String(d.displayName)) : [],
        departmentCodes: data.departments ? data.departments.map((d: any) => String(d.code)) : [],
        
        // Course filters - use code for better UX
        courses: data.courses ? data.courses.map((c: any) => String(c.code)) : [],
        courseCodes: data.courses ? data.courses.map((c: any) => String(c.code)) : [],
        
        // Section filters - use code for better UX
        sections: data.sections ? data.sections.map((s: any) => String(s.name)) : [],
        sectionCodes: data.sections ? data.sections.map((s: any) => String(s.name)) : [],
        
        // Subject filters - use code for better UX
        subjects: data.subjects ? data.subjects.map((s: any) => String(s.code)) : [],
        subjectCodes: data.subjects ? data.subjects.map((s: any) => String(s.code)) : [],
        
        // Instructor filters - use displayName for better UX
        instructors: data.instructors ? data.instructors.map((i: any) => String(i.displayName)) : [],
        instructorNames: data.instructors ? data.instructors.map((i: any) => String(i.name)) : [],
        
        // Room filters - use displayName for better UX
        rooms: data.rooms ? data.rooms.map((r: any) => String(r.displayName)) : [],
        roomNumbers: data.rooms ? data.rooms.map((r: any) => String(r.name)) : [],
        
        // Schedule filters - from database
        subjectScheduleDays: data.scheduleDays ? data.scheduleDays.map(String) : [],
        subjectScheduleTimes: data.scheduleTimes ? data.scheduleTimes.map(String) : [],
        
        // Student-based filters - from database
        yearLevels: data.yearLevels ? data.yearLevels.map(String) : [],
        studentStatuses: data.studentStatuses ? data.studentStatuses.map(String) : [],
        studentTypes: data.studentTypes ? data.studentTypes.map(String) : [],
        
        // Instructor-based filters - from database
        instructorTypes: data.instructorTypes ? data.instructorTypes.map(String) : [],
        
        // Room-based filters - from database
        roomTypes: data.roomTypes ? data.roomTypes.map(String) : [],
        
        // Static filter options (not from database)
        riskLevels: ['HIGH', 'MEDIUM', 'LOW', 'NONE'],
        enrollmentStatuses: ['ENROLLED', 'DROPPED', 'GRADUATED', 'TRANSFERRED'],
        attendanceRates: ['High (≥90%)', 'Medium (75-89%)', 'Low (<75%)'],
        attendanceStatuses: ['PRESENT', 'LATE', 'ABSENT', 'EXCUSED'],
        timeOfDay: ['Morning (6AM-12PM)', 'Afternoon (12PM-6PM)', 'Evening (6PM-12AM)', 'Night (12AM-6AM)'],
        attendanceTrends: ['Improving', 'Declining', 'Stable', 'Fluctuating'],
        verificationStatus: ['PENDING', 'VERIFIED', 'DISPUTED', 'REJECTED'],
        attendanceTypes: ['RFID_SCAN', 'MANUAL_ENTRY', 'ONLINE'],
        eventTypes: ['REGULAR_CLASS', 'MAKEUP_CLASS', 'EXAM', 'SPECIAL_EVENT'],
        semester: ['FIRST_SEMESTER', 'SECOND_SEMESTER', 'THIRD_SEMESTER'],
        academicYear: ['2023-2024', '2024-2025', '2025-2026'],
        
        // Legacy properties for backward compatibility
        subjectInstructors: data.instructors ? data.instructors.map((i: any) => String(i.displayName)) : [],
        subjectRooms: data.rooms ? data.rooms.map((r: any) => String(r.displayName)) : [],
      };
      
      setFilterOptions(transformedOptions);
      console.log('Filter options loaded successfully from API:', {
        departments: transformedOptions.departments.length,
        courses: transformedOptions.courses.length,
        subjects: transformedOptions.subjects.length,
        instructors: transformedOptions.instructors.length,
        rooms: transformedOptions.rooms.length,
      });
    } catch (error) {
      console.error('Error fetching filter options from API, using mock data:', error);
      setError('Using mock data due to API connection issue');
      // Use mock data as fallback
      setFilterOptions(getMockFilterOptions());
    } finally {
      setLoading(false);
    }
  }, []);

  // Initialize with mock data and try to fetch from API
  useEffect(() => {
    // Start with mock data immediately
    setFilterOptions(getMockFilterOptions());
    setLoading(false);
    
    // Then try to fetch from API in the background
    fetchFilterOptions();
  }, [fetchFilterOptions]);

  // Get filter count for a specific option
  const getFilterCount = useCallback((filterType: string, option: string): number => {
    if (!studentsData || studentsData.length === 0) return 0;
    
    return studentsData.filter(student => {
      switch (filterType) {
        case 'departments':
          const studentDeptCode = student.department?.split(' - ')[0];
          return studentDeptCode === option;
        case 'courses':
          return student.course === option;
        case 'yearLevels':
          const studentYearLevel = typeof student.yearLevel === 'string' && student.yearLevel.includes('_') 
            ? student.yearLevel.replace('_', ' ') 
            : student.yearLevel;
          return studentYearLevel === option;
        case 'attendanceRates':
          if (option === 'High (≥90%)') return student.attendanceRate >= 90;
          if (option === 'Medium (75-89%)') return student.attendanceRate >= 75 && student.attendanceRate < 90;
          if (option === 'Low (<75%)') return student.attendanceRate < 75;
          return false;
        case 'riskLevels':
          return student.riskLevel === option;
        case 'studentStatuses':
          return student.status === option;
        case 'studentTypes':
          return student.studentType === option;
        case 'sections':
          return student.academicInfo?.sectionName === option;
        case 'subjects':
          return student.subjects?.some(subject => 
            subject.subjectCode === option || subject.subjectName === option
          );
        case 'subjectInstructors':
          return student.subjects?.some(subject => subject.instructor === option);
        case 'subjectRooms':
          return student.subjects?.some(subject => subject.room === option);
        default:
          return false;
      }
    }).length;
  }, [studentsData]);

  // Refresh options function
  const refreshOptions = useCallback(() => {
    fetchFilterOptions();
  }, [fetchFilterOptions]);

  return {
    filterOptions,
    loading,
    error,
    refreshOptions,
    getFilterCount,
  };
}; 