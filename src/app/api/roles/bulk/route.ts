import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface ImportRoleData {
  roleName: string;
  roleDescription?: string;
  rolePermissions: string[] | string;
  roleStatus: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { data }: { data: ImportRoleData[] } = body;

    if (!data || !Array.isArray(data) || data.length === 0) {
      return NextResponse.json(
        { error: 'No data provided or invalid data format' },
        { status: 400 }
      );
    }

    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
      createdRoles: [] as any[]
    };

    // Process each role
    for (let i = 0; i < data.length; i++) {
      const roleData = data[i];
      
      try {
        // Validate required fields
        if (!roleData.roleName || roleData.roleName.trim() === '') {
          results.errors.push(`Row ${i + 1}: Role name is required`);
          results.failed++;
          continue;
        }

        // Handle rolePermissions - could be string or array
        let permissions: string[] = [];
        if (roleData.rolePermissions) {
          if (typeof roleData.rolePermissions === 'string') {
            // Handle comma-separated string or JSON string
            try {
              const parsed = JSON.parse(roleData.rolePermissions);
              if (Array.isArray(parsed)) {
                permissions = parsed;
              } else {
                permissions = roleData.rolePermissions.split(',').map(p => p.trim()).filter(p => p);
              }
            } catch {
              // If JSON parsing fails, treat as comma-separated string
              permissions = roleData.rolePermissions.split(',').map(p => p.trim()).filter(p => p);
            }
          } else if (Array.isArray(roleData.rolePermissions)) {
            permissions = roleData.rolePermissions;
          }
        }

        if (permissions.length === 0) {
          results.errors.push(`Row ${i + 1}: At least one permission is required`);
          results.failed++;
          continue;
        }

        // Check if role name already exists
        const existingRole = await prisma.roleManagement.findFirst({
          where: {
            name: roleData.roleName.trim()
          }
        });

        if (existingRole) {
          results.errors.push(`Row ${i + 1}: Role name "${roleData.roleName}" already exists`);
          results.failed++;
          continue;
        }

        // Create the role
        const newRole = await prisma.roleManagement.create({
          data: {
            name: roleData.roleName.trim(),
            description: roleData.roleDescription?.trim() || '',
            permissions: permissions,
            status: roleData.roleStatus || 'ACTIVE',
            totalUsers: 0
          }
        });

        // Format the response
        const formattedRole = {
          id: newRole.id.toString(),
          name: newRole.name,
          description: newRole.description || '',
          permissions: newRole.permissions as string[],
          status: newRole.status,
          totalUsers: newRole.totalUsers,
          createdAt: newRole.createdAt.toISOString(),
          updatedAt: newRole.updatedAt.toISOString(),
        };

        results.createdRoles.push(formattedRole);
        results.success++;

      } catch (error) {
        console.error(`Error processing role ${i + 1}:`, error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        results.errors.push(`Row ${i + 1}: ${errorMessage}`);
        results.failed++;
      }
    }

    return NextResponse.json({
      message: `Import completed: ${results.success} roles created, ${results.failed} failed`,
      results
    });

  } catch (error) {
    console.error('Bulk import error:', error);
    return NextResponse.json(
      { error: 'Failed to process bulk import' },
      { status: 500 }
    );
  }
} 