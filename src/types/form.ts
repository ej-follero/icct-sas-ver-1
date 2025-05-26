// Common enums
export enum UserGender {
  MALE = "MALE",
  FEMALE = "FEMALE",
  OTHER = "OTHER"
}

export enum UserStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  SUSPENDED = "SUSPENDED"
}

export enum BloodType {
  A_POSITIVE = "A+",
  A_NEGATIVE = "A-",
  B_POSITIVE = "B+",
  B_NEGATIVE = "B-",
  AB_POSITIVE = "AB+",
  AB_NEGATIVE = "AB-",
  O_POSITIVE = "O+",
  O_NEGATIVE = "O-"
}

export enum StudentType {
  REGULAR = "REGULAR",
  IRREGULAR = "IRREGULAR",
  TRANSFEREE = "TRANSFEREE"
}

export enum YearLevel {
  FIRST_YEAR = "FIRST_YEAR",
  SECOND_YEAR = "SECOND_YEAR",
  THIRD_YEAR = "THIRD_YEAR",
  FOURTH_YEAR = "FOURTH_YEAR"
}

// Common interfaces
export interface BaseUserData {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  address: string;
  gender: UserGender;
  status: UserStatus;
  img?: string;
}

export interface StudentData extends BaseUserData {
  studentIdNum: string;
  rfidTag: string;
  middleName?: string;
  suffix?: string;
  studentType: StudentType;
  yearLevel: YearLevel;
  guardianId: number;
}

export interface TeacherData extends BaseUserData {
  username: string;
  password?: string;
  bloodType: BloodType;
  birthday: string;
}

export interface GuardianData extends BaseUserData {
  username: string;
  password?: string;
  relationship: string;
}

// Form props interface
export interface FormProps<T> {
  type: "create" | "update";
  data?: T;
  onSubmit: (data: T) => Promise<void>;
  isLoading?: boolean;
} 