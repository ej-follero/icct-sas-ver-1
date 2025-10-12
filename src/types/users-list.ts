// Users List Types - Shared between users list page and UserForm
export type UserStatus = "active" | "inactive" | "suspended" | "pending";

export interface User {
  id: string;
  userName: string;
  email: string;
  role: string;
  status: UserStatus;
  fullName: string;
  lastLogin?: string;
  lastPasswordChange?: string;
  failedLoginAttempts: number;
  isEmailVerified: boolean;
  twoFactorEnabled: boolean;
  createdAt: string;
  updatedAt: string;
  sessionVersion: number;
  relatedInfo?: {
    studentIdNum?: string;
    guardian?: {
      name: string;
    };
  };
  statistics?: {
    totalAttendance: number;
    totalSystemLogs: number;
    totalReportLogs: number;
    totalRFIDLogs: number;
  };
}

export type SortField = 'userName' | 'email' | 'role' | 'status' | 'fullName' | 'studentIdNum' | 'createdAt';
export type SortOrder = 'asc' | 'desc';
export type UserSortField = 'userName' | 'email' | 'role' | 'status' | 'fullName' | 'studentIdNum' | 'createdAt';
export type UserSortOrder = 'asc' | 'desc'; 