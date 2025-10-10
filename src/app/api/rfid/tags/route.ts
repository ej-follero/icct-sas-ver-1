import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET all RFID tags
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

    console.log('Fetching RFID tags...');
    
    const rfidTags = await prisma.rFIDTags.findMany({
      select: {
        tagId: true,
        tagNumber: true,
        tagType: true,
        status: true,
        notes: true,
        assignedAt: true,
        lastUsed: true,
        expiresAt: true,
        assignedBy: true,
        assignmentReason: true,
        studentId: true,
        student: {
          select: {
            studentId: true,
            firstName: true,
            lastName: true,
            studentIdNum: true,
          }
        },
      },
      orderBy: {
        tagNumber: 'asc',
      },
    });

    console.log(`Found ${rfidTags.length} available RFID tags`);

    return NextResponse.json({ 
      data: rfidTags,
      message: 'RFID tags fetched successfully'
    });
  } catch (error) {
    console.error('Error fetching RFID tags:', error);
    return NextResponse.json(
      { error: `Failed to fetch RFID tags: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}