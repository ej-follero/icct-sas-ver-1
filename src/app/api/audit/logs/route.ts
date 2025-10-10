import { NextRequest, NextResponse } from 'next/server';
import { comprehensiveAuditService } from '@/lib/services/comprehensive-audit.service';
import { EnhancedAccessControl } from '@/lib/middleware/enhanced-access-control';

export async function GET(request: NextRequest) {
  try {
    // Check access control
    const userContext = EnhancedAccessControl.extractUserContext(request);
    if (!userContext) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const accessCheck = await EnhancedAccessControl.checkAccess(request, userContext);
    if (!accessCheck.allowed) {
      return EnhancedAccessControl.createAccessDeniedResponse(
        accessCheck.reason || 'Access denied',
        accessCheck.requiredRole,
        accessCheck.requiredPermission
      );
    }

    const { searchParams } = new URL(request.url);
    
    const options = {
      startDate: searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined,
      endDate: searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined,
      userId: searchParams.get('userId') ? parseInt(searchParams.get('userId')!) : undefined,
      category: searchParams.get('category') || undefined,
      severity: searchParams.get('severity') || undefined,
      action: searchParams.get('action') || undefined,
      resource: searchParams.get('resource') || undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 100,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0,
    };

    const auditLogs = await comprehensiveAuditService.getAuditLogs(options);

    return NextResponse.json({
      success: true,
      data: auditLogs.logs,
      meta: {
        total: auditLogs.total,
        hasMore: auditLogs.hasMore,
        limit: options.limit,
        offset: options.offset,
      },
    });

  } catch (error) {
    console.error('Audit logs API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch audit logs',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
