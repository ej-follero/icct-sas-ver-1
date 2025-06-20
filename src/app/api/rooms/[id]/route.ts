import { NextResponse } from "next/server";
import { z } from "zod";

// Define the room schema
const roomSchema = z.object({
  roomId: z.number(),
  roomNo: z.string().min(1, "Room number is required"),
  roomType: z.enum(["CLASSROOM", "LABORATORY", "OFFICE", "CONFERENCE"]),
  roomCapacity: z.number().min(1, "Room capacity must be at least 1"),
  roomBuildingLoc: z.string().min(1, "Building location is required"),
  roomFloorLoc: z.string().min(1, "Floor location is required"),
  readerId: z.string().min(1, "RFID reader ID is required"),
});

// Initial rooms data (same as in route.ts)
const initialRooms = [
  {
    roomId: 1,
    roomNo: "101",
    roomType: "CLASSROOM",
    roomCapacity: 40,
    roomBuildingLoc: "Main Building",
    roomFloorLoc: "1st Floor",
    readerId: "RFID001",
  },
  {
    roomId: 2,
    roomNo: "202",
    roomType: "LABORATORY",
    roomCapacity: 30,
    roomBuildingLoc: "Science Wing",
    roomFloorLoc: "2nd Floor",
    readerId: "RFID002",
  },
];

// GET handler
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const room = initialRooms.find(r => r.roomId === parseInt(params.id));
    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }
    return NextResponse.json(room);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch room" }, { status: 500 });
  }
}

// PUT handler
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const validatedData = roomSchema.parse(body);
    
    const roomIndex = initialRooms.findIndex(r => r.roomId === parseInt(params.id));
    if (roomIndex === -1) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }
    
    const updatedRoom = {
      ...validatedData,
      roomId: parseInt(params.id),
    };
    
    return NextResponse.json(updatedRoom);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to update room" }, { status: 500 });
  }
}

// DELETE handler
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const roomIndex = initialRooms.findIndex(r => r.roomId === parseInt(params.id));
    if (roomIndex === -1) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }
    
    return NextResponse.json({ message: "Room deleted successfully" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete room" }, { status: 500 });
  }
} 
 
 