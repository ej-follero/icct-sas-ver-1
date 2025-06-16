import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const tags = await prisma.rFIDTags.findMany({
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
    return NextResponse.json(tags);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch RFID tags" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const tag = await prisma.rFIDTags.create({
      data: {
        tagNumber: data.tagNumber,
        tagType: data.tagType,
        status: data.status,
        notes: data.notes,
        assignedAt: new Date(),
      },
    });
    return NextResponse.json(tag);
  } catch (error) {
    return NextResponse.json({ error: "Failed to create RFID tag" }, { status: 500 });
  }
} 