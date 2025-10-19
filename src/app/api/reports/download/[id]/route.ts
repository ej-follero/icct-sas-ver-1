import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { readFile } from 'fs/promises';
import { join } from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Auth: require valid JWT and allowed roles
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = Number((decoded as any)?.userId);
    if (!Number.isFinite(userId)) {
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      );
    }

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
    const allowedRoles = ['SUPER_ADMIN', 'ADMIN', 'DEPARTMENT_HEAD', 'INSTRUCTOR'];
    if (!allowedRoles.includes(user.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const { id: reportIdParam } = await params;
    if (!reportIdParam) {
      return NextResponse.json(
        { error: 'Report ID is required' },
        { status: 400 }
      );
    }
    const reportIdNum = Number(reportIdParam);
    if (!Number.isFinite(reportIdNum)) {
      return NextResponse.json(
        { error: 'Invalid report ID' },
        { status: 400 }
      );
    }

    // Get report details from database
    const report = await prisma.reportLog.findUnique({
      where: {
        reportId: reportIdNum
      }
    });

    if (!report) {
      return NextResponse.json(
        { error: 'Report not found' },
        { status: 404 }
      );
    }

    if (!report.filepath) {
      return NextResponse.json(
        { error: 'File not available for download' },
        { status: 404 }
      );
    }

    try {
      // Read the file from the file system (filepath is relative to /public)
      const filePath = join(process.cwd(), 'public', report.filepath);
      const fileBuffer = await readFile(filePath);

      // Determine content type based on file extension
      const contentType = getContentType((report.fileFormat || 'pdf').toString());

      // Return the file with appropriate headers (convert Buffer to Uint8Array)
      return new Response(new Uint8Array(fileBuffer), {
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': `attachment; filename="${report.reportName || 'report'}.${(report.fileFormat || 'pdf').toString()}"`,
          'Content-Length': fileBuffer.length.toString(),
        },
      });
    } catch (fileError) {
      console.error('File read error:', fileError);
      return NextResponse.json(
        { error: 'File not found on server' },
        { status: 404 }
      );
    }

  } catch (error) {
    console.error('Download report error:', error);
    return NextResponse.json(
      {
        error: 'Failed to download report',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

function getContentType(format: string): string {
  switch (format.toLowerCase()) {
    case 'pdf':
      return 'application/pdf';
    case 'csv':
      return 'text/csv';
    case 'xlsx':
    case 'excel':
      return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    default:
      return 'application/octet-stream';
  }
}
