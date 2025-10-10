import { NextRequest, NextResponse } from 'next/server';
import { optimizedApiService } from '@/lib/services/optimized-api.service';
import { cacheService } from '@/lib/services/cache.service';

async function assertRole(request: NextRequest, allowed: Array<'SUPER_ADMIN' | 'ADMIN' | 'DEPARTMENT_HEAD' | 'INSTRUCTOR'>) {
  const token = request.cookies.get('token')?.value;
  const isDev = process.env.NODE_ENV !== 'production';
  if (!token) return isDev ? { ok: true, role: 'ADMIN' } as const : { ok: false, res: NextResponse.json({ error: 'Authentication required' }, { status: 401 }) };
  try {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const role = decoded.role as string | undefined;
    if (!role || !allowed.includes(role as any)) {
      return { ok: false, res: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
    }
    return { ok: true, role: role as any } as const;
  } catch {
    return { ok: false, res: NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 }) };
  }
}

export async function GET(request: NextRequest) {
  try {
    const gate = await assertRole(request, ['SUPER_ADMIN', 'ADMIN', 'DEPARTMENT_HEAD', 'INSTRUCTOR']);
    if (!('ok' in gate) || gate.ok !== true) return gate.res;
    const { searchParams } = new URL(request.url);
    
    const allowedTypes = new Set(['attendance_trends', 'department_performance', 'risk_levels', 'late_arrivals']);
    const rawType = (searchParams.get('type') || 'attendance_trends').toLowerCase();
    const type = allowedTypes.has(rawType) ? rawType : 'attendance_trends';

    const toInt = (v: string | null) => {
      if (!v) return undefined;
      const n = Number(v);
      return Number.isFinite(n) ? n : undefined;
    };
    const toDate = (v: string | null, endOfDay = false) => {
      if (!v) return undefined;
      const d = new Date(v);
      if (isNaN(d.getTime())) return undefined;
      if (endOfDay) d.setHours(23, 59, 59, 999);
      return d;
    };

    const filters = {
      studentId: toInt(searchParams.get('studentId')),
      sectionId: toInt(searchParams.get('sectionId')),
      departmentId: toInt(searchParams.get('departmentId')),
      courseId: toInt(searchParams.get('courseId')),
      startDate: toDate(searchParams.get('startDate')),
      endDate: toDate(searchParams.get('endDate'), true),
    } as const;

    const noCache = searchParams.get('noCache') === '1' || searchParams.get('noCache') === 'true';
    const cacheOptions = {
      useCache: !noCache && searchParams.get('useCache') !== 'false',
      cacheTTL: (() => { const ttl = toInt(searchParams.get('cacheTTL')); return ttl && ttl > 0 ? ttl : 1800; })(),
    } as const;

    const analytics = await optimizedApiService.getAnalytics(type, filters, cacheOptions);
    
    // Get cache stats for debugging
    const cacheStats = await cacheService.getStats();

    return NextResponse.json({
      success: true,
      data: analytics,
      meta: {
        type,
        filters,
        cache: cacheStats,
      },
    });

  } catch (error) {
    console.error('Optimized analytics API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch analytics',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
