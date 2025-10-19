import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createNotification } from '@/lib/notifications';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
      const { id } = await params;
      const tag = await prisma.rFIDTags.findUnique({
        where: { tagId: parseInt(id) },
      });
      if (!tag) return NextResponse.json({ error: "Not found" }, { status: 404 });
      return NextResponse.json(tag);
    } catch (error) {
      return NextResponse.json({ error: "Failed to fetch RFID tag" }, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json({ error: "Authentication failed" }, { status: 401 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    try {
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

      const { id } = await params;
      const previous = await prisma.rFIDTags.findUnique({ where: { tagId: parseInt(id) } });
      const tag = await prisma.rFIDTags.update({
        where: { tagId: parseInt(id) },
        data: {
          tagNumber: data.tagNumber,
          tagType: data.tagType,
          status: data.status,
          notes: data.notes || null,
          studentId,
          assignedBy,
          assignmentReason: data.assignmentReason || null,
          expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
          assignedAt: new Date(), // Update assigned date to current date
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
      
      // Notifications: status transitions of interest
      try {
        if (previous?.status !== tag.status && ['LOST','DAMAGED','EXPIRED'].includes(tag.status)) {
          // Notify the assigned student (if any) and the admin actor
          if (tag.studentId) {
            const student = await prisma.student.findUnique({ where: { studentId: tag.studentId }, select: { userId: true, firstName: true, lastName: true } });
            if (student?.userId) {
              await createNotification(student.userId, {
                title: 'RFID tag status',
                message: `Tag ${tag.tagNumber} is ${tag.status}`,
                priority: 'HIGH',
                type: 'RFID',
              });
            }
          }
        }
      } catch {}

      return NextResponse.json(tag);
    } catch (error: any) {
      console.error('Error updating RFID tag:', error);
      
      // Handle specific database errors
      if (error.code === 'P2002') {
        return NextResponse.json({ error: "Tag number already exists" }, { status: 400 });
      }
      
      if (error.code === 'P2003') {
        return NextResponse.json({ error: "Foreign key constraint violation" }, { status: 400 });
      }
      
      return NextResponse.json({ error: "Failed to update RFID tag" }, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json({ error: "Authentication failed" }, { status: 401 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    try {
      const { id } = await params;
      await prisma.rFIDTags.delete({
        where: { tagId: parseInt(id) },
      });
      return NextResponse.json({ success: true });
    } catch (error) {
      return NextResponse.json({ error: "Failed to delete RFID tag" }, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json({ error: "Authentication failed" }, { status: 401 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    try {
      const data = await request.json();
      let updateData: any = {};
      if (data.unassign) {
        updateData.studentId = null;
        updateData.assignedAt = null; // Clear assigned date when unassigning
      } else if (data.studentId) {
        updateData.studentId = data.studentId;
        updateData.assignedAt = new Date(); // Set assigned date when assigning
      } else {
        return NextResponse.json({ error: "Missing assignment data" }, { status: 400 });
      }
      
      const { id } = await params;
      const before = await prisma.rFIDTags.findUnique({ where: { tagId: parseInt(id) }, select: { tagNumber: true, studentId: true } });
      const tag = await prisma.rFIDTags.update({
        where: { tagId: parseInt(id) },
        data: updateData,
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
      // Notify assignment changes
      try {
        const assigned = !!tag.studentId;
        const message = assigned
          ? `Tag ${tag.tagNumber} assigned to ${tag.student?.firstName || ''} ${tag.student?.lastName || ''}`
          : `Tag ${tag.tagNumber} unassigned`;
        // Actor notification
        const token = request.cookies.get('token')?.value;
        if (token) {
          const jwt = require('jsonwebtoken');
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          const actorId = Number((decoded as any)?.userId);
          if (Number.isFinite(actorId)) {
            await createNotification(actorId, { title: 'RFID tag updated', message, priority: 'NORMAL', type: 'RFID' });
          }
        }
        // If reassigned, optionally notify previous owner
        if (before?.studentId && before.studentId !== tag.studentId) {
          const prevStudent = await prisma.student.findUnique({ where: { studentId: before.studentId }, select: { userId: true } });
          if (prevStudent?.userId) {
            await createNotification(prevStudent.userId, { title: 'RFID tag updated', message: `Tag ${tag.tagNumber} unassigned from your account`, priority: 'NORMAL', type: 'RFID' });
          }
        }
      } catch {}

      return NextResponse.json(tag);
    } catch (error) {
      return NextResponse.json({ error: "Failed to update assignment" }, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json({ error: "Authentication failed" }, { status: 401 });
  }
}