import { NextRequest, NextResponse } from 'next/server';
import { optimizedApiService } from '@/lib/services/optimized-api.service';
import { cacheService } from '@/lib/services/cache.service';
// Avoid importing Prisma enums in edge runtimes; validate via allowed set

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
    const toStatus = (v: string | null) => {
      if (!v) return undefined;
      const upper = v.toUpperCase();
      const allowed = new Set(['ACTIVE', 'INACTIVE', 'ARCHIVED']);
      return allowed.has(upper) ? upper : undefined;
    };

    const options = {
      departmentId: toInt(searchParams.get('departmentId')),
      courseId: toInt(searchParams.get('courseId')),
      status: toStatus(searchParams.get('status')),
      limit: (() => { const n = toInt(searchParams.get('limit')); return n && n > 0 ? n : 50; })(),
      offset: (() => { const n = toInt(searchParams.get('offset')); return n && n >= 0 ? n : 0; })(),
    } as const;

    const noCache = searchParams.get('noCache') === '1' || searchParams.get('noCache') === 'true';
    const cacheOptions = {
      useCache: !noCache && searchParams.get('useCache') !== 'false',
      cacheTTL: (() => { const n = toInt(searchParams.get('cacheTTL')); return n && n > 0 ? n : 1800; })(),
    } as const;

    const students = await optimizedApiService.getStudents(options, cacheOptions);
    
    // Get cache stats for debugging
    const cacheStats = await cacheService.getStats();

    const count = Array.isArray(students) ? students.length : 0;

    return NextResponse.json({
      success: true,
      data: students,
      meta: {
        count,
        cache: cacheStats,
        options,
      },
    });

  } catch (error) {
    console.error('Optimized students API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch students',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
