import { NextRequest, NextResponse } from 'next/server';
import { performanceMonitor } from '@/lib/services/performance-monitor.service';

async function assertAdmin(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const isDev = process.env.NODE_ENV !== 'production';
  if (!token) return isDev ? { ok: true } as const : { ok: false, res: NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 }) };
  try {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const role = decoded.role as string | undefined;
    if (!role || (role !== 'SUPER_ADMIN' && role !== 'ADMIN')) {
      return { ok: false, res: NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 }) };
    }
    return { ok: true } as const;
  } catch {
    return { ok: false, res: NextResponse.json({ success: false, error: 'Invalid authentication token' }, { status: 401 }) };
  }
}

export async function GET(request: NextRequest) {
  try {
    const gate = await assertAdmin(request);
    if (!('ok' in gate) || gate.ok !== true) return gate.res;
    const { searchParams } = new URL(request.url);
    const toInt = (v: string | null) => {
      if (!v) return undefined;
      const n = Number(v);
      return Number.isFinite(n) ? n : undefined;
    };
    const hoursParam = toInt(searchParams.get('hours'));
    const hours = Math.min(Math.max(hoursParam ?? 24, 1), 168);
    const includeAlerts = (searchParams.get('includeAlerts') || '').toLowerCase() === 'true';
    const includeRecommendations = (searchParams.get('includeRecommendations') || '').toLowerCase() === 'true';

    const currentMetrics = await performanceMonitor.getCurrentMetrics();
    const trends = performanceMonitor.getPerformanceTrends(hours);
    const querySummary = performanceMonitor.getQueryPerformanceSummary();
    const slowQueries = performanceMonitor.getSlowQueries();

    const response: any = {
      success: true,
      data: {
        current: currentMetrics,
        trends,
        queries: {
          summary: querySummary,
          slowQueries,
        },
      },
      meta: {
        hours,
        includeAlerts,
        includeRecommendations,
        generatedAt: new Date().toISOString(),
      }
    };

    if (includeAlerts) {
      response.data.alerts = performanceMonitor.getPerformanceAlerts();
    }

    if (includeRecommendations) {
      response.data.recommendations = performanceMonitor.getPerformanceRecommendations();
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error('Performance monitor API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch performance metrics',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const gate = await assertAdmin(request);
    if (!('ok' in gate) || gate.ok !== true) return gate.res;
    const body = await request.json();
    const { action, data } = body;

    switch (action) {
      case 'record_metric':
        if (data) performanceMonitor.recordMetric(data);
        break;
      
      case 'record_query':
        if (data?.query && Number.isFinite(Number(data?.executionTime))) {
          performanceMonitor.recordQuery(data.query, Number(data.executionTime));
        }
        break;
      
      case 'clear_metrics':
        performanceMonitor.clearMetrics();
        break;
      
      default:
        return NextResponse.json(
          { success: false, error: 'Unknown action' },
          { status: 400 }
        );
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Performance monitor POST error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to process performance data',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
