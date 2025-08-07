import { UserGender, StudentType, YearLevel, UserStatus } from './enums';

// Attendance related enums
export enum AttendanceStatus {
  PRESENT = 'PRESENT',
  ABSENT = 'ABSENT',
  LATE = 'LATE',
  EXCUSED = 'EXCUSED'
}

export enum AttendanceType {
  REGULAR = 'REGULAR',
  MAKEUP = 'MAKEUP',
  SPECIAL = 'SPECIAL'
}

export enum AttendanceVerification {
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED'
}

export enum EnrollmentStatus {
  ENROLLED = 'ENROLLED',
  DROPPED = 'DROPPED',
  WITHDRAWN = 'WITHDRAWN',
  GRADUATED = 'GRADUATED'
}

export enum RiskLevel {
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
  NONE = 'none'
}

// Subject attendance record interface
export interface SubjectAttendanceRecord {
  attendanceRate: number;
  totalSessions: number;
  presentCount: number;
  lateCount: number;
  absentCount: number;
}

// Guardian information interface
export interface GuardianInfo {
  name: string;
  email: string;
  phone: string;
  relationship: string;
}

// Section information interface
export interface SectionInfo {
  sectionName: string;
  sectionCode: string;
  instructor?: {
    name: string;
    email: string;
  };
  enrollmentDate?: string;
  sectionStatus?: string;
}

// Risk factors interface
export interface RiskFactors {
  attendanceRate: number;
  recentAbsences: number;
  trend: number;
  consecutiveAbsences: number;
}

// Subject enrollment interface
export interface SubjectEnrollment {
  subjectName: string;
  subjectCode: string;
  instructor: string;
  room: string;
  schedule: {
    dayOfWeek: string;
    startTime: string;
    endTime: string;
  };
  enrollmentDate: string;
  status: string;
}

// Academic information interface
export interface AcademicInfo {
  totalSubjects: number;
  currentEnrollment: number;
  sectionName?: string;
  sectionCode?: string;
  instructor?: string;
}

// Attendance statistics interface
export interface AttendanceStats {
  presentPercentage: number;
  latePercentage: number;
  absentPercentage: number;
  excusedPercentage: number;
}

// Recent attendance record interface
export interface RecentAttendanceRecord {
  attendanceId: number;
  timestamp: string;
  status: AttendanceStatus;
  attendanceType: AttendanceType;
  verification: AttendanceVerification;
  checkOutTime?: string;
  duration?: number;
  location?: string;
  notes?: string;
}

// Enhanced student attendance interface
export interface StudentAttendance {
  // Basic identifiers
  id: string;
  studentName: string;
  studentId: string; // Maps to studentIdNum in schema
  studentIdNumber: string; // Maps to studentId (auto-increment)
  
  // Personal information
  firstName: string;
  lastName: string;
  middleName?: string;
  suffix?: string;
  email: string;
  phoneNumber: string;
  address?: string;
  avatarUrl?: string;
  
  // Academic information
  department: string; // Maps to Department relation
  course: string; // Maps to CourseOffering relation
  yearLevel: YearLevel | string; // Maps to yearLevel enum
  gender: UserGender | string; // Maps to UserGender enum
  status: UserStatus | string; // Maps to Status enum (ACTIVE, INACTIVE, etc.)
  studentType: StudentType | string; // Maps to StudentType enum
  enrollmentStatus?: EnrollmentStatus | string; // Maps to EnrollmentStatus enum
  
  // RFID and technical
  rfidTag?: string;
  userId?: number;
  courseId?: number;
  departmentId?: number;
  guardianId?: number;
  
  // Subjects and enrollment
  subjects: SubjectEnrollment[];
  
  // Attendance Statistics (calculated from Attendance records)
  presentDays: number;
  absentDays: number;
  lateDays: number;
  totalDays: number;
  attendanceRate: number;
  
  // Recent Attendance Record Data (from Attendance model)
  lastAttendance: string; // timestamp
  lastAttendanceStatus: AttendanceStatus;
  lastAttendanceType: AttendanceType;
  lastVerificationStatus: AttendanceVerification;
  lastCheckInTime?: string;
  lastCheckOutTime?: string;
  lastDuration?: number; // in minutes
  lastLocation?: string;
  lastDeviceInfo?: any;
  
  // Additional Fields
  trend?: number;
  subjectAttendance?: Record<string, SubjectAttendanceRecord>;

  riskLevel?: RiskLevel | string;
  riskFactors?: RiskFactors;
  sectionInfo?: SectionInfo;
  guardianInfo?: GuardianInfo;
  academicInfo?: AcademicInfo;
  attendanceStats?: AttendanceStats;
  recentAttendanceRecords?: RecentAttendanceRecord[];
  
  // Timestamps
  createdAt?: string;
  updatedAt?: string;
  lastLogin?: string;
}

// Props interface for components using student attendance data
export interface StudentDetailModalProps {
  student: StudentAttendance | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (studentId: string, updates: Partial<StudentAttendance>) => void;
  onSendNotification: (studentId: string, type: string, message: string) => void;
}

// Manual attendance override interface
export interface ManualAttendanceOverride {
  date: string;
  subject: string;
  status: AttendanceStatus | string;
  notes: string;
}

// Notification interface
export interface NotificationData {
  type: 'absence' | 'tardiness' | 'improvement' | 'concern';
  message: string;
  recipient: 'parent' | 'student' | 'both';
  method: 'email';
} 