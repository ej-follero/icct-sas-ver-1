import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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
    // Query params and filters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = parseInt(searchParams.get("pageSize") || "10", 10);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const room = searchParams.get("room") || "";
    const sortBy = searchParams.get("sortBy") || "deviceId";
    const sortDir = searchParams.get("sortDir") === "desc" ? "desc" : "asc";

    // Build where clause
    const where: any = {
      ...(search && {
        OR: [
          { deviceId: { contains: search, mode: "insensitive" as const } },
          { deviceName: { contains: search, mode: "insensitive" as const } },
        ],
      }),
      ...(status && status !== "all" && { status }),
      ...(room && room !== "all" && { roomId: Number(room) }),
    };

    // Get total count
    const total = await prisma.rFIDReader.count({ where });

    // Get paginated data
    const data = await prisma.rFIDReader.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { [sortBy]: sortDir },
    });

    return NextResponse.json({ data, total });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch RFID readers" }, { status: 500 });
  }
}

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

    const data = await request.json();
    
    // Validate required fields
    if (!data.deviceId || !data.roomId || !data.status) {
      return NextResponse.json({ 
        error: "Missing required fields: deviceId, roomId, and status are required" 
      }, { status: 400 });
    }

    // Validate room exists
    const room = await prisma.room.findUnique({
      where: { roomId: data.roomId }
    });
    if (!room) {
      return NextResponse.json({ 
        error: `Room with ID ${data.roomId} not found` 
      }, { status: 400 });
    }

    // Validate status enum
    const validStatuses = ["ACTIVE", "INACTIVE", "TESTING", "CALIBRATION", "REPAIR", "OFFLINE", "ERROR"];
    if (!validStatuses.includes(data.status)) {
      return NextResponse.json({ 
        error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` 
      }, { status: 400 });
    }

    const reader = await prisma.rFIDReader.create({
      data: {
        deviceId: data.deviceId.trim(),
        deviceName: data.deviceName?.trim() || null,
        roomId: data.roomId,
        ipAddress: data.ipAddress?.trim() || null,
        status: data.status,
        notes: data.notes?.trim() || null,
        components: {},
        assemblyDate: new Date(),
        lastSeen: new Date(),
      },
    });
    return NextResponse.json(reader);
  } catch (error: any) {
    console.error('Error creating RFID reader:', error);
    
    // Handle specific Prisma errors
    if (error.code === 'P2002') {
      return NextResponse.json({ 
        error: "Device ID already exists. Please use a unique device ID." 
      }, { status: 400 });
    }
    if (error.code === 'P2003') {
      return NextResponse.json({ 
        error: "Invalid room reference. Please ensure the room exists." 
      }, { status: 400 });
    }
    
    return NextResponse.json({ 
      error: error.message || "Failed to create RFID reader" 
    }, { status: 500 });
  }
} 