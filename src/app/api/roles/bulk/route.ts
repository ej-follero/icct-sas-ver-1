import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    // JWT Authentication
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = Number((decoded as any)?.userId);
    if (!Number.isFinite(userId)) {
      return NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 });
    }

    // Check user exists and is active
    const user = await prisma.user.findUnique({
      where: { userId },
      select: { status: true, role: true }
    });

    if (!user || user.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'User not found or inactive' }, { status: 401 });
    }

    // Admin-only access control
    const adminRoles = ['SUPER_ADMIN', 'ADMIN'];
    if (!adminRoles.includes(user.role)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { data: rolesData } = await request.json();
    
    if (!Array.isArray(rolesData) || rolesData.length === 0) {
      return NextResponse.json({ 
        error: "Invalid data format. Expected array of roles." 
      }, { status: 400 });
    }

    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
      createdRoles: [] as any[]
    };

    // Process each role
    for (let i = 0; i < rolesData.length; i++) {
      const roleData = rolesData[i];
      
      try {
        // Validate required fields
        if (!roleData.roleName || !roleData.rolePermissions || !Array.isArray(roleData.rolePermissions)) {
          results.failed++;
          results.errors.push(`Row ${i + 1}: Missing required fields (roleName, rolePermissions)`);
          continue;
        }

        // Check if role name already exists
        const existingRole = await prisma.roleManagement.findFirst({
          where: { 
            name: { 
              equals: roleData.roleName, 
              mode: "insensitive" 
            } 
          }
        });

        if (existingRole) {
          results.failed++;
          results.errors.push(`Row ${i + 1}: Role name "${roleData.roleName}" already exists`);
          continue;
        }

        // Create the role
        const newRole = await prisma.roleManagement.create({
          data: {
            name: roleData.roleName.trim(),
            description: roleData.roleDescription?.trim() || null,
            permissions: roleData.rolePermissions,
            status: roleData.roleStatus || 'ACTIVE',
          },
          include: {
            _count: {
              select: {
                users: true
              }
            }
          }
        });

        // Transform the created role
        const transformedRole = {
          id: newRole.id.toString(),
          name: newRole.name,
          description: newRole.description || '',
          permissions: Array.isArray(newRole.permissions) ? newRole.permissions : [],
          status: newRole.status,
          totalUsers: newRole._count.users,
          createdAt: newRole.createdAt.toISOString(),
          updatedAt: newRole.updatedAt.toISOString()
        };

        results.success++;
        results.createdRoles.push(transformedRole);

      } catch (error: any) {
        results.failed++;
        const errorMessage = error.code === 'P2002' 
          ? `Row ${i + 1}: Role name "${roleData.roleName}" already exists`
          : `Row ${i + 1}: ${error.message || 'Unknown error'}`;
        results.errors.push(errorMessage);
      }
    }

    return NextResponse.json({ results });
  } catch (error: any) {
    console.error('Error bulk importing roles:', error);
    
    return NextResponse.json({ 
      error: error.message || "Failed to bulk import roles" 
    }, { status: 500 });
  }
}