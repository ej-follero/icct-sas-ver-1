export interface Subject {
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