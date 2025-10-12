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

    try {
    // Create CSV template for RFID tags
    const headers = [
      'tagNumber',
      'tagType', 
      'status',
      'notes',
      'studentId',
      'assignedBy',
      'assignmentReason',
      'expiresAt'
    ];

    // Sample data row
    const sampleRow = [
      'TAG001',
      'STUDENT_CARD',
      'ACTIVE',
      'Sample tag for student',
      '1',
      '',
      '1',
      'Initial assignment',
      new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // 1 year from now
    ];

    const csvContent = [
      headers.join(','),
      sampleRow.map(field => {
        const str = String(field);
        return str.includes(',') || str.includes('"') || str.includes('\n') 
          ? `"${str.replace(/"/g, '""')}"` 
          : str;
      }).join(',')
    ].join('\n');

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="rfid-tags-template.csv"',
      },
    });
    } catch (error) {
      console.error('Error generating RFID tags template:', error);
      return NextResponse.json(
        { error: 'Failed to generate template' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error generating RFID tags template:', error);
    return NextResponse.json(
      { error: 'Failed to generate template' },
      { status: 500 }
    );
  }
}
