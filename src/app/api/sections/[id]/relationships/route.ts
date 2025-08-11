import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/sections/[id]/relationships
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const sectionId = parseInt(params.id);
    
    if (isNaN(sectionId)) {
      return NextResponse.json(
        { error: "Invalid section ID" },
        { status: 400 }
      );
    }

    // Check for related records
    const [
      studentCount,
      subjectCount,
      scheduleCount,
      attendanceCount
    ] = await Promise.all([
      // Check for enrolled students
      prisma.studentSection.count({
        where: { sectionId }
      }),
      // Check for assigned subjects
      prisma.subjectSchedule.count({
        where: { sectionId }
      }),
      // Check for schedules
      prisma.subjectSchedule.count({
        where: { sectionId }
      }),
      // Check for attendance records
      prisma.attendance.count({
        where: { sectionId }
      })
    ]);

    const relationships: string[] = [];
    let hasRelationships = false;

    if (studentCount > 0) {
      relationships.push(`${studentCount} enrolled student(s)`);
      hasRelationships = true;
    }

    if (subjectCount > 0) {
      relationships.push(`${subjectCount} assigned subject(s)`);
      hasRelationships = true;
    }

    if (scheduleCount > 0) {
      relationships.push(`${scheduleCount} schedule(s)`);
      hasRelationships = true;
    }

    if (attendanceCount > 0) {
      relationships.push(`${attendanceCount} attendance record(s)`);
      hasRelationships = true;
    }

    return NextResponse.json({
      hasRelationships,
      relationships,
      counts: {
        students: studentCount,
        subjects: subjectCount,
        schedules: scheduleCount,
        attendance: attendanceCount
      }
    });
  } catch (error) {
    console.error("Error checking section relationships:", error);
    return NextResponse.json(
      { error: "Failed to check section relationships" },
      { status: 500 }
    );
  }
}
