import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const rooms = await prisma.room.findMany({
      orderBy: {
        roomNo: "asc",
      },
    });
    return NextResponse.json(rooms);
  } catch (error) {
    console.error("Error fetching rooms:", error);
    return NextResponse.json(
      { error: "Failed to fetch rooms" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const room = await prisma.room.create({
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
    console.error("Error creating room:", error);
    return NextResponse.json(
      { error: "Failed to create room" },
      { status: 500 }
    );
  }
} 
 
 