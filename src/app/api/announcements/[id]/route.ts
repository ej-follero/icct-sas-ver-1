import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Status, Priority } from '@prisma/client';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Authorization via JWT cookie (allow ADMIN and INSTRUCTOR)
    const isDev = process.env.NODE_ENV !== 'production';
    if (!isDev) {
      const token = _request.cookies.get('token')?.value;
      if (!token) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
      }
      try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.userId as number;
        const user = await prisma.user.findUnique({ where: { userId }, select: { role: true } });
        if (!user || (user.role !== 'ADMIN' && user.role !== 'INSTRUCTOR')) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
      } catch {
        return NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 });
      }
    }

    const { id } = await params;
    const item = await prisma.announcement.findUnique({
      where: { announcementId: parseInt(id) },
      include: {
        admin: {
          select: {
            userName: true,
            email: true,
          },
        },
        instructor: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        section: {
          select: {
            sectionName: true,
          },
        },
        subject: {
          select: {
            subjectName: true,
            subjectCode: true,
          },
        },
      },
    });

    if (!item) {
      return NextResponse.json({ error: 'Announcement not found' }, { status: 404 });
    }

    // Transform the data to match frontend expectations
    const transformedItem = {
      id: item.announcementId,
      title: item.title,
      description: item.content,
      class: item.section?.sectionName || item.subject?.subjectName || 'General',
      date: item.createdAt.toISOString().split('T')[0],
      status: item.status.toLowerCase() as 'normal' | 'important' | 'archived',
      priority: item.priority.toLowerCase(),
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
      createdBy: item.admin?.userName || ((item.instructor?.firstName || '') + ' ' + (item.instructor?.lastName || '')).trim() || 'Unknown',
      isGeneral: item.isGeneral,
      subjectId: item.subjectId,
      sectionId: item.sectionId,
      instructorId: item.instructorId,
    };

    return NextResponse.json(transformedItem);
  } catch (error) {
    console.error('GET /api/announcements/[id] error', error);
    return NextResponse.json({ error: 'Failed to fetch announcement' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Authorization via JWT cookie (allow ADMIN and INSTRUCTOR)
    const isDev = process.env.NODE_ENV !== 'production';
    if (!isDev) {
      const token = request.cookies.get('token')?.value;
      if (!token) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
      }
      try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.userId as number;
        const user = await prisma.user.findUnique({ where: { userId }, select: { role: true } });
        if (!user || (user.role !== 'ADMIN' && user.role !== 'INSTRUCTOR')) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
      } catch {
        return NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 });
      }
    }

    const { id } = await params;
    const body = await request.json();
    const {
      title,
      description,
      class: classValue,
      date,
      status,
      priority,
      isGeneral,
      subjectId,
      sectionId,
      instructorId,
    } = body;

    // Prepare update data
    const updateData: any = {};
    
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.content = description;
    if (status !== undefined) updateData.status = status.toUpperCase() as Status;
    if (priority !== undefined) updateData.priority = priority.toUpperCase() as Priority;
    if (isGeneral !== undefined) updateData.isGeneral = isGeneral;
    if (subjectId !== undefined) updateData.subjectId = subjectId ? parseInt(subjectId) : null;
    if (sectionId !== undefined) updateData.sectionId = sectionId ? parseInt(sectionId) : null;
    if (instructorId !== undefined) updateData.instructorId = instructorId ? parseInt(instructorId) : null;

    const updatedAnnouncement = await prisma.announcement.update({
      where: { announcementId: parseInt(id) },
      data: updateData,
      include: {
        admin: {
          select: {
            userName: true,
            email: true,
          },
        },
        instructor: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        section: {
          select: {
            sectionName: true,
          },
        },
        subject: {
          select: {
            subjectName: true,
            subjectCode: true,
          },
        },
      },
    });

    // Transform the response to match frontend expectations
    const transformedAnnouncement = {
      id: updatedAnnouncement.announcementId,
      title: updatedAnnouncement.title,
      description: updatedAnnouncement.content,
      class: updatedAnnouncement.section?.sectionName || updatedAnnouncement.subject?.subjectName || 'General',
      date: updatedAnnouncement.createdAt.toISOString().split('T')[0],
      status: updatedAnnouncement.status.toLowerCase() as 'normal' | 'important' | 'archived',
      priority: updatedAnnouncement.priority.toLowerCase(),
      createdAt: updatedAnnouncement.createdAt.toISOString(),
      updatedAt: updatedAnnouncement.updatedAt.toISOString(),
      createdBy: updatedAnnouncement.admin?.userName || ((updatedAnnouncement.instructor?.firstName || '') + ' ' + (updatedAnnouncement.instructor?.lastName || '')).trim() || 'Unknown',
      isGeneral: updatedAnnouncement.isGeneral,
      subjectId: updatedAnnouncement.subjectId,
      sectionId: updatedAnnouncement.sectionId,
      instructorId: updatedAnnouncement.instructorId,
    };

    return NextResponse.json(transformedAnnouncement);
  } catch (error) {
    console.error('PATCH /api/announcements/[id] error', error);
    return NextResponse.json({ error: 'Failed to update announcement' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Authorization via JWT cookie (allow ADMIN and INSTRUCTOR)
    const isDev = process.env.NODE_ENV !== 'production';
    if (!isDev) {
      const token = _request.cookies.get('token')?.value;
      if (!token) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
      }
      try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.userId as number;
        const user = await prisma.user.findUnique({ where: { userId }, select: { role: true } });
        if (!user || (user.role !== 'ADMIN' && user.role !== 'INSTRUCTOR')) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
      } catch {
        return NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 });
      }
    }

    const { id } = await params;
    
    // Check if announcement exists
    const existingAnnouncement = await prisma.announcement.findUnique({
      where: { announcementId: parseInt(id) },
    });

    if (!existingAnnouncement) {
      return NextResponse.json({ error: 'Announcement not found' }, { status: 404 });
    }

    await prisma.announcement.delete({
      where: { announcementId: parseInt(id) },
    });

    return NextResponse.json({ message: 'Announcement deleted successfully' });
  } catch (error) {
    console.error('DELETE /api/announcements/[id] error', error);
    return NextResponse.json({ error: 'Failed to delete announcement' }, { status: 500 });
  }
}
