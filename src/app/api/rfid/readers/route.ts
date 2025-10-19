import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createNotification } from '@/lib/notifications';

// GET /api/rfid/readers
// Returns list of active RFID readers with room information
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 [RFID READERS] Starting fetch request');
    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('includeInactive') === 'true';

    const whereClause: any = {};
    if (!includeInactive) {
      whereClause.status = 'ACTIVE';
    }

    console.log('🔍 [RFID READERS] Where clause:', whereClause);

    // First, let's try a simple query without room include
    const readers = await prisma.rFIDReader.findMany({
      where: whereClause,
      orderBy: [
        { deviceId: 'asc' }
      ]
    });
    
    console.log('✅ [RFID READERS] Basic query successful, found', readers.length, 'readers');
    
    // Now try to include room data
    const readersWithRooms = await prisma.rFIDReader.findMany({
      where: whereClause,
      include: {
        room: {
          select: {
            roomId: true,
            roomNo: true,
            roomType: true,
            roomBuildingLoc: true,
            roomFloorLoc: true,
            status: true
          }
        }
      },
      orderBy: [
        { deviceId: 'asc' }
      ]
    });
    
    console.log('✅ [RFID READERS] Query with rooms successful, found', readersWithRooms.length, 'readers');

    // Group readers by building for better organization
    const readersByBuilding = readersWithRooms.reduce((acc, reader) => {
      const building = reader.room?.roomBuildingLoc || 'Unassigned';
      if (!acc[building]) {
        acc[building] = [];
      }
      acc[building].push({
        readerId: reader.readerId,
        deviceId: reader.deviceId,
        deviceName: reader.deviceName,
        status: reader.status,
        lastSeen: reader.lastSeen,
        room: reader.room
      });
      return acc;
    }, {} as Record<string, any[]>);

    // Get building statistics
    const buildingStats = await prisma.rFIDReader.groupBy({
      by: ['status'],
      _count: {
        readerId: true
      }
    });

    return NextResponse.json({
      success: true,
      data: readersWithRooms,
      total: readersWithRooms.length,
      readersByBuilding,
      buildingStats: buildingStats.reduce((acc, stat) => {
        acc[stat.status] = stat._count.readerId;
        return acc;
      }, {} as Record<string, number>)
    });

  } catch (e: any) {
    console.error('RFID readers fetch error:', e);
    return NextResponse.json({ 
      error: e?.message || 'Failed to fetch RFID readers' 
    }, { status: 500 });
  }
}

// POST /api/rfid/readers
// Creates a new RFID reader
export async function POST(request: NextRequest) {
  // Hoisted so they are available in error handlers
  let userId: number | null = null;
  let body: any = null;
  try {
    console.log('🔍 [RFID READERS] Starting create request');

    // Auth: admin-only
    const token = request.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    userId = Number((decoded as any)?.userId);
    if (!Number.isFinite(userId)) return NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 });
    const user = await prisma.user.findUnique({ where: { userId: userId! }, select: { role: true, status: true } });
    if (!user || user.status !== 'ACTIVE') return NextResponse.json({ error: 'User not found or inactive' }, { status: 404 });
    if (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN') return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });

    body = await request.json();
    console.log('📝 [RFID READERS] Request body:', body);

    // Validate required fields
    if (!body.deviceId || !body.roomId) {
      return NextResponse.json({ 
        error: 'Device ID and Room ID are required' 
      }, { status: 400 });
    }

    // Validate room exists
    const room = await prisma.room.findUnique({
      where: { roomId: Number(body.roomId) }
    });
    if (!room) {
      return NextResponse.json({ 
        error: `Room with ID ${body.roomId} not found` 
      }, { status: 400 });
    }

    // Check if device ID already exists
    const existingReader = await prisma.rFIDReader.findUnique({
      where: { deviceId: body.deviceId.trim() }
    });
    if (existingReader) {
      return NextResponse.json({ 
        error: 'Device ID already exists. Please use a unique device ID.' 
      }, { status: 400 });
    }

    // Validate status if provided
    if (body.status) {
      const validStatuses = ["ACTIVE", "INACTIVE", "TESTING", "CALIBRATION", "REPAIR", "OFFLINE", "ERROR"];
      if (!validStatuses.includes(body.status)) {
        return NextResponse.json({ 
          error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` 
        }, { status: 400 });
      }
    }

    // Create the reader
    const newReader = await prisma.rFIDReader.create({
      data: {
        deviceId: body.deviceId.trim(),
        deviceName: body.deviceName?.trim() || null,
        ipAddress: body.ipAddress?.trim() || null,
        status: body.status || 'ACTIVE',
        roomId: Number(body.roomId),
        notes: body.notes?.trim() || null,
        components: body.components || {},
        lastSeen: new Date(),
      },
      include: {
        room: {
          select: {
            roomId: true,
            roomNo: true,
            roomType: true,
            roomBuildingLoc: true,
            roomFloorLoc: true,
            status: true
          }
        }
      }
    });

    console.log('✅ [RFID READERS] Reader created successfully:', newReader.readerId);

    // Notify creator (admin) that a reader was added
    try {
      await createNotification(userId, {
        title: 'RFID Reader added',
        message: `Device ${body.deviceId.trim()} assigned to room ${newReader.roomId}`,
        priority: 'NORMAL',
        type: 'RFID',
      });
    } catch (e) {
      console.warn('Notification create failed (reader create):', e);
    }

    return NextResponse.json({
      success: true,
      data: {
        readerId: newReader.readerId,
        deviceId: newReader.deviceId,
        deviceName: newReader.deviceName,
        status: newReader.status,
        ipAddress: newReader.ipAddress,
        lastSeen: newReader.lastSeen,
        roomId: newReader.roomId,
        notes: newReader.notes,
        room: newReader.room
      }
    });

  } catch (e: any) {
    console.error('RFID reader creation error:', e);
    
    // Handle specific Prisma errors
    if (e.code === 'P2002') {
      // Determine which unique constraint failed if possible
      const msg = String(e?.meta?.target || '').toLowerCase();
      if (msg.includes('roomid')) {
        // Optional: notify admin of conflict
        try {
          if (userId !== null) {
            await createNotification(userId as number, {
            title: 'Room assignment conflict',
              message: `Room ${body?.roomId ?? ''} already has a reader assigned.`,
            priority: 'NORMAL',
            type: 'RFID',
            });
          }
        } catch {}
        return NextResponse.json({ 
          error: 'Room already has a reader assigned. Please choose a different room.'
        }, { status: 409 });
      }
      return NextResponse.json({ 
        error: 'Device ID already exists. Please use a unique device ID.' 
      }, { status: 400 });
    }
    if (e.code === 'P2003') {
      return NextResponse.json({ 
        error: "Invalid room reference. Please ensure the room exists." 
      }, { status: 400 });
    }
    
    return NextResponse.json({ 
      error: e?.message || 'Failed to create RFID reader' 
    }, { status: 500 });
  }
}