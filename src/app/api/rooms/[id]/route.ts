import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from '@/lib/prisma';

const roomSchema = z.object({
  roomId: z.number(),
  roomNo: z.string().min(1, "Room number is required"),
  roomType: z.enum(["LECTURE", "LABORATORY", "OFFICE", "CONFERENCE", "OTHER"]),
  roomCapacity: z.number().min(1, "Room capacity must be at least 1"),
  roomBuildingLoc: z.enum(["BuildingA", "BuildingB", "BuildingC", "BuildingD", "BuildingE"]),
  roomFloorLoc: z.enum(["F1", "F2", "F3", "F4", "F5", "F6"]),
  readerId: z.string().min(1, "RFID reader ID is required"),
  status: z.enum(["AVAILABLE", "OCCUPIED", "MAINTENANCE", "RESERVED", "INACTIVE"]),
  isActive: z.boolean(),
});

// GET handler
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const room = await prisma.room.findUnique({
      where: { roomId: Number(params.id) },
      include: {
        SubjectSchedule: {
          include: {
            subject: { select: { subjectName: true } },
            instructor: { select: { firstName: true, lastName: true } },
            section: { select: { sectionName: true } },
          }
        }
      }
    });
    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }
    return NextResponse.json(room);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch room" }, { status: 500 });
  }
}

// PUT handler (update room)
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const validatedData = roomSchema.parse({ ...body, roomId: Number(params.id) });
    const { roomId, roomType, roomBuildingLoc, roomFloorLoc, ...rest } = validatedData;
    const updateData = {
      ...rest,
      roomType: roomType as any, // Prisma enum
      roomBuildingLoc: roomBuildingLoc as any, // Prisma enum
      roomFloorLoc: roomFloorLoc as any, // Prisma enum
    };
    const updatedRoom = await prisma.room.update({
      where: { roomId: Number(params.id) },
      data: updateData,
    });
    return NextResponse.json(updatedRoom);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to update room" }, { status: 500 });
  }
}

// DELETE handler
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    await prisma.room.delete({
      where: { roomId: Number(params.id) },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete room" }, { status: 500 });
  }
} 
 
 