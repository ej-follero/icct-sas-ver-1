export interface Subject {
  subjectId: number;
  subjectName: string;
  subjectCode: string;
  subjectType: 'LECTURE' | 'LABORATORY' | 'HYBRID' | 'THESIS' | 'RESEARCH' | 'INTERNSHIP';
  status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED' | 'PENDING_REVIEW';
  description?: string;
  lectureUnits: number;
  labUnits: number;
  creditedUnits: number;
  totalHours: number;
  prerequisites?: string;
  courseId: number;
  departmentId: number;
  academicYear: string;
  semester: 'FIRST_SEMESTER' | 'SECOND_SEMESTER' | 'THIRD_SEMESTER';
  maxStudents: number;
  createdAt: string;
  updatedAt: string;
  
  // Related data (from joins)
  department?: {
    departmentId: number;
    departmentName: string;
    departmentCode: string;
  };
  course?: {
    courseId: number;
    courseName: string;
    courseCode: string;
  };
  instructors?: Array<{
    instructorId: number;
    firstName: string;
    lastName: string;
    email: string;
  }>;
}

// Legacy interface for backward compatibility (if needed)
export interface LegacySubject {
  id: string;
  name: string;
  code: string;
  type: 'lecture' | 'laboratory' | 'both';
  lecture_units?: number;
  laboratory_units?: number;
  units: number;
  semester: '1st' | '2nd' | '3rd';
  year_level: '1st' | '2nd' | '3rd' | '4th';
  department: string;
  description?: string;
  status: 'active' | 'inactive';
  instructors: string[];
  prerequisites: string[];
} 