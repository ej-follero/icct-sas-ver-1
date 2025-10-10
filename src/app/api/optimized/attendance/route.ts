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
    const toStatus = (v: string | null) => {
      if (!v) return undefined;
      const upper = v.toUpperCase();
      const allowed = new Set(['PRESENT', 'ABSENT', 'LATE', 'EXCUSED']);
      return allowed.has(upper) ? upper : undefined;
    };

    const options = {
      studentId: toInt(searchParams.get('studentId')),
      sectionId: toInt(searchParams.get('sectionId')),
      startDate: toDate(searchParams.get('startDate')),
      endDate: toDate(searchParams.get('endDate'), true),
      status: toStatus(searchParams.get('status')),
      limit: (() => { const n = toInt(searchParams.get('limit')); return n && n > 0 ? n : 100; })(),
      offset: (() => { const n = toInt(searchParams.get('offset')); return n && n >= 0 ? n : 0; })(),
    } as const;

    const noCache = searchParams.get('noCache') === '1' || searchParams.get('noCache') === 'true';
    const cacheOptions = {
      useCache: !noCache && searchParams.get('useCache') !== 'false',
      cacheTTL: (() => { const n = toInt(searchParams.get('cacheTTL')); return n && n > 0 ? n : 300; })(),
    } as const;

    const attendance = await optimizedApiService.getAttendance(options, cacheOptions);
    
    // Get cache stats for debugging
    const cacheStats = await cacheService.getStats();

    const optionsOut = {
      studentId: options.studentId ?? null,
      sectionId: options.sectionId ?? null,
      startDate: options.startDate ? options.startDate.toISOString() : null,
      endDate: options.endDate ? options.endDate.toISOString() : null,
      status: options.status ?? null,
      limit: options.limit,
      offset: options.offset,
    };

    const count = Array.isArray(attendance) ? attendance.length : 0;

    return NextResponse.json({
      success: true,
      data: attendance,
      meta: {
        count,
        cache: cacheStats,
        options: optionsOut,
      },
    });

  } catch (error) {
    console.error('Optimized attendance API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch attendance',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
