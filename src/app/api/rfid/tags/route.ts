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

// POST create new RFID tag
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

    // Admin-only access control for creating tags
    const adminRoles = ['SUPER_ADMIN', 'ADMIN'];
    if (!adminRoles.includes(user.role)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const data = await request.json();
    
    // Validate required fields
    if (!data.tagNumber) {
      return NextResponse.json({ error: "Tag number is required" }, { status: 400 });
    }
    
    if (!data.tagType) {
      return NextResponse.json({ error: "Tag type is required" }, { status: 400 });
    }
    
    if (!data.status) {
      return NextResponse.json({ error: "Status is required" }, { status: 400 });
    }

    // Validate foreign key references if provided
    let studentId = null;
    if (data.studentId) {
      const student = await prisma.student.findUnique({
        where: { studentId: data.studentId }
      });
      if (!student) {
        return NextResponse.json({ error: `Student with ID ${data.studentId} not found` }, { status: 400 });
      }
      
      // Check if student already has an RFID tag
      const existingTag = await prisma.rFIDTags.findUnique({
        where: { studentId: data.studentId }
      });
      
      if (existingTag) {
        return NextResponse.json({ 
          error: `Student already has an RFID tag (${existingTag.tagNumber}). Each student can only have one RFID tag.` 
        }, { status: 400 });
      }
      
      studentId = data.studentId;
    }

    let assignedBy = null;
    if (data.assignedBy) {
      const user = await prisma.user.findUnique({
        where: { userId: data.assignedBy }
      });
      if (!user) {
        return NextResponse.json({ error: `User with ID ${data.assignedBy} not found` }, { status: 400 });
      }
      assignedBy = data.assignedBy;
    }

    const newTag = await prisma.rFIDTags.create({
      data: {
        tagNumber: data.tagNumber,
        tagType: data.tagType,
        status: data.status,
        notes: data.notes || null,
        studentId,
        assignedBy,
        assignmentReason: data.assignmentReason || null,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
        assignedAt: new Date(),
      },
      include: {
        student: {
          select: {
            studentId: true,
            firstName: true,
            lastName: true,
            studentIdNum: true,
          },
        },
      },
    });
    
    console.log(`Created new RFID tag: ${newTag.tagNumber}`);
    return NextResponse.json(newTag);
  } catch (error: any) {
    console.error('Error creating RFID tag:', error);
    
    // Handle specific database errors
    if (error.code === 'P2002') {
      // Check which field caused the unique constraint violation
      if (error.meta?.target?.includes('studentId')) {
        return NextResponse.json({ 
          error: "Student already has an RFID tag. Each student can only have one RFID tag." 
        }, { status: 400 });
      } else if (error.meta?.target?.includes('tagNumber')) {
        return NextResponse.json({ 
          error: "Tag number already exists. Please use a different tag number." 
        }, { status: 400 });
      } else {
        return NextResponse.json({ 
          error: "Duplicate entry. Please check your data and try again." 
        }, { status: 400 });
      }
    }
    
    if (error.code === 'P2003') {
      return NextResponse.json({ error: "Invalid reference. Please check student ID and assigned by user." }, { status: 400 });
    }
    
    return NextResponse.json(
      { error: `Failed to create RFID tag: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}