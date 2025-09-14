import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    console.log('RFID Dashboard API called');
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'daily';
    console.log('Period:', period);

    // Parse filter parameters for analytics charts
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const statusParam = searchParams.get('status'); // comma separated
    const locationParam = searchParams.get('location'); // comma separated
    const readerId = searchParams.get('readerId');
    const tagId = searchParams.get('tagId');

    const logWhere: any = {};
    if (from || to) {
      logWhere.timestamp = {
        ...(from ? { gte: new Date(from) } : {}),
        ...(to ? { lte: new Date(to) } : {})
      };
    }
    if (statusParam) {
      logWhere.scanStatus = { in: statusParam.split(',').map((s) => s.trim()).filter(Boolean) };
    }
    if (locationParam) {
      logWhere.location = { in: locationParam.split(',').map((l) => l.trim()).filter(Boolean) };
    }
    if (readerId) {
      logWhere.readerId = readerId;
    }
    if (tagId) {
      logWhere.rfidTag = tagId;
    }

    console.log('Starting database queries...');
    const startTime = Date.now();
    
    // First, test database connection with a simple query
    try {
      await prisma.$queryRaw`SELECT 1`;
      console.log('Database connection successful');
    } catch (dbError) {
      console.error('Database connection failed:', dbError);
      throw new Error('Database connection failed');
    }
    
    // Fetch all dashboard data in parallel
    const [
      totalReaders,
      activeReaders,
      totalTags,
      activeTags,
      totalScans,
      todayScans,
      weeklyScans,
      monthlyScans,
      recentScans,
      readerStatusData,
      tagActivityData,
      scanTrendsData,
      locationActivityData
    ] = await Promise.all([
      // Reader stats
      prisma.rFIDReader.count(),
      prisma.rFIDReader.count({ where: { status: 'ACTIVE' } }),
      
      // Tag stats
      prisma.rFIDTags.count(),
      prisma.rFIDTags.count({ where: { status: 'ACTIVE' } }),
      
      // Scan stats
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
      }),
      
      // Recent scans (filtered)
      prisma.rFIDLogs.findMany({
        where: logWhere,
        take: 10,
        orderBy: { timestamp: 'desc' },
        include: {
          reader: true,
          user: true
        }
      }),
      
      // Reader status chart data
      prisma.rFIDReader.groupBy({
        by: ['status'],
        _count: { status: true }
      }),
      
      // Tag activity chart data
      prisma.rFIDTags.groupBy({
        by: ['status'],
        _count: { status: true }
      }),
      
      // Scan trends data (filtered)
      getScanTrendsData(period, logWhere),
      
      // Location activity data (filtered)
      prisma.rFIDLogs.groupBy({
        where: logWhere,
        by: ['location'],
        _count: { location: true },
        orderBy: { _count: { location: 'desc' } },
        take: 5
      })
    ]);

    // Transform data for charts
    const readerStatusChart = readerStatusData.map((item: any) => ({
      name: item.status,
      value: item._count.status
    }));

    const tagActivityChart = tagActivityData.map((item: any) => ({
      name: item.status,
      value: item._count.status
    }));

    const locationActivityChart = locationActivityData.map((item: any) => ({
      name: item.location || 'Unknown',
      value: item._count.location
    }));

    // Transform recent scans
    const transformedRecentScans = recentScans.map((scan: any) => ({
      id: scan.logsId,
      readerId: scan.readerId,
      readerName: scan.reader?.deviceName || 'Unknown Reader',
      tagId: scan.rfidTag,
      timestamp: scan.timestamp.toISOString(),
      status: scan.scanStatus,
      location: scan.location || 'Unknown',
      studentName: scan.user ? `${scan.user.firstName} ${scan.user.lastName}` : 'Unknown Student',
      scanType: scan.scanType || 'attendance'
    }));

    const dashboardData = {
      stats: {
        totalReaders,
        activeReaders,
        totalTags,
        activeTags,
        totalScans,
        todayScans,
        weeklyScans,
        monthlyScans
      },
      recentScans: transformedRecentScans,
      readerStatusChart,
      tagActivityChart,
      scanTrendsChart: scanTrendsData,
      locationActivityChart
    };

    const endTime = Date.now();
    console.log(`Dashboard data prepared successfully in ${endTime - startTime}ms`);
    return NextResponse.json(dashboardData);
  } catch (error) {
    console.error('Error fetching RFID dashboard data:', error);
    console.error('Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace'
    });
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

async function getScanTrendsData(period: string, baseWhere: any = {}) {
  const now = new Date();
  let startDate: Date;
  let groupBy: string;

  switch (period) {
    case 'daily':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
      groupBy = 'day';
      break;
    case 'weekly':
      startDate = new Date(now.getTime() - 4 * 7 * 24 * 60 * 60 * 1000); // 4 weeks ago
      groupBy = 'week';
      break;
    case 'monthly':
      startDate = new Date(now.getTime() - 12 * 30 * 24 * 60 * 60 * 1000); // 12 months ago
      groupBy = 'month';
      break;
    default:
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      groupBy = 'day';
  }

  const scans = await prisma.rFIDLogs.findMany({
    where: {
      ...baseWhere,
      timestamp: {
        gte: startDate
      }
    },
    select: {
      timestamp: true
    }
  });

  // Group scans by period
  const groupedScans = new Map<string, number>();
  
  scans.forEach((scan: any) => {
    let key: string;
    const date = new Date(scan.timestamp);
    
    switch (groupBy) {
      case 'day':
        key = date.toISOString().split('T')[0];
        break;
      case 'week':
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split('T')[0];
        break;
      case 'month':
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        break;
      default:
        key = date.toISOString().split('T')[0];
    }
    
    groupedScans.set(key, (groupedScans.get(key) || 0) + 1);
  });

  // Convert to chart data format
  return Array.from(groupedScans.entries()).map(([name, value]) => ({
    name,
    value
  })).sort((a, b) => a.name.localeCompare(b.name));
}
