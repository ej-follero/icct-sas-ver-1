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
    const hours = parseInt(searchParams.get('hours') || '24');

    const metrics = await comprehensiveAuditService.getAuditMetrics(hours);

    return NextResponse.json({
      success: true,
      data: metrics,
    });

  } catch (error) {
    console.error('Audit metrics API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch audit metrics',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
