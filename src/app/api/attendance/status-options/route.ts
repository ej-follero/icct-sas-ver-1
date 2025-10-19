import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/attendance/status-options
// Returns unique status values from attendance records
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 [STATUS OPTIONS] Fetching unique status values from attendance records');

    // Get unique status values from attendance records
    const statusCounts = await prisma.attendance.groupBy({
      by: ['status'],
      where: {
        attendanceType: 'RFID_SCAN'
      },
      _count: {
        status: true
      },
      orderBy: {
        status: 'asc'
      }
    });

    // Extract unique status values
    const statusOptions = statusCounts.map(item => item.status);

    console.log('✅ [STATUS OPTIONS] Found status options:', statusOptions);

    return NextResponse.json({
      success: true,
      data: statusOptions
    });

  } catch (e: any) {
    console.error('Status options error:', e);
    return NextResponse.json({ 
      error: e?.message || 'Failed to fetch status options' 
    }, { status: 500 });
  }
}
