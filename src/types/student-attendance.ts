export interface StudentAttendance {
  studentId: string;
  studentName: string;
  studentIdNum: string;
  department: string;
  course: string;
  courseCode: string;
  yearLevel: 'FIRST_YEAR' | 'SECOND_YEAR' | 'THIRD_YEAR' | 'FOURTH_YEAR';
  studentType: 'REGULAR' | 'IRREGULAR';
  email: string;
  phoneNumber: string;
  address: string;
  gender: 'MALE' | 'FEMALE';
  birthDate: Date | null;
  nationality: string;
  rfidTag: string;
  status: StudentStatus;
  guardianName: string;
  guardianEmail: string;
  guardianPhone: string;
  guardianType: 'PARENT' | 'GUARDIAN';
  schedules: StudentSchedule[];
  totalScheduledClasses: number;
  attendedClasses: number;
  absentClasses: number;
  lateClasses: number;
  excusedClasses: number;
  attendanceRate: number;
  punctualityScore: number;
  riskLevel: RiskLevel;
  currentStreak: number;
  consistencyRating: number;
  trend: number;
  weeklyPattern: WeeklyPattern;
  lastAttendance: Date;
  recentActivity: RecentActivity[];
  todaySchedule: TodaySchedule[];
  weeklyPerformance: WeeklyPerformance;
  attendanceRecords: AttendanceRecord[];
}

export interface StudentSchedule {
  scheduleId: string;
  subjectName: string;
  subjectCode: string;
  sectionName: string;
  roomNumber: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  instructor: string;
  attendanceHistory: AttendanceHistory[];
  attendanceRate: number;
}

export interface AttendanceHistory {
  date: Date;
  status: AttendanceStatus;
  checkInTime: Date;
  checkOutTime?: Date;
  duration?: number;
  verification: AttendanceVerification;
  notes?: string;
  location?: string;
}

export interface RecentActivity {
  day: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  time: string;
  subject: string;
  room: string;
  instructor: string;
}

export interface TodaySchedule {
  time: string;
  subject: string;
  room: string;
  instructor: string;
  status?: 'completed' | 'in-progress' | 'upcoming';
}

export interface WeeklyPerformance {
  presentDays: number;
  totalDays: number;
  onTimeRate: number;
  currentStreak: number;
}

export interface WeeklyPattern {
  monday: number;
  tuesday: number;
  wednesday: number;
  thursday: number;
  friday: number;
  saturday: number;
  sunday: number;
}

export interface AttendanceRecord {
  id: string;
  date: string;
  timeIn?: string;
  timeOut?: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
  subject: string;
  room: string;
  instructor: string;
  notes?: string;
  isManualEntry: boolean;
  createdAt: string;
  updatedAt: string;
}

export type RiskLevel = 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH';
export type StudentStatus = 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
export type AttendanceVerification = 'PENDING' | 'VERIFIED' | 'DISPUTED' | 'REJECTED';