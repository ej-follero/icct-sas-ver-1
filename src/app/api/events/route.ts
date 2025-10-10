import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma, EventType, EventStatus, Priority } from '@prisma/client';

async function assertRole(request: NextRequest, allowed: Array<'SUPER_ADMIN' | 'ADMIN' | 'INSTRUCTOR'>) {
  const token = request.cookies.get('token')?.value;
  const isDev = process.env.NODE_ENV !== 'production';
  if (!token) return isDev ? { ok: true, role: 'ADMIN', userId: 1 } as const : { ok: false, res: NextResponse.json({ error: 'Authentication required' }, { status: 401 }) };
  try {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const role = decoded.role as string | undefined;
    const userId = decoded.userId as number | undefined;
    if (!role || !allowed.includes(role as any)) {
      return { ok: false, res: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
    }
    return { ok: true, role: role as any, userId: userId ?? 1 } as const;
  } catch {
    return { ok: false, res: NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 }) };
  }
}

export async function GET(request: NextRequest) {
  try {
    // Authorization: allow ADMIN and INSTRUCTOR
    const gate = await assertRole(request, ['SUPER_ADMIN', 'ADMIN', 'INSTRUCTOR']);
    if (!('ok' in gate) || gate.ok !== true) return gate.res;

    const { searchParams } = new URL(request.url);
    const search = (searchParams.get('search') || '').trim();
    const eventTypeParam = searchParams.get('eventType');
    const statusParam = searchParams.get('status');
    const priorityParam = searchParams.get('priority');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1);
    const pageSize = Math.min(Math.max(parseInt(searchParams.get('pageSize') || '20', 10), 1), 100);
    const sortByParam = (searchParams.get('sortBy') || 'eventDate') as string;
    const sortOrderParam = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc';

    const sortWhitelist: Record<string, true> = {
      eventDate: true,
      title: true,
      eventType: true,
      status: true,
      priority: true,
      createdAt: true,
    };
    const sortBy = sortWhitelist[sortByParam] ? (sortByParam as any) : 'eventDate';
    const sortOrder = sortOrderParam === 'asc' ? 'asc' : 'desc';
    const skip = (page - 1) * pageSize;

    // Build date range filter
    let dateFilter = {};
    if (startDate && endDate) {
      try {
        // Set end date to end of day to include the entire day
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        // Validate dates
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
          console.error('Invalid date format:', { startDate, endDate });
          throw new Error('Invalid date format');
        }
        
        end.setHours(23, 59, 59, 999);
        
        dateFilter = {
          eventDate: {
            gte: start,
            lte: end,
          },
        };
      } catch (dateError) {
        console.error('Date parsing error:', dateError);
        throw new Error('Invalid date range provided');
      }
    } else if (startDate) {
      try {
        const start = new Date(startDate);
        if (isNaN(start.getTime())) {
          throw new Error('Invalid start date format');
        }
        dateFilter = { eventDate: { gte: start } };
      } catch (dateError) {
        console.error('Start date parsing error:', dateError);
        throw new Error('Invalid start date provided');
      }
    } else if (endDate) {
      try {
        // Set end date to end of day to include the entire day
        const end = new Date(endDate);
        if (isNaN(end.getTime())) {
          throw new Error('Invalid end date format');
        }
        end.setHours(23, 59, 59, 999);
        dateFilter = { eventDate: { lte: end } };
      } catch (dateError) {
        console.error('End date parsing error:', dateError);
        throw new Error('Invalid end date provided');
      }
    }

    // Normalize enum filters
    const eventType: EventType | 'all' | null = eventTypeParam && eventTypeParam.toUpperCase() in EventType ? (eventTypeParam.toUpperCase() as EventType) : (eventTypeParam === 'all' ? 'all' : null);
    const status: EventStatus | 'all' | null = statusParam && statusParam.toUpperCase() in EventStatus ? (statusParam.toUpperCase() as EventStatus) : (statusParam === 'all' ? 'all' : null);
    const priority: Priority | 'all' | null = priorityParam && priorityParam.toUpperCase() in Priority ? (priorityParam.toUpperCase() as Priority) : (priorityParam === 'all' ? 'all' : null);

    const where: Prisma.EventWhereInput = {
      AND: [
        // Only show non-deleted events
        { deletedAt: null },
        eventType && eventType !== 'all' ? { eventType } : {},
        status && status !== 'all' ? { status } : {},
        priority && priority !== 'all' ? { priority } : {},
        // Date range filtering
        dateFilter,
        search
          ? {
              OR: [
                { title: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
                { location: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {},
      ],
    };

    const [items, total] = await Promise.all([
      prisma.event.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        take: pageSize,
        skip,
        include: {
          createdByAdmin: {
            select: {
              userName: true,
              email: true,
            },
          },
          Attendance: {
            select: {
              attendanceId: true,
            },
          },
        },
      }),
      prisma.event.count({ where }),
    ]);

    // Transform the data to match the frontend interface
    const transformedItems = items.map((event) => ({
      id: event.eventId,
      title: event.title,
      class: event.eventType, // Using eventType as class for now
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
      createdBy: event.createdByAdmin?.userName || 'Unknown',
      createdAt: event.createdAt,
      updatedAt: event.updatedAt,
      attendanceCount: event.Attendance.length,
    }));

    return NextResponse.json({ items: transformedItems, total, page, pageSize });
  } catch (error) {
    console.error('GET /api/events error', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
    });
    return NextResponse.json({ 
      error: 'Failed to fetch events',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Authorization: allow ADMIN and INSTRUCTOR
    const gate = await assertRole(request, ['SUPER_ADMIN', 'ADMIN', 'INSTRUCTOR']);
    if (!('ok' in gate) || gate.ok !== true) return gate.res;
    const createdByUserId = (gate as any).userId as number;

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

    const event = await prisma.event.create({
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
        imageUrl,
        contactEmail,
        contactPhone,
        createdBy: createdByUserId,
        status: EventStatus.DRAFT,
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

    return NextResponse.json(event, { status: 201 });
  } catch (error) {
    console.error('POST /api/events error', error);
    return NextResponse.json({ error: 'Failed to create event' }, { status: 500 });
  }
}
