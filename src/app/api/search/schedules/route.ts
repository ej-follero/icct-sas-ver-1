import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Search subject schedules by subject code/name or id
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get('q') || '').trim();
    const limit = Math.min(Number(searchParams.get('limit') || 10), 50);
    const entityType = searchParams.get('entityType'); // 'student' or 'instructor'
    const entityId = searchParams.get('entityId'); // studentId or instructorId
    
    console.log('Schedule search request:', { q, limit, entityType, entityId });
    
    if (!q) {
      console.log('No query provided, returning empty results');
      return NextResponse.json({ items: [] });
    }

    let whereClause: any = {
      OR: [
        { subject: { subjectCode: { contains: q, mode: 'insensitive' } } },
        { subject: { subjectName: { contains: q, mode: 'insensitive' } } },
        { section: { sectionName: { contains: q, mode: 'insensitive' } } },
      ],
      status: 'ACTIVE' // Only show active schedules
    };

    // Filter by entity type and ID
    if (entityType && entityId) {
      if (entityType === 'student') {
        // For students, find schedules where the student is enrolled
        whereClause.StudentSchedule = {
          some: {
            studentId: parseInt(entityId),
            status: 'ACTIVE'
          }
        };
      } else if (entityType === 'instructor') {
        // For instructors, find schedules they teach
        whereClause.instructorId = parseInt(entityId);
      }
    }

    const schedules = await prisma.subjectSchedule.findMany({
      where: whereClause,
      include: { 
        subject: true, 
        section: true,
        instructor: {
          select: {
            firstName: true,
            lastName: true
          }
        },
        StudentSchedule: entityType === 'student' ? {
          where: {
            studentId: entityId ? parseInt(entityId) : undefined,
            status: 'ACTIVE'
          }
        } : false
      },
      take: limit,
    });

    console.log('Found schedules:', schedules.length);

    const items = schedules.map(s => ({
      value: String(s.subjectSchedId),
      label: `${s.subject.subjectCode} • ${s.section.sectionName} • ${s.day} ${s.startTime}-${s.endTime} • ${s.instructor.firstName} ${s.instructor.lastName}`,
    }));

    console.log('Returning items:', items);

    return NextResponse.json({ items });
  } catch (e) {
    console.error('Schedule search error', e);
    return NextResponse.json({ items: [] });
  }
}




