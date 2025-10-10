import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Auth: require valid JWT and allowed roles (SUPER_ADMIN, ADMIN, DEPARTMENT_HEAD, INSTRUCTOR)
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = Number((decoded as any)?.userId);
    if (!Number.isFinite(userId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid authentication token' },
        { status: 401 }
      );
    }
    const user = await prisma.user.findUnique({ where: { userId }, select: { role: true, status: true } });
    if (!user || user.status !== 'ACTIVE') {
      return NextResponse.json(
        { success: false, error: 'User not found or inactive' },
        { status: 404 }
      );
    }
    const allowedRoles = ['SUPER_ADMIN', 'ADMIN', 'DEPARTMENT_HEAD', 'INSTRUCTOR'];
    if (!allowedRoles.includes(user.role)) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'csv';
    const type = searchParams.get('type') || 'all'; // all, scans, stats, charts
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const statusFilter = searchParams.get('status')?.split(',').filter(Boolean);
    const locationFilter = searchParams.get('location')?.split(',').filter(Boolean);
    const readerIdFilter = searchParams.get('readerId');
    const tagIdFilter = searchParams.get('tagId');

    const logWhere: any = {};
    if (from) logWhere.timestamp = { gte: new Date(from) };
    if (to) logWhere.timestamp = { ...(logWhere.timestamp || {}), lte: new Date(to) };
    if (statusFilter && statusFilter.length > 0) logWhere.scanStatus = { in: statusFilter };
    if (locationFilter && locationFilter.length > 0) logWhere.location = { in: locationFilter };
    if (readerIdFilter) {
      const rid = Number(readerIdFilter);
      if (Number.isFinite(rid)) logWhere.readerId = rid;
    }
    if (tagIdFilter) logWhere.rfidTag = tagIdFilter;

    let data: any;
    let filename: string;

    switch (type) {
      case 'scans':
        data = await getScansData(logWhere);
        filename = `rfid-scans-${new Date().toISOString().split('T')[0]}`;
        break;
      case 'stats':
        data = await getStatsData();
        filename = `rfid-stats-${new Date().toISOString().split('T')[0]}`;
        break;
      case 'charts':
        data = await getChartsData();
        filename = `rfid-charts-${new Date().toISOString().split('T')[0]}`;
        break;
      default:
        data = await getAllData();
        filename = `rfid-dashboard-${new Date().toISOString().split('T')[0]}`;
    }

    if (format === 'csv') {
      const csvContent = convertToCSV(data);
      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${filename}.csv"`,
        },
      });
    } else if (format === 'excel') {
      // For Excel, we'll return JSON that can be processed by a library like xlsx
      return NextResponse.json(data, {
        headers: {
          'Content-Disposition': `attachment; filename="${filename}.json"`,
        },
      });
    }

    return NextResponse.json({ error: 'Unsupported format' }, { status: 400 });
  } catch (error) {
    console.error('Error exporting RFID data:', error);
    return NextResponse.json(
      { error: 'Failed to export data' },
      { status: 500 }
    );
  }
}

async function getScansData(where?: any) {
  const scans = await prisma.rFIDLogs.findMany({
    take: 1000, // Limit to prevent memory issues
    orderBy: { timestamp: 'desc' },
    where,
    include: {
      reader: true,
      user: true
    }
  });

  return scans.map((scan: any) => ({
    'Scan ID': scan.logsId,
    'Reader ID': scan.readerId,
    'Reader Name': scan.reader?.deviceName || 'Unknown',
    'Tag ID': scan.rfidTag,
    'Student Name': scan.user ? `${scan.user.firstName} ${scan.user.lastName}` : 'Unknown',
    'Status': scan.scanStatus,
    'Location': scan.location || 'Unknown',
    'Timestamp': scan.timestamp.toISOString(),
  }));
}

async function getStatsData() {
  const [
    totalReaders,
    activeReaders,
    totalTags,
    activeTags,
    totalScans,
    todayScans,
    weeklyScans,
    monthlyScans
  ] = await Promise.all([
    prisma.rFIDReader.count(),
    prisma.rFIDReader.count({ where: { status: 'ACTIVE' } }),
    prisma.rFIDTags.count(),
    prisma.rFIDTags.count({ where: { status: 'ACTIVE' } }),
    prisma.rFIDLogs.count(),
    prisma.rFIDLogs.count({
      where: {
        timestamp: {
          gte: new Date(new Date().setHours(0, 0, 0, 0))
        }
      }
    }),
    prisma.rFIDLogs.count({
      where: {
        timestamp: {
          gte: new Date(new Date().setDate(new Date().getDate() - 7))
        }
      }
    }),
    prisma.rFIDLogs.count({
      where: {
        timestamp: {
          gte: new Date(new Date().setDate(new Date().getDate() - 30))
        }
      }
    })
  ]);

  return [{
    'Metric': 'Total Readers',
    'Value': totalReaders,
    'Description': 'Total number of RFID readers in system'
  }, {
    'Metric': 'Active Readers',
    'Value': activeReaders,
    'Description': 'Number of currently active readers'
  }, {
    'Metric': 'Total Tags',
    'Value': totalTags,
    'Description': 'Total number of RFID tags in system'
  }, {
    'Metric': 'Active Tags',
    'Value': activeTags,
    'Description': 'Number of currently active tags'
  }, {
    'Metric': 'Total Scans',
    'Value': totalScans,
    'Description': 'Total number of scans recorded'
  }, {
    'Metric': 'Today\'s Scans',
    'Value': todayScans,
    'Description': 'Number of scans recorded today'
  }, {
    'Metric': 'Weekly Scans',
    'Value': weeklyScans,
    'Description': 'Number of scans recorded in the last 7 days'
  }, {
    'Metric': 'Monthly Scans',
    'Value': monthlyScans,
    'Description': 'Number of scans recorded in the last 30 days'
  }];
}

async function getChartsData() {
  const [readerStatus, tagStatus, locationActivity] = await Promise.all([
    prisma.rFIDReader.groupBy({
      by: ['status'],
      _count: { status: true }
    }),
    prisma.rFIDTags.groupBy({
      by: ['status'],
      _count: { status: true }
    }),
    prisma.rFIDLogs.groupBy({
      by: ['location'],
      _count: { location: true },
      orderBy: { _count: { location: 'desc' } },
      take: 10
    })
  ]);

  return {
    'Reader Status': readerStatus.map((item: any) => ({
      'Status': item.status,
      'Count': item._count.status
    })),
    'Tag Status': tagStatus.map((item: any) => ({
      'Status': item.status,
      'Count': item._count.status
    })),
    'Location Activity': locationActivity.map((item: any) => ({
      'Location': item.location || 'Unknown',
      'Scan Count': item._count.location
    }))
  };
}

async function getAllData() {
  const [scans, stats, charts] = await Promise.all([
    getScansData(),
    getStatsData(),
    getChartsData()
  ]);

  return {
    'Scans Data': scans,
    'Statistics': stats,
    'Chart Data': charts
  };
}

function convertToCSV(data: any): string {
  if (Array.isArray(data)) {
    if (data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          // Escape commas and quotes in CSV
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        }).join(',')
      )
    ];
    
    return csvRows.join('\n');
  } else if (typeof data === 'object') {
    // Handle nested objects by flattening them
    const flattened: any[] = [];
    
    Object.entries(data).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach((item, index) => {
          flattened.push({
            'Category': key,
            'Index': index + 1,
            ...item
          });
        });
      }
    });
    
    return convertToCSV(flattened);
  }
  
  return '';
}
