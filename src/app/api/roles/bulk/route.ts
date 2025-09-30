import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    // Authorization: allow ADMIN and SUPER_ADMIN
    const role = request.headers.get('x-user-role');
    const isDev = process.env.NODE_ENV !== 'production';
    
    if (!isDev) {
      if (!role || (role !== 'ADMIN' && role !== 'SUPER_ADMIN')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
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