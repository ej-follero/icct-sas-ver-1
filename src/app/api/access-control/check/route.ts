import { NextRequest, NextResponse } from 'next/server';
import { canAccessPath, getAccessLevel } from '@/lib/middleware/access-control';

export async function POST(request: NextRequest) {
  try {
    const { path } = await request.json();
    
    // Get token from cookies
    const token = request.cookies.get('token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { 
          error: 'Authentication required',
          access: false,
          level: 'DENIED'
        },
        { status: 401 }
      );
    }

    // Verify JWT token (align with other routes)
    const jwt = require('jsonwebtoken');
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return NextResponse.json(
        {
          error: 'Server configuration error',
          access: false,
          level: 'DENIED'
        },
        { status: 500 }
      );
    }
    const decoded = jwt.verify(token, secret);
    const userRole = decoded.role;
    
    // Check access
    const hasAccess = canAccessPath(userRole, path);
    const accessLevel = getAccessLevel(userRole, path);
    
    return NextResponse.json({
      access: hasAccess,
      level: accessLevel,
      role: userRole,
      path: path,
      message: hasAccess 
        ? `Access granted for ${userRole}` 
        : `Access denied for ${userRole}`
    });

  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Invalid token',
        access: false,
        level: 'DENIED'
      },
      { status: 401 }
    );
  }
}
