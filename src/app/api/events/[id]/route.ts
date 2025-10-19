import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { EventType, EventStatus, Priority } from '@prisma/client';

async function assertRole(request: NextRequest, allowed: Array<'SUPER_ADMIN' | 'ADMIN' | 'INSTRUCTOR'>) {
  const token = request.cookies.get('token')?.value;
  const isDev = process.env.NODE_ENV !== 'production';
  if (!token) return isDev ? { ok: true, role: 'ADMIN' } as const : { ok: false, res: NextResponse.json({ error: 'Authentication required' }, { status: 401 }) };
  try {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const role = decoded.role as string | undefined;
    if (!role || !allowed.includes(role as any)) {
      return { ok: false, res: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
    }
    return { ok: true, role: role as any } as const;
  } catch {
    return { ok: false, res: NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 }) };
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Authorization: allow ADMIN and INSTRUCTOR
    const gate = await assertRole(request, ['SUPER_ADMIN', 'ADMIN', 'INSTRUCTOR']);
    if (!('ok' in gate) || gate.ok !== true) return gate.res;

    const { id } = await params;
    const event = await prisma.event.findFirst({
      where: { 
        eventId: parseInt(id),
        deletedAt: null // Only find non-deleted events
      },
      include: {
        createdByAdmin: {
          select: {
            userName: true,
            email: true,
          },
        },
        Attendance: {
          include: {
            user: {
              select: {
                userName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Transform the data to match the frontend interface
    const transformedEvent = {
      id: event.eventId,
      title: event.title,
      class: event.eventType,
      date: event.eventDate.toISOString().split('T')[0],
      startTime: event.eventDate.toTimeString().slice(0, 5),
      endTime: event.endDate ? event.endDate.toTimeString().slice(0, 5) : '',
      description: event.description,
      location: event.location,
      status: event.status,
      priority: event.priority,
      eventType: event.eventType,
      capacity: event.capacity,
      registeredCount: event.registeredCount,
      isPublic: event.isPublic,
      requiresRegistration: event.requiresRegistration,
      imageUrl: event.imageUrl,
      contactEmail: event.contactEmail,
      contactPhone: event.contactPhone,
      createdBy: event.createdByAdmin.userName,
      createdAt: event.createdAt,
      updatedAt: event.updatedAt,
      attendance: event.Attendance,
    };

    return NextResponse.json(transformedEvent);
  } catch (error) {
    console.error('GET /api/events/[id] error', error);
    return NextResponse.json({ error: 'Failed to fetch event' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Authorization: allow ADMIN and INSTRUCTOR
    const gate = await assertRole(request, ['SUPER_ADMIN', 'ADMIN', 'INSTRUCTOR']);
    if (!('ok' in gate) || gate.ok !== true) return gate.res;

    const { id } = await params;
    const body = await request.json();
    const {
      title,
      description,
      eventType,
      eventDate,
      endDate,
      location,
      capacity,
      isPublic,
      requiresRegistration,
      priority,
      status,
      imageUrl,
      contactEmail,
      contactPhone,
    } = body;

    // Validate required fields
    if (!title || !description || !eventType || !eventDate) {
      return NextResponse.json(
        { error: 'Title, description, event type, and event date are required' },
        { status: 400 }
      );
    }

    // Validate event type
    const validEventTypes = Object.values(EventType);
    if (!validEventTypes.includes(eventType)) {
      return NextResponse.json(
        { error: 'Invalid event type' },
        { status: 400 }
      );
    }

    // Validate priority
    const validPriorities = Object.values(Priority);
    if (priority && !validPriorities.includes(priority)) {
      return NextResponse.json(
        { error: 'Invalid priority' },
        { status: 400 }
      );
    }

    // Validate status
    const validStatuses = Object.values(EventStatus);
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      );
    }

    const event = await prisma.event.update({
      where: { eventId: parseInt(id) },
      data: {
        title,
        description,
        eventType,
        eventDate: new Date(eventDate),
        endDate: endDate ? new Date(endDate) : null,
        location,
        capacity: capacity ? parseInt(capacity) : null,
        isPublic: isPublic ?? true,
        requiresRegistration: requiresRegistration ?? false,
        priority: priority || Priority.NORMAL,
        status: status || EventStatus.DRAFT,
        imageUrl,
        contactEmail,
        contactPhone,
      },
      include: {
        createdByAdmin: {
          select: {
            userName: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(event);
  } catch (error) {
    console.error('PUT /api/events/[id] error', error);
    return NextResponse.json({ error: 'Failed to update event' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Authorization: allow ADMIN and INSTRUCTOR
    const gate = await assertRole(request, ['SUPER_ADMIN', 'ADMIN', 'INSTRUCTOR']);
    if (!('ok' in gate) || gate.ok !== true) return gate.res;

    const { id } = await params;
    const body = await request.json();
    const {
      title,
      description,
      eventType,
      eventDate,
      endDate,
      location,
      capacity,
      isPublic,
      requiresRegistration,
      priority,
      status,
      imageUrl,
      contactEmail,
      contactPhone,
    } = body;

    // Validate event type if provided
    if (eventType) {
      const validEventTypes = Object.values(EventType);
      if (!validEventTypes.includes(eventType)) {
        return NextResponse.json(
          { error: 'Invalid event type' },
          { status: 400 }
        );
      }
    }

    // Validate priority if provided
    if (priority) {
      const validPriorities = Object.values(Priority);
      if (!validPriorities.includes(priority)) {
        return NextResponse.json(
          { error: 'Invalid priority' },
          { status: 400 }
        );
      }
    }

    // Validate status if provided
    if (status) {
      const validStatuses = Object.values(EventStatus);
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { error: 'Invalid status' },
          { status: 400 }
        );
      }
    }

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (eventType !== undefined) updateData.eventType = eventType;
    if (eventDate !== undefined) updateData.eventDate = new Date(eventDate);
    if (endDate !== undefined) updateData.endDate = endDate ? new Date(endDate) : null;
    if (location !== undefined) updateData.location = location;
    if (capacity !== undefined) updateData.capacity = capacity ? parseInt(capacity) : null;
    if (isPublic !== undefined) updateData.isPublic = isPublic;
    if (requiresRegistration !== undefined) updateData.requiresRegistration = requiresRegistration;
    if (priority !== undefined) updateData.priority = priority;
    if (status !== undefined) updateData.status = status;
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
    if (contactEmail !== undefined) updateData.contactEmail = contactEmail;
    if (contactPhone !== undefined) updateData.contactPhone = contactPhone;

    const event = await prisma.event.update({
      where: { eventId: parseInt(id) },
      data: updateData,
      include: {
        createdByAdmin: {
          select: {
            userName: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(event);
  } catch (error) {
    console.error('PATCH /api/events/[id] error', error);
    return NextResponse.json({ error: 'Failed to update event' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Authorization: allow ADMIN only
    const gate = await assertRole(request, ['SUPER_ADMIN', 'ADMIN']);
    if (!('ok' in gate) || gate.ok !== true) return gate.res;

    const { id } = await params;
    
    // Check if event exists and is not already deleted
    const event = await prisma.event.findFirst({
      where: { 
        eventId: parseInt(id),
        deletedAt: null // Only find non-deleted events
      },
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found or already deleted' }, { status: 404 });
    }

    // Soft delete the event by setting deletedAt timestamp
    await prisma.event.update({
      where: { eventId: parseInt(id) },
      data: { 
        deletedAt: new Date(),
        status: EventStatus.CANCELLED // Also update status to cancelled
      },
    });

    return NextResponse.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('DELETE /api/events/[id] error', error);
    return NextResponse.json({ error: 'Failed to delete event' }, { status: 500 });
  }
}
