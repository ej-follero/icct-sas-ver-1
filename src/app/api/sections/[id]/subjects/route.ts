import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/sections/[id]/subjects
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const sectionId = parseInt(params.id);
    
    // Fetch subjects for this section through SubjectSchedule
    const subjectSchedules = await prisma.subjectSchedule.findMany({
      where: { sectionId },
      include: {
        subject: {
          include: {
            CourseOffering: true,
            Department: true,
          },
        },
        instructor: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    // Map to frontend format
    const subjects = subjectSchedules.map(schedule => ({
      code: schedule.subject.subjectCode,
      name: schedule.subject.subjectName,
      units: schedule.subject.creditedUnits,
      type: schedule.subject.subjectType,
      status: schedule.subject.status,
      instructor: schedule.instructor ? 
        `${schedule.instructor.firstName} ${schedule.instructor.lastName}` : 
        'Not Assigned',
      day: schedule.day,
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      room: schedule.roomId,
    }));

    return NextResponse.json(subjects);
  } catch (error) {
    console.error("Error fetching subjects for section:", error);
    return NextResponse.json(
      { error: "Failed to fetch subjects for section" },
      { status: 500 }
    );
  }
} 