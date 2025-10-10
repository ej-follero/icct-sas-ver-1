import { NextRequest, NextResponse } from 'next/server';
import { comprehensiveAuditService } from '@/lib/services/comprehensive-audit.service';
import { EnhancedAccessControl } from '@/lib/middleware/enhanced-access-control';

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { startDate, endDate, format, userId, category } = body;

    const exportData = await comprehensiveAuditService.exportAuditLogs({
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      format: format || 'CSV',
      userId,
      category,
    });

    // Log the export action
    await comprehensiveAuditService.logDataAccess(
      userContext.userId,
      userContext.email,
      'AUDIT_LOGS',
      'EXPORT',
      undefined,
      {
        format,
        startDate,
        endDate,
        userId,
        category,
      },
      userContext.ipAddress,
      userContext.userAgent
    );

    return new NextResponse(exportData, {
      headers: {
        'Content-Type': format === 'CSV' ? 'text/csv' : 'application/json',
        'Content-Disposition': `attachment; filename="audit-logs-${new Date().toISOString().split('T')[0]}.${format.toLowerCase()}"`,
      },
    });

  } catch (error) {
    console.error('Audit export API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to export audit logs',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
