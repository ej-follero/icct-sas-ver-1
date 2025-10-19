import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from '@/lib/prisma';

// Define the room schema
const roomSchema = z.object({
  roomNo: z.string().min(1, "Room number is required"),
  roomType: z.enum(["LECTURE", "LABORATORY", "OFFICE", "CONFERENCE", "OTHER"]),
  roomCapacity: z.number().min(1, "Room capacity must be at least 1"),
  roomBuildingLoc: z.enum(["BuildingA", "BuildingB", "BuildingC", "BuildingD", "BuildingE"]),
  roomFloorLoc: z.enum(["F1", "F2", "F3", "F4", "F5", "F6"]),
  readerId: z.string().min(1, "Reader ID is required"),
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
export async function GET(request: NextRequest) {
  try {
    // JWT Authentication
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = Number((decoded as any)?.userId);
    if (!Number.isFinite(userId)) {
      return NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 });
    }

    // Check user exists and is active
    const user = await prisma.user.findUnique({
      where: { userId },
      select: { status: true, role: true }
    });

    if (!user || user.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'User not found or inactive' }, { status: 401 });
    }

    // Role-based access control
    const allowedRoles = ['SUPER_ADMIN', 'ADMIN', 'DEPARTMENT_HEAD', 'INSTRUCTOR'];
    if (!allowedRoles.includes(user.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Use standard Prisma query instead of raw SQL
    const rooms = await prisma.room.findMany({
      include: {
        SubjectSchedule: {
          include: {
            subject: { select: { subjectName: true } },
            instructor: { select: { firstName: true, lastName: true } },
            section: { select: { sectionName: true } },
          }
        }
      },
      orderBy: { roomNo: 'asc' }
    });

    return NextResponse.json(rooms);
  } catch (error) {
    console.error('Error in /api/rooms:', error);
    return NextResponse.json({ error: "Failed to fetch rooms" }, { status: 500 });
  }
}

// POST handler
export async function POST(request: NextRequest) {
  try {
    // JWT Authentication
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = Number((decoded as any)?.userId);
    if (!Number.isFinite(userId)) {
      return NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 });
    }

    // Check user exists and is active
    const user = await prisma.user.findUnique({
      where: { userId },
      select: { status: true, role: true }
    });

    if (!user || user.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'User not found or inactive' }, { status: 401 });
    }

    // Admin-only access control
    const adminRoles = ['SUPER_ADMIN', 'ADMIN'];
    if (!adminRoles.includes(user.role)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = roomSchema.parse({
      ...body,
      status: body.status || "AVAILABLE",
      isActive: typeof body.isActive === 'boolean' ? body.isActive : true,
    });
    const roomData = {
      roomNo: validatedData.roomNo,
      roomType: validatedData.roomType,
      roomCapacity: validatedData.roomCapacity,
      roomBuildingLoc: validatedData.roomBuildingLoc,
      roomFloorLoc: validatedData.roomFloorLoc,
      readerId: validatedData.readerId,
      status: (validatedData.status || "AVAILABLE") as "AVAILABLE" | "OCCUPIED" | "MAINTENANCE" | "RESERVED" | "INACTIVE",
      isActive: validatedData.isActive ?? true,
    } as const;

    const createdRoom = await prisma.room.create({
      data: {
        roomNo: validatedData.roomNo,
        roomType: validatedData.roomType,
        roomCapacity: validatedData.roomCapacity,
        roomBuildingLoc: validatedData.roomBuildingLoc,
        roomFloorLoc: validatedData.roomFloorLoc,
        readerId: validatedData.readerId,
        status: (validatedData.status || "AVAILABLE") as any,
        isActive: validatedData.isActive ?? true,
      },
    });
    return NextResponse.json(createdRoom, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create room" }, { status: 500 });
  }
} 
 
 