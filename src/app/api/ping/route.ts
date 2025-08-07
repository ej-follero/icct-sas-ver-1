import { NextResponse } from 'next/server';

export async function GET() {
  const startTime = Date.now();
  
  try {
    // Simple health check without database access
    const response = {
      status: 'ok',
      message: 'pong',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      responseTime: 0
    };
    
    response.responseTime = Date.now() - startTime;
    
    return NextResponse.json(response);
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