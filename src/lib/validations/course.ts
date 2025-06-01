import { z } from "zod";

export const courseSchema = z.object({
  name: z.string().min(1, "Course name is required"),
  code: z.string().min(1, "Course code is required"),
  department: z.string().min(1, "Department is required"),
  description: z.string().optional(),
  units: z.number().min(1, "Units must be at least 1"),
  status: z.enum(["active", "inactive"]),
});

export type Course = z.infer<typeof courseSchema>; 