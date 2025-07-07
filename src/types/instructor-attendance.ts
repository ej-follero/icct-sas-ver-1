export interface InstructorAttendance {
  instructorId: string;
  instructorName: string;
  employeeId: string;
  department: string;
  instructorType: 'FULL_TIME' | 'PART_TIME';
  specialization?: string;
  subjects: string[];
  schedules: ScheduleAttendance[];
  
  // Attendance Metrics
  totalScheduledClasses: number;
  attendedClasses: number;
  absentClasses: number;
  lateClasses: number;
  onLeaveClasses: number;
  attendanceRate: number;
  
  // Recent Activity
  lastAttendance: Date;
  currentStreak: number;
  weeklyPattern: WeeklyAttendancePattern;
  
  // Performance Indicators
  punctualityScore: number;
  consistencyRating: number;
  riskLevel: RiskLevel;
  trend: number; // percentage change
  
  // Contact & Profile
  email: string;
  phoneNumber: string;
  officeLocation?: string;
  officeHours?: string;
  avatarUrl?: string;
  rfidTag: string;
  status: InstructorStatus;
}

export interface ScheduleAttendance {
  scheduleId: string;
  subjectName: string;
  subjectCode: string;
  sectionName: string;
  roomNumber: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  attendanceHistory: AttendanceRecord[];
  attendanceRate: number;
}

export interface AttendanceRecord {
  date: Date;
  status: AttendanceStatus;
  checkInTime?: Date;
  checkOutTime?: Date;
  duration?: number;
  verification: VerificationType;
  notes?: string;
  location?: string;
}

export interface WeeklyAttendancePattern {
  monday: number;
  tuesday: number;
  wednesday: number;
  thursday: number;
  friday: number;
  saturday: number;
  sunday: number;
}

export interface InstructorFilters {
  departments: string[];
  instructorTypes: string[];
  attendanceRates: string[];
  riskLevels: string[];
  subjects: string[];
  statuses: string[];
}

export interface AdvancedInstructorFilters {
  attendanceRangeMin: number;
  attendanceRangeMax: number;
  punctualityRangeMin: number;
  punctualityRangeMax: number;
  dateRangeStart: string;
  dateRangeEnd: string;
  lastAttendanceDays: string;
  scheduledClassesMin: string;
  scheduledClassesMax: string;
  absentDaysMin: string;
  absentDaysMax: string;
  lateDaysMin: string;
  lateDaysMax: string;
  consistencyRating: string;
  hasOfficeHours: boolean;
  rfidEnabled: boolean;
  logicalOperator: 'AND' | 'OR';
  customTextFilter: string;
}

export interface DateRange {
  start: string;
  end: string;
}

export interface FilterPreset {
  id: string;
  name: string;
  description: string;
  icon: any;
  filters: Partial<InstructorFilters>;
}

export enum AttendanceStatus {
  PRESENT = 'PRESENT',
  ABSENT = 'ABSENT',
  LATE = 'LATE',
  ON_LEAVE = 'ON_LEAVE'
}

export enum RiskLevel {
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
  NONE = 'NONE'
}

export enum InstructorStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  ON_LEAVE = 'ON_LEAVE'
}

export enum VerificationType {
  RFID = 'RFID',
  MANUAL = 'MANUAL',
  BIOMETRIC = 'BIOMETRIC'
} 