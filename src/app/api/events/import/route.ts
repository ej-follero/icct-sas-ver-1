import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Status, Priority } from '@prisma/client';

export async function POST(request: NextRequest) {
  try {
    const role = request.headers.get('x-user-role');
    const isDev = process.env.NODE_ENV !== 'production';
    if (!isDev) {
      if (!role || (role !== 'ADMIN' && role !== 'INSTRUCTOR')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

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

        // Parse and validate times
        const startTime = eventData.startTime || '09:00';
        const endTime = eventData.endTime || '10:00';
        
        // Validate time format (HH:MM)
        const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
        if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
          failedCount++;
          errors.push(`Invalid time format for event: ${eventData.title}`);
          continue;
        }

        // Validate status
        const validStatuses = ['DRAFT', 'SCHEDULED', 'ONGOING', 'COMPLETED', 'CANCELLED', 'POSTPONED'];
        const status = validStatuses.includes(eventData.status?.toUpperCase()) 
          ? eventData.status.toUpperCase() as Status 
          : 'DRAFT';

        // Validate priority
        const validPriorities = ['LOW', 'NORMAL', 'HIGH', 'URGENT'];
        const priority = validPriorities.includes(eventData.priority?.toUpperCase()) 
          ? eventData.priority.toUpperCase() as Priority 
          : 'NORMAL';

        // Validate event type
        const validEventTypes = ['LECTURE', 'LABORATORY', 'CONFERENCE', 'MEETING', 'EXAM', 'OTHER'];
        const eventType = validEventTypes.includes(eventData.eventType?.toUpperCase()) 
          ? eventData.eventType.toUpperCase() 
          : 'LECTURE';

        // Create event in database
        await prisma.event.create({
          data: {
            title: eventData.title.trim(),
            description: eventData.description?.trim() || '',
            eventDate: eventDate,
            startTime: startTime,
            endTime: endTime,
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
            createdBy: 1, // Placeholder - replace with actual user ID
            updatedBy: 1, // Placeholder - replace with actual user ID
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
