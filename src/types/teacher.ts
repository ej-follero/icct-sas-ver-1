import { UserGender, InstructorType, Status } from "./enums";

export interface Teacher {
  instructorId: number;
  email: string;
  phoneNumber: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  suffix?: string;
  img?: string;
  gender: UserGender;
  instructorType: InstructorType;
  status: Status;
  departmentId: number;
  departmentName: string;
  rfidTag: string;
  rfidtagNumber: string;
  createdAt: Date;
  updatedAt: Date;
} 