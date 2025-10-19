import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from '@/lib/prisma';
import { createNotification } from '@/lib/notifications';

const roomSchema = z.object({
  roomNo: z.string().min(1, "Room number is required"),
  roomType: z.enum(["LECTURE", "LABORATORY", "OFFICE", "CONFERENCE", "OTHER"]),
  roomCapacity: z.number().min(1, "Room capacity must be at least 1"),
  roomBuildingLoc: z.enum(["BuildingA", "BuildingB", "BuildingC", "BuildingD", "BuildingE"]),
  roomFloorLoc: z.enum(["F1", "F2", "F3", "F4", "F5", "F6"]),
  readerId: z.string().optional(),
  status: z.enum(["AVAILABLE", "OCCUPIED", "MAINTENANCE", "RESERVED", "INACTIVE"]).optional(),
  isActive: z.boolean().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // JWT Authentication - Admin only
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
        const data = {
          ...validated,
          readerId: validated.readerId ?? `${validated.roomNo}-${Date.now()}`,
        } as any;
        const created = await prisma.room.create({ data });
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
    try {
      await createNotification(userId, {
        title: 'Import completed',
        message: `Rooms import: ${success} success, ${failed} failed`,
        priority: failed > 0 ? 'NORMAL' : 'NORMAL',
        type: 'DATA',
      });
    } catch {}
    return NextResponse.json({ success, failed, errors, createdRooms });
  } catch (error) {
    return NextResponse.json({ error: "Failed to import rooms" }, { status: 500 });
  }
} 