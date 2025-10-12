import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/rooms/available
// Returns rooms that don't have RFID readers assigned
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 [ROOMS AVAILABLE] Starting fetch request');
    
    // Optional auth - if token exists, validate it, otherwise proceed
    let userRole = 'GUEST';
    const token = request.cookies.get('token')?.value;
    if (token) {
      try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = Number((decoded as any)?.userId);
        if (Number.isFinite(userId)) {
          const user = await prisma.user.findUnique({ where: { userId }, select: { role: true, status: true } });
          if (user && user.status === 'ACTIVE') {
            userRole = user.role;
          }
        }
      } catch (authError) {
        console.warn('Auth validation failed, proceeding as guest:', authError);
      }
    }

    // Get all rooms (simplified for now)
    const allRooms = await prisma.room.findMany({
      select: {
        roomId: true,
        roomNo: true,
        roomType: true,
        roomBuildingLoc: true,
        roomFloorLoc: true,
        status: true
      },
      orderBy: [
        { roomBuildingLoc: 'asc' },
        { roomFloorLoc: 'asc' },
        { roomNo: 'asc' }
      ]
    });

    console.log('✅ [ROOMS AVAILABLE] Found', allRooms.length, 'total rooms');

    return NextResponse.json({
      success: true,
      rooms: allRooms,
      total: allRooms.length,
      message: 'All rooms returned (filtering disabled for debugging)'
    });

  } catch (e: any) {
    console.error('Available rooms fetch error:', e);
    return NextResponse.json({ 
      error: e?.message || 'Failed to fetch available rooms' 
    }, { status: 500 });
  }
}
