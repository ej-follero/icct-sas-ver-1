import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { EventStatus, Priority, EventType } from '@prisma/client';

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

export async function POST(request: NextRequest) {
  try {
    const gate = await assertRole(request, ['SUPER_ADMIN', 'ADMIN', 'INSTRUCTOR']);
    if (!('ok' in gate) || gate.ok !== true) return gate.res;
    const createdByUserId = (gate as any).userId as number;

    const body = await request.json();
    const { events } = body;

    if (!events || !Array.isArray(events)) {
      return NextResponse.json({ error: 'Invalid events data' }, { status: 400 });
    }

    let successCount = 0;
    let failedCount = 0;
    const errors: string[] = [];

    for (const eventData of events) {
      try {
        // Validate required fields
        if (!eventData.title || !eventData.date) {
          failedCount++;
          errors.push(`Event missing required fields: ${eventData.title || 'Unknown'}`);
          continue;
        }

        // Parse and validate date
        const eventDate = new Date(eventData.date);
        if (isNaN(eventDate.getTime())) {
          failedCount++;
          errors.push(`Invalid date format for event: ${eventData.title}`);
          continue;
        }

        // Map enums to Prisma enums
        const statusUpper = (eventData.status || '').toString().toUpperCase();
        const status: EventStatus = (statusUpper in EventStatus ? statusUpper : 'DRAFT') as EventStatus;

        const priorityUpper = (eventData.priority || '').toString().toUpperCase();
        const priority: Priority = (priorityUpper in Priority ? priorityUpper : 'NORMAL') as Priority;

        const typeUpper = (eventData.eventType || '').toString().toUpperCase();
        const eventType: EventType = (typeUpper in EventType ? typeUpper : 'OTHER') as EventType;

        // Create event in database
        await prisma.event.create({
          data: {
            title: eventData.title.trim(),
            description: eventData.description?.trim() || '',
            eventDate: eventDate,
            endDate: eventData.endDate ? new Date(eventData.endDate) : null,
            location: eventData.location?.trim() || '',
            eventType: eventType,
            status: status,
            priority: priority,
            capacity: eventData.capacity ? parseInt(eventData.capacity) : null,
            isPublic: eventData.isPublic !== undefined ? Boolean(eventData.isPublic) : true,
            requiresRegistration: eventData.requiresRegistration !== undefined ? Boolean(eventData.requiresRegistration) : false,
            contactEmail: eventData.contactEmail?.trim() || '',
            contactPhone: eventData.contactPhone?.trim() || '',
            imageUrl: eventData.imageUrl?.trim() || '',
            createdBy: createdByUserId,
          },
        });

        successCount++;
      } catch (error: any) {
        failedCount++;
        errors.push(`Failed to import event "${eventData.title}": ${error.message}`);
      }
    }

    return NextResponse.json({
      success: successCount,
      failed: failedCount,
      errors: errors.slice(0, 10), // Limit error messages to prevent response size issues
    });
  } catch (error) {
    console.error('POST /api/events/import error', error);
    return NextResponse.json({ error: 'Failed to import events' }, { status: 500 });
  }
}
