import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from '@/lib/prisma';

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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!Array.isArray(body)) {
      return NextResponse.json({ error: "Expected an array of rooms" }, { status: 400 });
    }
    let success = 0;
    let failed = 0;
    let errors: string[] = [];
    const createdRooms = [];
    for (let i = 0; i < body.length; i++) {
      try {
        const validated = roomSchema.parse({
          ...body[i],
          status: body[i].status || "AVAILABLE",
          isActive: typeof body[i].isActive === 'boolean' ? body[i].isActive : true,
        });
        const created = await prisma.room.create({ data: validated });
        createdRooms.push(created);
        success++;
      } catch (err: any) {
        failed++;
        if (err instanceof z.ZodError) {
          errors.push(`Row ${i + 1}: ${err.errors.map(e => e.message).join(", ")}`);
        } else {
          errors.push(`Row ${i + 1}: ${err.message || 'Unknown error'}`);
        }
      }
    }
    return NextResponse.json({ success, failed, errors, createdRooms });
  } catch (error) {
    return NextResponse.json({ error: "Failed to import rooms" }, { status: 500 });
  }
} 