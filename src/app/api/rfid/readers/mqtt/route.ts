import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { broadcastNewReader } from '@/lib/socket';

// POST /api/rfid/readers/mqtt
// Handle MQTT reader registration events
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { deviceId, deviceName, ipAddress, macAddress, firmwareVersion, location } = body;

    console.log('📡 MQTT Reader Registration:', { deviceId, deviceName, ipAddress });

    // Validate required fields
    if (!deviceId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Device ID is required' 
      }, { status: 400 });
    }

    // Check if reader already exists
    const existingReader = await prisma.rFIDReader.findUnique({
      where: { deviceId }
    });

    if (existingReader) {
      console.log('⚠️ Reader already exists:', deviceId);
      return NextResponse.json({ 
        success: false, 
        error: 'Reader with this Device ID already exists',
        existingReader: {
          readerId: existingReader.readerId,
          deviceId: existingReader.deviceId,
          deviceName: existingReader.deviceName,
          status: existingReader.status
        }
      }, { status: 409 });
    }

    // Find or create a default room for unassigned readers
    let defaultRoom = await prisma.room.findFirst({
      where: { roomNo: 'UNASSIGNED' }
    });

    if (!defaultRoom) {
      defaultRoom = await prisma.room.create({
        data: {
          roomNo: 'UNASSIGNED',
          roomType: 'LABORATORY',
          roomCapacity: 0,
          readerId: deviceId,
          status: 'MAINTENANCE',
          roomBuildingLoc: 'BuildingA',
          roomFloorLoc: 'F1',
          notes: 'Default room for unassigned RFID readers'
        }
      });
    }

    // Create new reader record with default room
    const newReader = await prisma.rFIDReader.create({
      data: {
        deviceId,
        deviceName: deviceName || `Reader ${deviceId}`,
        ipAddress: ipAddress || null,
        status: 'TESTING', // Start as testing until admin assigns room
        roomId: defaultRoom.roomId,
        components: {
          macAddress: macAddress || null,
          firmwareVersion: firmwareVersion || null,
          location: location || null,
          registeredAt: new Date().toISOString()
        },
        notes: `Auto-registered via MQTT at ${new Date().toLocaleString()}`
      }
    });

    // Broadcast to connected clients
    broadcastNewReader({
      readerId: newReader.readerId,
      deviceId: newReader.deviceId,
      deviceName: newReader.deviceName,
      ipAddress: newReader.ipAddress,
      status: newReader.status,
      components: newReader.components,
      needsRoomAssignment: true,
      timestamp: new Date().toISOString()
    });

    console.log('✅ New reader registered:', newReader.readerId);

    return NextResponse.json({
      success: true,
      message: 'Reader registered successfully',
      data: {
        readerId: newReader.readerId,
        deviceId: newReader.deviceId,
        deviceName: newReader.deviceName,
        status: newReader.status,
        needsRoomAssignment: true
      }
    });

  } catch (error: any) {
    console.error('❌ MQTT Reader Registration Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Failed to register reader' 
    }, { status: 500 });
  }
}

// GET /api/rfid/readers/mqtt
// Get readers that need room assignment
export async function GET(request: NextRequest) {
  try {
    // Find the default unassigned room
    const defaultRoom = await prisma.room.findFirst({
      where: { roomNo: 'UNASSIGNED' }
    });

    if (!defaultRoom) {
      return NextResponse.json({
        success: true,
        data: []
      });
    }

    const readersNeedingAssignment = await prisma.rFIDReader.findMany({
      where: {
        roomId: defaultRoom.roomId,
        status: 'TESTING'
      },
      select: {
        readerId: true,
        deviceId: true,
        deviceName: true,
        ipAddress: true,
        status: true,
        components: true,
        assemblyDate: true
      },
      orderBy: {
        assemblyDate: 'desc'
      }
    });

    return NextResponse.json({
      success: true,
      data: readersNeedingAssignment
    });

  } catch (error: any) {
    console.error('❌ Get unassigned readers error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Failed to get unassigned readers' 
    }, { status: 500 });
  }
}
