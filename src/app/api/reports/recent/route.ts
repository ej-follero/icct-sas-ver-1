import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const days = parseInt(searchParams.get('days') || '7');

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const recent = await prisma.reportLog.findMany({
      where: {
        createdAt: { gte: startDate }
      },
      include: {
        user: {
          select: { userName: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    });

    const formatted = recent.map(r => ({
      id: r.reportId,
      name: r.reportName,
      type: r.reportType,
      format: (r.fileFormat || 'pdf').toUpperCase(),
      status: r.status,
      date: r.createdAt.toISOString().split('T')[0],
      generatedBy: r.user?.userName || r.user?.email || 'System',
      fileSize: r.fileSize ? `${Math.round(r.fileSize / 1024)} KB` : 'N/A',
      downloadUrl: r.filepath ? `/api/reports/download/${r.reportId}` : null
    }));

    return NextResponse.json({
      success: true,
      data: formatted,
      meta: {
        count: formatted.length,
        days,
        limit,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Recent reports API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch recent reports',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// POST - Create a new report log entry
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      reportName,
      reportType,
      exportFormat,
      filePath,
      fileSize,
      userId
    } = body || {};

    const created = await prisma.reportLog.create({
      data: {
        generatedBy: Number(userId) || 1,
        reportType: (reportType || 'CUSTOM') as any,
        reportName: reportName || 'Report',
        startDate: new Date(),
        endDate: new Date(),
        status: 'COMPLETED' as any,
        filepath: filePath,
        fileSize: Number(fileSize) || 0,
        fileFormat: (exportFormat || 'pdf') as any,
        parameters: null as any,
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        id: created.reportId,
        name: created.reportName,
        type: created.reportType,
        format: (created.fileFormat || 'pdf').toUpperCase(),
        status: created.status,
        date: created.createdAt.toISOString().split('T')[0],
        downloadUrl: created.filepath ? `/api/reports/download/${created.reportId}` : null
      }
    });

  } catch (error) {
    console.error('Create report log error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create report log',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
