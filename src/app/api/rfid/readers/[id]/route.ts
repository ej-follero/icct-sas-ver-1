import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createNotification } from '@/lib/notifications';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // Auth: allow SUPER_ADMIN, ADMIN, DEPARTMENT_HEAD, INSTRUCTOR
    const token = request.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = Number((decoded as any)?.userId);
    if (!Number.isFinite(userId)) return NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 });
    const user = await prisma.user.findUnique({ where: { userId }, select: { role: true, status: true } });
    if (!user || user.status !== 'ACTIVE') return NextResponse.json({ error: 'User not found or inactive' }, { status: 404 });
    const allowedRoles = ['SUPER_ADMIN', 'ADMIN', 'DEPARTMENT_HEAD', 'INSTRUCTOR'];
    if (!allowedRoles.includes(user.role)) return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });

    const reader = await prisma.rFIDReader.findUnique({
      where: { readerId: parseInt(id) },
    });
    if (!reader) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(reader);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch RFID reader" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // Auth: admin-only
    const token = request.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = Number((decoded as any)?.userId);
    if (!Number.isFinite(userId)) return NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 });
    const user = await prisma.user.findUnique({ where: { userId }, select: { role: true, status: true } });
    if (!user || user.status !== 'ACTIVE') return NextResponse.json({ error: 'User not found or inactive' }, { status: 404 });
    if (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN') return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });

    const body = await request.json().catch(() => ({}));
    const readerId = Number(id);
    if (isNaN(readerId)) return NextResponse.json({ error: 'Invalid reader id' }, { status: 400 });

    // Check if reader exists
    const existingReader = await prisma.rFIDReader.findUnique({
      where: { readerId }
    });
    if (!existingReader) {
      return NextResponse.json({ error: 'Reader not found' }, { status: 404 });
    }

    const data: any = {};
    
    // Validate and set fields
    if (body.deviceName !== undefined) data.deviceName = body.deviceName?.trim() || null;
    if (body.ipAddress !== undefined) data.ipAddress = body.ipAddress?.trim() || null;
    if (body.notes !== undefined) data.notes = body.notes?.trim() || null;
    
    if (body.status !== undefined) {
      const validStatuses = ["ACTIVE", "INACTIVE", "TESTING", "CALIBRATION", "REPAIR", "OFFLINE", "ERROR"];
      if (!validStatuses.includes(body.status)) {
        return NextResponse.json({ 
          error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` 
        }, { status: 400 });
      }
      data.status = body.status;
    }
    
    if (body.roomId !== undefined) {
      const roomId = Number(body.roomId);
      if (isNaN(roomId) || roomId <= 0) {
        return NextResponse.json({ error: 'Invalid room ID' }, { status: 400 });
      }
      
      // Validate room exists
      const room = await prisma.room.findUnique({
        where: { roomId }
      });
      if (!room) {
        return NextResponse.json({ 
          error: `Room with ID ${roomId} not found` 
        }, { status: 400 });
      }
      data.roomId = roomId;
    }

    const updated = await prisma.rFIDReader.update({ 
      where: { readerId }, 
      data,
      include: {
        room: {
          select: {
            roomId: true,
            roomNo: true
          }
        }
      }
    });
    
    // Optional status-change notification
    try {
      const prevStatus = existingReader.status;
      const newStatus = updated.status;
      if (prevStatus !== newStatus) {
        const priority = (newStatus === 'OFFLINE' || newStatus === 'ERROR') ? 'HIGH' : 'NORMAL';
        await createNotification(userId, {
          title: 'RFID Reader status updated',
          message: `Device ${updated.deviceId} is now ${newStatus}`,
          priority,
          type: 'RFID',
        });
      }
    } catch (e) {
      console.warn('Notification create failed (reader status change):', e);
    }

    return NextResponse.json({
      readerId: updated.readerId,
      deviceId: updated.deviceId,
      deviceName: updated.deviceName,
      status: updated.status,
      ipAddress: updated.ipAddress,
      lastSeen: updated.lastSeen,
      roomId: updated.roomId,
      notes: updated.notes,
      room: updated.room
    });
  } catch (e: any) {
    console.error('Error updating RFID reader:', e);
    
    // Handle specific Prisma errors
    if (e.code === 'P2002') {
      return NextResponse.json({ 
        error: "Device ID already exists. Please use a unique device ID." 
      }, { status: 400 });
    }
    if (e.code === 'P2003') {
      return NextResponse.json({ 
        error: "Invalid room reference. Please ensure the room exists." 
      }, { status: 400 });
    }
    
    return NextResponse.json({ 
      error: e?.message || 'Failed to update reader' 
    }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // Auth: admin-only
    const token = request.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = Number((decoded as any)?.userId);
    if (!Number.isFinite(userId)) return NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 });
    const user = await prisma.user.findUnique({ where: { userId }, select: { role: true, status: true } });
    if (!user || user.status !== 'ACTIVE') return NextResponse.json({ error: 'User not found or inactive' }, { status: 404 });
    if (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN') return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });

    const data = await request.json();
    const reader = await prisma.rFIDReader.update({
      where: { readerId: parseInt(id) },
      data: {
        deviceId: data.deviceId,
        deviceName: data.deviceName,
        roomId: data.roomId,
        ipAddress: data.ipAddress,
        status: data.status,
        notes: data.notes,
        components: data.components || {},
        lastSeen: new Date(),
      },
    });
    return NextResponse.json(reader);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update RFID reader" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // Auth: admin-only
    const token = request.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = Number((decoded as any)?.userId);
    if (!Number.isFinite(userId)) return NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 });
    const user = await prisma.user.findUnique({ where: { userId }, select: { role: true, status: true } });
    if (!user || user.status !== 'ACTIVE') return NextResponse.json({ error: 'User not found or inactive' }, { status: 404 });
    if (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN') return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });

    const readerId = Number(id);
    if (isNaN(readerId)) return NextResponse.json({ error: 'Invalid reader id' }, { status: 400 });
    const toDelete = await prisma.rFIDReader.delete({ where: { readerId } });
    try {
      await createNotification(userId, {
        title: 'RFID Reader removed',
        message: `Device ${toDelete.deviceId} deleted`,
        priority: 'NORMAL',
        type: 'RFID',
      });
    } catch {}
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete RFID reader" }, { status: 500 });
  }
} 