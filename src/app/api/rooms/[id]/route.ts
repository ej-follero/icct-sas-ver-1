import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json();
    const room = await prisma.room.update({
      where: {
        roomId: parseInt(params.id),
      },
      data: {
        roomNo: data.roomNo,
        roomType: data.roomType,
        roomCapacity: data.roomCapacity,
        roomBuildingLoc: data.roomBuildingLoc,
        roomFloorLoc: data.roomFloorLoc,
        readerId: data.readerId,
      },
    });
    return NextResponse.json(room);
  } catch (error) {
    console.error("Error updating room:", error);
    return NextResponse.json(
      { error: "Failed to update room" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.room.delete({
      where: {
        roomId: parseInt(params.id),
      },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting room:", error);
    return NextResponse.json(
      { error: "Failed to delete room" },
      { status: 500 }
    );
  }
} 
 
 