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
    const tag = await prisma.rFIDTags.update({
      where: { tagId: parseInt(params.id) },
      data: {
        tagNumber: data.tagNumber,
        tagType: data.tagType,
        status: data.status,
        notes: data.notes,
      },
    });
    return NextResponse.json(tag);
  } catch (error) {
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