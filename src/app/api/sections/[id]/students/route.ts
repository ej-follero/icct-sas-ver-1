import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/sections/[id]/students
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const sectionId = parseInt(params.id);
    const studentSections = await prisma.studentSection.findMany({
      where: { sectionId },
      include: { Student: true }
    });
    const students = studentSections.map(ss => ({
      id: ss.Student.studentId,
      firstName: ss.Student.firstName,
      lastName: ss.Student.lastName,
      studentIdNumber: ss.Student.studentIdNum,
      yearLevel: ss.Student.yearLevel,
      status: ss.enrollmentStatus,
      email: ss.Student.email,
    }));
    return NextResponse.json(students);
  } catch (error) {
    console.error("Error fetching students for section:", error);
    return NextResponse.json(
      { error: "Failed to fetch students for section" },
      { status: 500 }
    );
  }
} 