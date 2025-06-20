import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { SubjectType } from "@prisma/client";

// Subject schema for validation
const subjectSchema = z.object({
  name: z.string().min(1, "Name is required"),
  code: z.string().min(1, "Code is required"),
  type: z.enum(["lecture", "laboratory", "both"]),
  units: z.number().min(0),
  lecture_units: z.number().min(0),
  laboratory_units: z.number().min(0),
  semester: z.string(),
  year_level: z.string(),
  department: z.string(),
  description: z.string().optional(),
  instructors: z.array(z.string()),
});

// GET handler
export async function GET() {
  try {
    const subjects = await prisma.subjects.findMany();
    return NextResponse.json(subjects);
  } catch (error) {
    console.error("Error fetching subjects:", error);
    return NextResponse.json(
      { error: "Failed to fetch subjects" },
      { status: 500 }
    );
  }
}

// POST handler
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validatedData = subjectSchema.parse(body);

    // Placeholder values for required fields - replace with real logic as needed
    const courseId = 1; // TODO: Get from validatedData or request
    const departmentId = 1; // TODO: Get from validatedData or request
    const academicYear = "2024-2025"; // TODO: Get from validatedData or request
    const semester = "FIRST_SEMESTER"; // TODO: Map from validatedData or request

    const newSubject = await prisma.subjects.create({
      data: {
        subjectName: validatedData.name,
        subjectCode: validatedData.code,
        subjectType: SubjectType[validatedData.type.toUpperCase() as keyof typeof SubjectType],
        status: "ACTIVE", // Or map from validatedData if provided
        description: validatedData.description || "",
        lectureUnits: validatedData.lecture_units,
        labUnits: validatedData.laboratory_units,
        creditedUnits: validatedData.units,
        totalHours: 0, // Set as needed or calculate
        prerequisites: "", // Or validatedData.prerequisites?.join(',')
        courseId,
        departmentId,
        academicYear,
        semester,
        maxStudents: 30,
        currentEnrollment: 0,
      },
    });

    return NextResponse.json(newSubject, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid subject data", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error creating subject:", error);
    return NextResponse.json(
      { error: "Failed to create subject" },
      { status: 500 }
    );
  }
}