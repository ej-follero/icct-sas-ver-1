import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/backup/logs - Get backup logs with filtering and pagination
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const backupId = searchParams.get('backupId');
    const action = searchParams.get('action');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build where clause
    const where: any = {};

    if (backupId) {
      where.backupId = parseInt(backupId);
    }

    if (action) {
      where.action = action;
    }

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { message: { contains: search, mode: 'insensitive' } },
        { action: { contains: search, mode: 'insensitive' } },
        { status: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    // Get logs with pagination
    const [logs, totalCount] = await Promise.all([
      prisma.backupLog.findMany({
        where,
        include: {
          backup: {
            select: {
              id: true,
              name: true,
              type: true,
              status: true,
            },
          },
          createdByUser: {
            select: {
              userId: true,
              userName: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.backupLog.count({ where }),
    ]);

    // Format logs for response
    const formattedLogs = logs.map(log => ({
      id: log.id.toString(),
      backupId: log.backupId?.toString(),
      backupName: log.backup?.name,
      backupType: log.backup?.type,
      backupStatus: log.backup?.status,
      action: log.action,
      status: log.status,
      message: log.message,
      details: log.details,
      createdBy: log.createdByUser?.userName || 'Unknown User',
      createdAt: log.createdAt.toISOString(),
    }));

    // Get summary statistics
    const stats = await prisma.backupLog.groupBy({
      by: ['status'],
      where: backupId ? { backupId: parseInt(backupId) } : {},
      _count: {
        status: true,
      },
    });

    const statusCounts = stats.reduce((acc, stat) => {
      acc[stat.status] = stat._count.status;
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json({
      success: true,
      data: {
        logs: formattedLogs,
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages: Math.ceil(totalCount / limit),
        },
        stats: {
          total: totalCount,
          byStatus: statusCounts,
        },
      },
    });

  } catch (error) {
    console.error("Error fetching backup logs:", error);
    return NextResponse.json(
      { 
        error: "Failed to fetch backup logs",
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    );
  }
}

// POST /api/backup/logs - Create a new log entry
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { backupId, action, status, message, details, createdBy } = body;

    if (!action || !status || !createdBy) {
      return NextResponse.json(
        { error: "Missing required fields: action, status, createdBy" },
        { status: 400 }
      );
    }

    const newLog = await prisma.backupLog.create({
      data: {
        backupId: backupId ? parseInt(backupId) : null,
        action,
        status,
        message,
        details,
        createdBy: parseInt(createdBy),
      },
      include: {
        backup: {
          select: {
            id: true,
            name: true,
            type: true,
            status: true,
          },
        },
        createdByUser: {
          select: {
            userId: true,
            userName: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Log entry created successfully",
      data: {
        id: newLog.id.toString(),
        backupId: newLog.backupId?.toString(),
        backupName: newLog.backup?.name,
        action: newLog.action,
        status: newLog.status,
        message: newLog.message,
        details: newLog.details,
        createdBy: newLog.createdByUser?.userName || 'Unknown User',
        createdAt: newLog.createdAt.toISOString(),
      },
    });

  } catch (error) {
    console.error("Error creating backup log:", error);
    return NextResponse.json(
      { 
        error: "Failed to create backup log",
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    );
  }
} 