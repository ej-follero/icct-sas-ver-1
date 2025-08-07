import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/sections
export async function GET() {
  try {
    // Fetch all sections with related CourseOffering and counts
    const sections = await prisma.section.findMany({
      include: {
        Course: true, // CourseOffering relation
        StudentSection: true, // For counting students
        SubjectSchedule: true, // For counting subjects
      },
    });

    // Map to backend keys for frontend compatibility
    const mapped = sections.map((section) => ({
      sectionId: section.sectionId,
      sectionName: section.sectionName,
      sectionCapacity: section.sectionCapacity,
      sectionStatus: section.sectionStatus,
      yearLevel: section.yearLevel,
      courseId: section.courseId,
      courseName: section.Course?.courseName || '',
      totalStudents: section.StudentSection.length,
      totalSubjects: section.SubjectSchedule.length,
      scheduleNotes: section.scheduleNotes || '',
      academicYear: section.academicYear || '',
      semester: section.semester || '',
      currentEnrollment: section.currentEnrollment,
      roomAssignment: section.roomAssignment || '',
    }));

    return NextResponse.json(mapped);
  } catch (error) {
    console.error("Error fetching sections:", error);
    return NextResponse.json(
      { error: "Failed to fetch sections" },
      { status: 500 }
    );
  }
}

// POST /api/sections
export async function POST(request: Request) {
  try {
    const data = await request.json();
    // Create the section in the database
    const created = await prisma.section.create({
      data: {
        sectionName: data.sectionName,
        sectionCapacity: data.sectionCapacity,
        sectionStatus: data.sectionStatus,
        yearLevel: data.yearLevel,
        academicYear: data.academicYear,
        semester: data.semester,
        currentEnrollment: data.currentEnrollment ?? 0,
        roomAssignment: data.roomAssignment ?? null,
        scheduleNotes: data.scheduleNotes ?? null,
        courseId: Number(data.courseId),
        semesterId: Number(data.semesterId),
      },
      include: {
        Course: true,
        StudentSection: true,
        SubjectSchedule: true,
      },
    });
    // Map to backend keys for frontend compatibility
    const mapped = {
      sectionId: created.sectionId,
      sectionName: created.sectionName,
      sectionCapacity: created.sectionCapacity,
      sectionStatus: created.sectionStatus,
      yearLevel: created.yearLevel,
      courseId: created.courseId,
      courseName: created.Course?.courseName || '',
      totalStudents: created.StudentSection.length,
      totalSubjects: created.SubjectSchedule.length,
      scheduleNotes: created.scheduleNotes || '',
      academicYear: created.academicYear || '',
      semester: created.semester || '',
      currentEnrollment: created.currentEnrollment,
      roomAssignment: created.roomAssignment || '',
    };
    return NextResponse.json(mapped, { status: 201 });
  } catch (error) {
    console.error("Error creating section:", error);
    return NextResponse.json(
      { error: "Failed to create section" },
      { status: 500 }
    );
  }
} 