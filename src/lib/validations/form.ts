import { z } from "zod";
import {
  UserGender,
  UserStatus,
  BloodType,
  StudentType,
  YearLevel,
} from "@/types/form";

// Common validation rules
const commonRules = {
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phoneNumber: z.string().min(1, "Phone number is required"),
  address: z.string().min(1, "Address is required"),
  gender: z.nativeEnum(UserGender, {
    required_error: "Gender is required",
  }),
  status: z.nativeEnum(UserStatus, {
    required_error: "Status is required",
  }),
  img: z.any().optional(),
};

// Student form schema
export const studentSchema = z.object({
  ...commonRules,
  studentIdNum: z.string().min(1, "Student ID Number is required"),
  rfidTag: z.string().min(1, "RFID Tag is required"),
  middleName: z.string().optional(),
  suffix: z.string().optional(),
  studentType: z.nativeEnum(StudentType, {
    required_error: "Student type is required",
  }),
  yearLevel: z.nativeEnum(YearLevel, {
    required_error: "Year level is required",
  }),
  guardianId: z.number().min(1, "Guardian is required"),
});

// Teacher form schema
export const teacherSchema = z.object({
  ...commonRules,
  username: z.string().min(1, "Username is required"),
  password: z.string().min(6, "Password must be at least 6 characters").optional(),
  bloodType: z.nativeEnum(BloodType, {
    required_error: "Blood type is required",
  }),
  birthday: z.string().min(1, "Birthday is required"),
});

// Guardian form schema
export const guardianSchema = z.object({
  ...commonRules,
  username: z.string().min(1, "Username is required"),
  password: z.string().min(6, "Password must be at least 6 characters").optional(),
  relationship: z.string().min(1, "Relationship is required"),
}); 