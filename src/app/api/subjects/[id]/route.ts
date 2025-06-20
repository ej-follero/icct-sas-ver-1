import { NextResponse } from "next/server";
import { z } from "zod";
import { initialSubjects } from "../data";
import { prisma } from "@/lib/prisma";

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

// GET handler for individual subject
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // In a real application, you would fetch this from a database
    const subject = initialSubjects.find(s => s.id === params.id);
    
    if (!subject) {
      return NextResponse.json(
        { error: "Subject not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(subject);
  } catch (error) {
    console.error("Error fetching subject:", error);
    return NextResponse.json(
      { error: "Failed to fetch subject" },
      { status: 500 }
    );
  }
}

// PUT handler for updating a subject
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const validatedData = subjectSchema.parse(body);

    // In a real application, you would update this in a database
    const subjectIndex = initialSubjects.findIndex(s => s.id === params.id);
    
    if (subjectIndex === -1) {
      return NextResponse.json(
        { error: "Subject not found" },
        { status: 404 }
      );
    }

    const updatedSubject = {
      ...initialSubjects[subjectIndex],
      ...validatedData,
    };

    return NextResponse.json(updatedSubject);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid subject data", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error updating subject:", error);
    return NextResponse.json(
      { error: "Failed to update subject" },
      { status: 500 }
    );
  }
}

// DELETE handler for removing a subject
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const subjectId = parseInt(params.id);
    
    // Check for associated data
    const subject = await prisma.subjects.findUnique({
      where: { subjectId },
      include: {
        _count: {
          select: {
            SubjectSchedule: true,
            Announcement: true,
            Instructor: true
          }
        }
      }
    });

    if (!subject) {
      return NextResponse.json(
        { error: "Subject not found" },
        { status: 404 }
      );
    }

    // Check if subject has any associated data
    if (subject._count.SubjectSchedule > 0 || 
        subject._count.Announcement > 0 || 
        subject._count.Instructor > 0 ||
        subject.currentEnrollment > 0) {
      return NextResponse.json(
        { 
          error: "Cannot delete subject with associated data",
          details: {
            hasSchedules: subject._count.SubjectSchedule > 0,
            hasAnnouncements: subject._count.Announcement > 0,
            hasInstructors: subject._count.Instructor > 0,
            hasEnrolledStudents: subject.currentEnrollment > 0
          }
        },
        { status: 409 }
      );
    }

    // If no associated data, proceed with deletion
    await prisma.subjects.delete({
      where: { subjectId }
    });

    return NextResponse.json(
      { message: "Subject deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting subject:", error);
    return NextResponse.json(
      { error: "Failed to delete subject" },
      { status: 500 }
    );
  }
} 