import { NextResponse } from 'next/server';

export async function GET() {
  const startTime = Date.now();
  
  try {
    // Simple health check without database access
    const response = {
      status: 'ok',
      message: 'pong',
      timestamp: new Date().toISOString(),
      // Avoid Node-specific APIs for edge/runtime compatibility
      uptimeMs: undefined as number | undefined,
      memory: undefined as { rssMB: number; heapUsedMB: number } | undefined,
      responseTime: 0
    };
    
    response.responseTime = Date.now() - startTime;
    // Best-effort Node metrics when available
    try {
      // @ts-ignore
      if (typeof process !== 'undefined' && process?.uptime) {
        // @ts-ignore
        response.uptimeMs = Math.round(process.uptime() * 1000);
      }
      // @ts-ignore
      if (typeof process !== 'undefined' && process?.memoryUsage) {
        // @ts-ignore
        const m = process.memoryUsage();
        response.memory = { rssMB: Math.round((m.rss || 0) / 1024 / 1024), heapUsedMB: Math.round((m.heapUsed || 0) / 1024 / 1024) };
      }
    } catch {}
    
    const res = NextResponse.json(response);
    res.headers.set('Cache-Control', 'no-store');
    res.headers.set('X-Ping', 'pong');
    return res;
  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    return NextResponse.json(
      {
        status: 'error',
        message: 'ping failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        responseTime
      },
      { status: 500 }
    );
  }
} 