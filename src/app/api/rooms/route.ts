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

// Initial rooms data
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
export async function GET() {
  try {
    return NextResponse.json(initialRooms);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch rooms" }, { status: 500 });
  }
}

// POST handler
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validatedData = roomSchema.parse(body);
    
    // Generate a new room ID (in a real app, this would come from the database)
    const newRoom = {
      ...validatedData,
      roomId: initialRooms.length + 1,
    };
    
    return NextResponse.json(newRoom, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create room" }, { status: 500 });
  }
} 
 
 