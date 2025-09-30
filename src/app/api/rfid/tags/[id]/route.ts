import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const tag = await prisma.rFIDTags.findUnique({
      where: { tagId: parseInt(params.id) },
    });
    if (!tag) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(tag);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch RFID tag" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json();
    
    // Validate required fields
    if (!data.tagNumber) {
      return NextResponse.json({ error: "Tag number is required" }, { status: 400 });
    }
    
    if (!data.tagType) {
      return NextResponse.json({ error: "Tag type is required" }, { status: 400 });
    }
    
    if (!data.status) {
      return NextResponse.json({ error: "Status is required" }, { status: 400 });
    }

    // Validate foreign key references if provided
    let studentId = null;
    if (data.studentId) {
      const student = await prisma.student.findUnique({
        where: { studentId: data.studentId }
      });
      if (!student) {
        return NextResponse.json({ error: `Student with ID ${data.studentId} not found` }, { status: 400 });
      }
      studentId = data.studentId;
    }

    let instructorId = null;
    if (data.instructorId) {
      const instructor = await prisma.instructor.findUnique({
        where: { instructorId: data.instructorId }
      });
      if (!instructor) {
        return NextResponse.json({ error: `Instructor with ID ${data.instructorId} not found` }, { status: 400 });
      }
      instructorId = data.instructorId;
    }

    let assignedBy = null;
    if (data.assignedBy) {
      const user = await prisma.user.findUnique({
        where: { userId: data.assignedBy }
      });
      if (!user) {
        return NextResponse.json({ error: `User with ID ${data.assignedBy} not found` }, { status: 400 });
      }
      assignedBy = data.assignedBy;
    }

    const tag = await prisma.rFIDTags.update({
      where: { tagId: parseInt(params.id) },
      data: {
        tagNumber: data.tagNumber,
        tagType: data.tagType,
        status: data.status,
        notes: data.notes || null,
        studentId,
        instructorId,
        assignedBy,
        assignmentReason: data.assignmentReason || null,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      },
      include: {
        student: {
          select: {
            studentId: true,
            firstName: true,
            lastName: true,
            studentIdNum: true,
          },
        },
        instructor: {
          select: {
            instructorId: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
    
    return NextResponse.json(tag);
  } catch (error: any) {
    console.error('Error updating RFID tag:', error);
    
    // Handle specific database errors
    if (error.code === 'P2002') {
      return NextResponse.json({ error: "Tag number already exists" }, { status: 400 });
    }
    
    if (error.code === 'P2003') {
      return NextResponse.json({ error: "Foreign key constraint violation" }, { status: 400 });
    }
    
    return NextResponse.json({ error: "Failed to update RFID tag" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.rFIDTags.delete({
      where: { tagId: parseInt(params.id) },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete RFID tag" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json();
    let updateData: any = {};
    if (data.unassign) {
      updateData.studentId = null;
      updateData.instructorId = null;
    } else if (data.studentId) {
      updateData.studentId = data.studentId;
      updateData.instructorId = null;
    } else if (data.instructorId) {
      updateData.instructorId = data.instructorId;
      updateData.studentId = null;
    } else {
      return NextResponse.json({ error: "Missing assignment data" }, { status: 400 });
    }
    const tag = await prisma.rFIDTags.update({
      where: { tagId: parseInt(params.id) },
      data: updateData,
      include: {
        student: {
          select: {
            studentId: true,
            firstName: true,
            lastName: true,
            studentIdNum: true,
          },
        },
        instructor: {
          select: {
            instructorId: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
    return NextResponse.json(tag);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update assignment" }, { status: 500 });
  }
} 