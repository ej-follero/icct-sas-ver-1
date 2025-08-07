import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from '@/lib/prisma';

// Define the room schema
const roomSchema = z.object({
  roomNo: z.string().min(1, "Room number is required"),
  roomType: z.enum(["LECTURE", "LABORATORY", "OFFICE", "CONFERENCE", "OTHER"]),
  roomCapacity: z.number().min(1, "Room capacity must be at least 1"),
  roomBuildingLoc: z.enum(["BuildingA", "BuildingB", "BuildingC", "BuildingD", "BuildingE"]),
  roomFloorLoc: z.enum(["F1", "F2", "F3", "F4", "F5", "F6"]),
  readerId: z.string().min(1, "RFID reader ID is required"),
  status: z.enum(["AVAILABLE", "OCCUPIED", "MAINTENANCE", "RESERVED", "INACTIVE"]).optional(),
  isActive: z.boolean().optional(),
});

// Define a Room type for the raw query result
interface Room {
  roomId: number;
  roomNo: string;
  roomType: string;
  roomCapacity: number;
  roomBuildingLoc: string;
  roomFloorLoc: string;
  readerId: string;
  status: string;
  isActive: boolean;
  lastMaintenance: Date | null;
  nextMaintenance: Date | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// GET handler
export async function GET() {
  try {
    // Use raw SQL to fetch enum fields as strings
    const rooms = await prisma.$queryRaw<Room[]>`SELECT "roomId", "roomNo", "roomType"::text as "roomType", "roomCapacity", "roomBuildingLoc"::text as "roomBuildingLoc", "roomFloorLoc"::text as "roomFloorLoc", "readerId", "status"::text as "status", "isActive", "lastMaintenance", "nextMaintenance", "notes", "createdAt", "updatedAt" FROM "Room"`;
    // Fetch SubjectSchedule for all rooms
    const schedules = await prisma.subjectSchedule.findMany({
      select: {
        subjectSchedId: true,
        roomId: true,
        day: true,
        startTime: true,
        endTime: true,
        subject: { select: { subjectName: true } },
        instructor: { select: { firstName: true, lastName: true } },
        section: { select: { sectionName: true } },
      }
    });
    // Attach schedules to rooms
    const roomsWithSchedules = (rooms as Room[]).map((room: Room) => ({
      ...room,
      SubjectSchedule: schedules.filter(s => s.roomId === room.roomId)
    }));
    return NextResponse.json(roomsWithSchedules);
  } catch (error) {
    console.error('Error in /api/rooms:', error);
    return NextResponse.json({ error: "Failed to fetch rooms" }, { status: 500 });
  }
}

// POST handler
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validatedData = roomSchema.parse({
      ...body,
      status: body.status || "AVAILABLE",
      isActive: typeof body.isActive === 'boolean' ? body.isActive : true,
    });
    const createdRoom = await prisma.room.create({
      data: validatedData,
    });
    return NextResponse.json(createdRoom, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create room" }, { status: 500 });
  }
} 
 
 