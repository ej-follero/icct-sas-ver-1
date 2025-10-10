import { NextRequest, NextResponse } from 'next/server';
import { securityAuditService } from '@/lib/services/security-audit.service';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // JWT Authentication - Admin only
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

    // Check user exists and is active
    const user = await prisma.user.findUnique({
      where: { userId },
      select: { status: true, role: true }
    });

    if (!user || user.status !== 'ACTIVE') {
      return NextResponse.json(
        { success: false, error: 'User not found or inactive' },
        { status: 401 }
      );
    }

    // Admin-only access control
    const adminRoles = ['SUPER_ADMIN', 'ADMIN'];
    if (!adminRoles.includes(user.role)) {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const hours = parseInt(searchParams.get('hours') || '24');
    const includeAlerts = searchParams.get('includeAlerts') === 'true';
    const includeEvents = searchParams.get('includeEvents') === 'true';

    const dashboard = await securityAuditService.getSecurityDashboard();
    
    const response: any = {
      success: true,
      data: {
        metrics: dashboard.metrics,
        securityScore: dashboard.metrics.securityScore,
        totalEvents: dashboard.metrics.totalEvents,
        activeAlerts: dashboard.activeAlerts.length,
        recentEvents: includeEvents ? dashboard.recentEvents : [],
        alerts: includeAlerts ? dashboard.activeAlerts : [],
        trends: dashboard.securityTrends,
      },
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Security monitor API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch security data',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // JWT Authentication - Admin only
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

    // Check user exists and is active
    const user = await prisma.user.findUnique({
      where: { userId },
      select: { status: true, role: true }
    });

    if (!user || user.status !== 'ACTIVE') {
      return NextResponse.json(
        { success: false, error: 'User not found or inactive' },
        { status: 401 }
      );
    }

    // Admin-only access control
    const adminRoles = ['SUPER_ADMIN', 'ADMIN'];
    if (!adminRoles.includes(user.role)) {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { action, data } = body;

    switch (action) {
      case 'log_event':
        await securityAuditService.logSecurityEvent(data);
        break;
      
      case 'resolve_alert':
        const resolved = await securityAuditService.resolveAlert(data.alertId, userId);
        if (!resolved) {
          return NextResponse.json(
            { success: false, error: 'Failed to resolve alert' },
            { status: 400 }
          );
        }
        break;
      
      case 'create_alert':
        await securityAuditService.createSecurityAlert(data);
        break;
      
      default:
        return NextResponse.json(
          { success: false, error: 'Unknown action' },
          { status: 400 }
        );
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Security monitor POST error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to process security action',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
