// User Management Types
export interface BaseUser {
  userId: number;
  userName: string;
  email: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'DEPARTMENT_HEAD' | 'TEACHER' | 'STUDENT' | 'SYSTEM_AUDITOR';
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'PENDING' | 'BLOCKED';
  lastLogin?: Date;
  lastPasswordChange?: Date;
  failedLoginAttempts: number;
  isEmailVerified: boolean;
  twoFactorEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface StudentUserProfile extends BaseUser {
  role: 'STUDENT';
  // Student Profile Data
  studentId: number;
  studentIdNum: string;
  rfidTag: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  suffix?: string;
  phoneNumber: string;
  address: string;
  img?: string;
  gender: 'MALE' | 'FEMALE';
  birthDate?: Date;
  nationality?: string;
  studentType: 'REGULAR' | 'IRREGULAR';
  yearLevel: 'FIRST_YEAR' | 'SECOND_YEAR' | 'THIRD_YEAR' | 'FOURTH_YEAR';
  courseId?: number;
  departmentId?: number;
  guardianId: number;
  
  // Related Data
  courseName?: string;
  departmentName?: string;
  guardianName?: string;
  guardianContact?: string;
  
  // Analytics
  totalSubjects: number;
  totalAttendance: number;
  attendanceRate?: number;
}

export interface InstructorUserProfile extends BaseUser {
  role: 'TEACHER';
  // Instructor Profile Data
  instructorId: number;
  firstName: string;
  middleName?: string;
  lastName: string;
  suffix?: string;
  phoneNumber: string;
  img?: string;
  gender: 'MALE' | 'FEMALE';
  instructorType: 'FULL_TIME' | 'PART_TIME';
  departmentId: number;
  officeLocation?: string;
  officeHours?: string;
  specialization?: string;
  rfidTag: string;
  
  // Related Data
  departmentName?: string;
  
  // Analytics
  totalSubjects: number;
  totalStudents: number;
}

// Filter and Management Types
export interface UserFilters {
  status: string[];
  roles: string[];
  verificationStatus: string[];
  loginActivity: string[];
  departments?: string[];
  createdDateRange?: DateRange;
}

export interface StudentUserFilters extends UserFilters {
  yearLevel: string[];
  course: string[];
  studentType: string[];
  guardianStatus?: string[];
}

export interface InstructorUserFilters extends UserFilters {
  instructorType: string[];
  specialization: string[];
}

export interface GuardianUserFilters extends UserFilters {
  guardianType: string[];
  studentCount: string[];
}

export interface DateRange {
  start: string;
  end: string;
}

// Bulk Action Types
export type BulkUserAction = 
  | 'activate'
  | 'deactivate' 
  | 'suspend'
  | 'block'
  | 'reset_password'
  | 'enable_2fa'
  | 'disable_2fa'
  | 'send_verification_email'
  | 'send_credentials'
  | 'export_data'
  | 'delete_accounts';

export interface BulkActionRequest {
  action: BulkUserAction;
  userIds: number[];
  options?: {
    notifyUsers?: boolean;
    reason?: string;
    temporaryPassword?: boolean;
    suspensionDuration?: number;
  };
}

// Security and Audit Types
export interface SecurityEvent {
  id: number;
  userId: number;
  userName: string;
  eventType: 'LOGIN' | 'LOGOUT' | 'PASSWORD_CHANGE' | 'FAILED_LOGIN' | 'ACCOUNT_LOCKED' | '2FA_ENABLED' | '2FA_DISABLED';
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
  location?: string;
  success: boolean;
  details?: string;
}

export interface UserAuditLog {
  id: number;
  userId: number;
  performedBy: number;
  action: string;
  tableName: string;
  recordId: number;
  oldValues?: any;
  newValues?: any;
  timestamp: Date;
  reason?: string;
}

// Import/Export Types
export interface UserImportRecord {
  userName: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'STUDENT' | 'TEACHER';
  // Role-specific fields would be added based on role
  studentIdNum?: string;
  courseId?: number;
  departmentId?: number;
  guardianId?: number;
  errors?: string[];
}

export interface UserExportOptions {
  includePersonalData: boolean;
  includeSecurityData: boolean;
  includeAuditLogs: boolean;
  dateRange?: DateRange;
  format: 'CSV' | 'EXCEL' | 'PDF';
}

// Permission and Role Types
export interface UserPermission {
  id: number;
  name: string;
  description: string;
  resource: string;
  actions: string[];
}

export interface UserRole {
  id: number;
  name: string;
  description: string;
  permissions: UserPermission[];
  isSystemRole: boolean;
}

// Notification Types
export interface UserNotification {
  id: number;
  userId: number;
  type: 'WELCOME' | 'PASSWORD_RESET' | 'ACCOUNT_SUSPENDED' | 'VERIFICATION_REQUIRED' | 'SECURITY_ALERT';
  title: string;
  message: string;
  isRead: boolean;
  sentAt: Date;
  expiresAt?: Date;
}

// Statistics and Analytics Types
export interface UserStatistics {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  suspendedUsers: number;
  pendingUsers: number;
  blockedUsers: number;
  verifiedUsers: number;
  unverifiedUsers: number;
  usersWithoutLogin: number;
  usersByRole: Record<string, number>;
  recentRegistrations: number;
  securityEvents: number;
}

export interface UserActivitySummary {
  userId: number;
  userName: string;
  lastLogin?: Date;
  loginCount: number;
  failedLoginAttempts: number;
  passwordAge: number; // days since last password change
  accountAge: number; // days since account creation
  securityScore: number; // 0-100 based on security factors
} 