import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { EventType, EventStatus, Priority } from '@prisma/client';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Authorization: allow ADMIN and INSTRUCTOR
    const role = _request.headers.get('x-user-role');
    const isDev = process.env.NODE_ENV !== 'production';
    if (!isDev) {
      if (!role || (role !== 'ADMIN' && role !== 'INSTRUCTOR')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

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

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Authorization: allow ADMIN and INSTRUCTOR
    const role = request.headers.get('x-user-role');
    const isDev = process.env.NODE_ENV !== 'production';
    if (!isDev) {
      if (!role || (role !== 'ADMIN' && role !== 'INSTRUCTOR')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

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

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Authorization: allow ADMIN only
    const role = _request.headers.get('x-user-role');
    const isDev = process.env.NODE_ENV !== 'production';
    if (!isDev) {
      if (!role || role !== 'ADMIN') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

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
        status: 'CANCELLED' // Also update status to cancelled
      },
    });

    return NextResponse.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('DELETE /api/events/[id] error', error);
    return NextResponse.json({ error: 'Failed to delete event' }, { status: 500 });
  }
}
