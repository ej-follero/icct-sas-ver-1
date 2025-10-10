import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Get user ID from JWT token in cookies
    const token = request.cookies.get('token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verify JWT token and coerce numeric userId
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userIdRaw = (decoded as any)?.userId;
    const userId = Number(userIdRaw);
    if (!Number.isFinite(userId)) {
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      );
    }

    // Check user role for authorization
    const user = await prisma.user.findUnique({
      where: { userId },
      select: { role: true, status: true }
    });

    if (!user || user.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'User not found or inactive' },
        { status: 404 }
      );
    }

    // Only allow SUPER_ADMIN, ADMIN, DEPARTMENT_HEAD, and INSTRUCTOR roles
    const allowedRoles = ['SUPER_ADMIN', 'ADMIN', 'DEPARTMENT_HEAD', 'INSTRUCTOR'];
    if (!allowedRoles.includes(user.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get('page') || '1'));
    const pageSize = Math.min(100, Math.max(1, Number(searchParams.get('pageSize') || '50')));
    const search = searchParams.get('search') || '';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');

    // Build where clause
    const where: any = {};
    
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    if (status && status !== 'all') {
      where.status = status.toUpperCase();
    }

    if (priority && priority !== 'all') {
      where.priority = priority.toUpperCase();
    }

    // Fetch announcements with pagination
    const [announcements, total] = await Promise.all([
      prisma.announcement.findMany({
        where,
        include: {
          admin: {
            select: {
              userName: true,
              email: true
            }
          },
          instructor: {
            select: {
              firstName: true,
              lastName: true,
              email: true
            }
          },
          section: {
            select: {
              sectionName: true
            }
          },
          subject: {
            select: {
              subjectName: true,
              subjectCode: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip: (page - 1) * pageSize,
        take: pageSize
      }),
      prisma.announcement.count({ where })
    ]);

    // Transform data for frontend
    const data = announcements.map(announcement => ({
      id: announcement.announcementId.toString(),
      type: 'Announcement',
      title: announcement.title,
      sender: announcement.instructor 
        ? `${announcement.instructor.firstName} ${announcement.instructor.lastName}` 
        : (announcement.admin?.userName || announcement.admin?.email || 'System'),
      recipients: announcement.isGeneral 
        ? 'All Users' 
        : (announcement.sectionId 
            ? `Section: ${announcement.section?.sectionName || 'Unknown'}` 
            : (announcement.subjectId 
                ? `Subject: ${announcement.subject?.subjectName || 'Unknown'}` 
                : 'Targeted Users')),
      date: announcement.createdAt.toISOString().split('T')[0],
      status: announcement.status === 'ACTIVE' ? 'Sent' : 'Draft',
      priority: announcement.priority,
      userType: announcement.userType,
      readCount: Math.floor(Math.random() * 200) + 50, // Mock read count
      createdAt: announcement.createdAt.toISOString(),
      updatedAt: announcement.updatedAt.toISOString()
    }));

    return NextResponse.json({
      success: true,
      data,
      meta: {
        count: data.length,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Communication logs API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch communication logs',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
