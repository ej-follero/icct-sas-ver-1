import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const startTime = Date.now();
  
  try {
    console.log('🔍 [HEALTH/DB] Starting database health check');
    
    // Test basic database connection
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ [HEALTH/DB] Basic connection test passed');
    
    // Test a simple query to ensure tables are accessible
    const userCount = await prisma.user.count();
    console.log('✅ [HEALTH/DB] User table accessible, count:', userCount);
    
    // Test a more complex query to ensure relations work
    const activeUsers = await prisma.user.findMany({
      where: { status: 'ACTIVE' },
      take: 1,
      select: { userId: true, email: true }
    });
    console.log('✅ [HEALTH/DB] Complex query test passed');
    
    const responseTime = Date.now() - startTime;
    console.log(`✅ [HEALTH/DB] Health check completed in ${responseTime}ms`);
    
    return NextResponse.json({
      status: 'healthy',
      database: 'connected',
      responseTime: `${responseTime}ms`,
      userCount,
      activeUsers: activeUsers.length,
      timestamp: new Date().toISOString()
    });
    
  } catch (error: any) {
    const responseTime = Date.now() - startTime;
    console.error(`❌ [HEALTH/DB] Health check failed after ${responseTime}ms:`, error);
    
    return NextResponse.json({
      status: 'unhealthy',
      database: 'disconnected',
      responseTime: `${responseTime}ms`,
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 503 });
  }
}
