import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET individual schedule
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const scheduleId = parseInt(params.id);
    
    if (isNaN(scheduleId)) {
      return NextResponse.json({ error: 'Invalid schedule ID' }, { status: 400 });
    }

    const schedule = await prisma.subjectSchedule.findUnique({
      where: { subjectSchedId: scheduleId },
      include: {
        subject: true,
        section: true,
        instructor: true,
        room: true,
        semester: true,
      },
    });

    if (!schedule) {
      return NextResponse.json({ error: 'Schedule not found' }, { status: 404 });
    }

    return NextResponse.json(schedule);
  } catch (error) {
    console.error('Error fetching schedule:', error);
    return NextResponse.json({ error: 'Failed to fetch schedule' }, { status: 500 });
  }
}

// PUT update schedule
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const scheduleId = parseInt(params.id);
    
    if (isNaN(scheduleId)) {
      return NextResponse.json({ error: 'Invalid schedule ID' }, { status: 400 });
    }

    const body = await request.json();
    const {
      subjectId,
      sectionId,
      instructorId,
      roomId,
      day,
      startTime,
      endTime,
      scheduleType,
      status,
      maxStudents,
      semesterId,
      academicYear,
      notes
    } = body;

    // Validate required fields
    if (!subjectId || !sectionId || !instructorId || !roomId || !day || !startTime || !endTime) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if schedule exists
    const existingSchedule = await prisma.subjectSchedule.findUnique({
      where: { subjectSchedId: scheduleId }
    });

    if (!existingSchedule) {
      return NextResponse.json({ error: 'Schedule not found' }, { status: 404 });
    }

    // Update the schedule
    const updatedSchedule = await prisma.subjectSchedule.update({
      where: { subjectSchedId: scheduleId },
      data: {
        subjectId: parseInt(subjectId),
        sectionId: parseInt(sectionId),
        instructorId: parseInt(instructorId),
        roomId: parseInt(roomId),
        day: day,
        startTime: startTime,
        endTime: endTime,
        scheduleType: scheduleType || 'REGULAR',
        status: status || 'ACTIVE',
        maxStudents: parseInt(maxStudents) || 30,
        semesterId: semesterId ? parseInt(semesterId) : undefined,
        academicYear: academicYear || undefined,
        notes: notes || null,
      },
      include: {
        subject: true,
        section: true,
        instructor: true,
        room: true,
        semester: true,
      },
    });

    return NextResponse.json(updatedSchedule);
  } catch (error) {
    console.error('Error updating schedule:', error);
    return NextResponse.json({ error: 'Failed to update schedule' }, { status: 500 });
  }
}

// DELETE schedule
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const scheduleId = parseInt(params.id);
    
    if (isNaN(scheduleId)) {
      return NextResponse.json({ error: 'Invalid schedule ID' }, { status: 400 });
    }

    // Check if schedule exists
    const existingSchedule = await prisma.subjectSchedule.findUnique({
      where: { subjectSchedId: scheduleId }
    });

    if (!existingSchedule) {
      return NextResponse.json({ error: 'Schedule not found' }, { status: 404 });
    }

    // Delete the schedule
    await prisma.subjectSchedule.delete({
      where: { subjectSchedId: scheduleId }
    });

    return NextResponse.json({ message: 'Schedule deleted successfully' });
  } catch (error) {
    console.error('Error deleting schedule:', error);
    return NextResponse.json({ error: 'Failed to delete schedule' }, { status: 500 });
  }
}
