import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma, Status, Priority, Role } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    // Authorization: allow ADMIN and INSTRUCTOR
    const role = request.headers.get('x-user-role');
    const isDev = process.env.NODE_ENV !== 'production';
    if (!isDev) {
      if (!role || (role !== 'ADMIN' && role !== 'INSTRUCTOR')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    const { searchParams } = new URL(request.url);
    const search = (searchParams.get('search') || '').trim();
    const status = searchParams.get('status') as Status | 'all' | null;
    const priority = searchParams.get('priority') as Priority | 'all' | null;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1);
    const pageSize = Math.min(Math.max(parseInt(searchParams.get('pageSize') || '20', 10), 1), 100);
    const sortByParam = (searchParams.get('sortBy') || 'createdAt') as string;
    const sortOrderParam = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc';

    const sortWhitelist: Record<string, true> = {
      createdAt: true,
      updatedAt: true,
      title: true,
      status: true,
      priority: true,
    };
    const sortBy = sortWhitelist[sortByParam] ? (sortByParam as any) : 'createdAt';
    const sortOrder = sortOrderParam === 'asc' ? 'asc' : 'desc';
    const skip = (page - 1) * pageSize;

    const where: Prisma.AnnouncementWhereInput = {
      AND: [
        // Search filter
        search ? {
          OR: [
            { title: { contains: search, mode: 'insensitive' } },
            { content: { contains: search, mode: 'insensitive' } },
          ],
        } : {},
        // Status filter
        status && status !== 'all' ? { status } : {},
        // Priority filter
        priority && priority !== 'all' ? { priority } : {},
        // Date range filter
        startDate || endDate ? {
          createdAt: {
            ...(startDate ? { gte: new Date(startDate) } : {}),
            ...(endDate ? { lte: new Date(endDate) } : {}),
          },
        } : {},
      ].filter(Boolean),
    };

    const [items, total] = await Promise.all([
      prisma.announcement.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        take: pageSize,
        skip,
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
      }),
      prisma.announcement.count({ where }),
    ]);

    // Transform the data to match frontend expectations
    const transformedItems = items.map((item) => ({
      id: item.announcementId,
      title: item.title,
      description: item.content,
      class: item.section?.sectionName || item.subject?.subjectName || 'General',
      date: item.createdAt.toISOString().split('T')[0],
      status: item.status.toLowerCase() as 'normal' | 'important' | 'archived',
      priority: item.priority.toLowerCase(),
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
      createdBy: item.admin?.userName || (item.instructor ? `${item.instructor.firstName} ${item.instructor.lastName}`.trim() : 'Unknown'),
      isGeneral: item.isGeneral,
      subjectId: item.subjectId,
      sectionId: item.sectionId,
      instructorId: item.instructorId,
    }));

    return NextResponse.json({
      items: transformedItems,
      total,
      page,
      pageSize,
    });
  } catch (error) {
    console.error('GET /api/announcements error', error);
    return NextResponse.json({ error: 'Failed to fetch announcements' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Authorization: allow ADMIN and INSTRUCTOR
    const role = request.headers.get('x-user-role');
    const isDev = process.env.NODE_ENV !== 'production';
    if (!isDev) {
      if (!role || (role !== 'ADMIN' && role !== 'INSTRUCTOR')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    const body = await request.json();
    const {
      title,
      description,
      class: classValue,
      date,
      status = 'normal',
      priority = 'normal',
      isGeneral = false,
      subjectId,
      sectionId,
      instructorId,
    } = body;

    // Validate required fields
    if (!title || !description) {
      return NextResponse.json({ error: 'Title and description are required' }, { status: 400 });
    }

    // Get user ID from middleware headers
    const userId = request.headers.get('x-user-id');
    const userRole = request.headers.get('x-user-role') as Role;
    
    if (!userId) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

    const newAnnouncement = await prisma.announcement.create({
      data: {
        title,
        content: description,
        isGeneral,
        subjectId: subjectId ? parseInt(subjectId) : null,
        sectionId: sectionId ? parseInt(sectionId) : null,
        instructorId: instructorId ? parseInt(instructorId) : null,
        status: status.toUpperCase() as Status,
        priority: priority.toUpperCase() as Priority,
        createdby: parseInt(userId),
        userType: userRole,
      },
      include: {
        admin: {
          select: {
            userName: true,
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
      id: newAnnouncement.announcementId,
      title: newAnnouncement.title,
      description: newAnnouncement.content,
      class: newAnnouncement.section?.sectionName || newAnnouncement.subject?.subjectName || 'General',
      date: newAnnouncement.createdAt.toISOString().split('T')[0],
      status: newAnnouncement.status.toLowerCase() as 'normal' | 'important' | 'archived',
      priority: newAnnouncement.priority.toLowerCase(),
      createdAt: newAnnouncement.createdAt.toISOString(),
      updatedAt: newAnnouncement.updatedAt.toISOString(),
      createdBy: newAnnouncement.admin?.userName || 'Unknown',
      isGeneral: newAnnouncement.isGeneral,
      subjectId: newAnnouncement.subjectId,
      sectionId: newAnnouncement.sectionId,
      instructorId: newAnnouncement.instructorId,
    };

    return NextResponse.json(transformedAnnouncement, { status: 201 });
  } catch (error) {
    console.error('POST /api/announcements error', error);
    return NextResponse.json({ error: 'Failed to create announcement' }, { status: 500 });
  }
}
