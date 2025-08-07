import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Map role names to Role enum values
const roleNameToEnumMap: { [key: string]: string } = {
  'Super Admin': 'SUPER_ADMIN',
  'Admin': 'ADMIN',
  'Department Head': 'DEPARTMENT_HEAD',
  'Instructor': 'INSTRUCTOR',
  'Student': 'STUDENT',
  'Parent': 'GUARDIAN',
  'System Auditor': 'SYSTEM_AUDITOR',
};

// GET /api/roles/[id] - Get a specific role
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: "Invalid role ID" },
        { status: 400 }
      );
    }

    const role = await prisma.roleManagement.findUnique({
      where: {
        id: parseInt(id),
      },
    });

    if (!role) {
      return NextResponse.json(
        { error: "Role not found" },
        { status: 404 }
      );
    }

    // Get user count for this role based on the role field in User table
    const enumRole = roleNameToEnumMap[role.name];
    const userCount = enumRole ? await prisma.user.count({
      where: {
        role: enumRole as any, // Cast to the Role enum type
      },
    }) : 0;

    const formattedRole = {
      id: role.id.toString(),
      name: role.name,
      description: role.description || '',
      permissions: role.permissions as string[],
      status: role.status,
      totalUsers: userCount,
      createdAt: role.createdAt.toISOString(),
      updatedAt: role.updatedAt.toISOString(),
    };

    return NextResponse.json({ data: formattedRole });
  } catch (error) {
    console.error('Error fetching role:', error);
    return NextResponse.json(
      { 
        error: "Failed to fetch role",
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    );
  }
}

// PUT /api/roles/[id] - Update a role
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { name, description, permissions, status } = body;

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: "Invalid role ID" },
        { status: 400 }
      );
    }

    // Check if role exists
    const existingRole = await prisma.roleManagement.findUnique({
      where: {
        id: parseInt(id),
      },
    });

    if (!existingRole) {
      return NextResponse.json(
        { error: "Role not found" },
        { status: 404 }
      );
    }

    // Check if new name conflicts with existing role (excluding current role)
    if (name && name !== existingRole.name) {
      const nameConflict = await prisma.roleManagement.findUnique({
        where: {
          name: name.trim(),
        },
      });

      if (nameConflict) {
        return NextResponse.json(
          { error: "Role name already exists" },
          { status: 409 }
        );
      }
    }

    // Update role
    const updatedRole = await prisma.roleManagement.update({
      where: {
        id: parseInt(id),
      },
      data: {
        name: name?.trim() || existingRole.name,
        description: description?.trim() || existingRole.description,
        permissions: permissions || existingRole.permissions,
        status: status || existingRole.status,
      },
    });

    console.log('Updated role:', updatedRole.name);

    // Get user count for the updated role
    const enumRole = roleNameToEnumMap[updatedRole.name];
    const userCount = enumRole ? await prisma.user.count({
      where: {
        role: enumRole as any, // Cast to the Role enum type
      },
    }) : 0;

    const formattedRole = {
      id: updatedRole.id.toString(),
      name: updatedRole.name,
      description: updatedRole.description || '',
      permissions: updatedRole.permissions as string[],
      status: updatedRole.status,
      totalUsers: userCount,
      createdAt: updatedRole.createdAt.toISOString(),
      updatedAt: updatedRole.updatedAt.toISOString(),
    };

    return NextResponse.json(
      { 
        data: formattedRole, 
        message: 'Role updated successfully' 
      }
    );
  } catch (error) {
    console.error('Error updating role:', error);
    return NextResponse.json(
      { 
        error: "Failed to update role",
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    );
  }
}

// DELETE /api/roles/[id] - Delete a role
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: "Invalid role ID" },
        { status: 400 }
      );
    }

    // Check if role exists and has users
    const role = await prisma.roleManagement.findUnique({
      where: {
        id: parseInt(id),
      },
    });

    if (!role) {
      return NextResponse.json(
        { error: "Role not found" },
        { status: 404 }
      );
    }

    // Check if role has users assigned based on the role field
    const enumRole = roleNameToEnumMap[role.name];
    const userCount = enumRole ? await prisma.user.count({
      where: {
        role: enumRole as any, // Cast to the Role enum type
      },
    }) : 0;

    if (userCount > 0) {
      return NextResponse.json(
        { 
          error: "Cannot delete role that has users assigned",
          userCount: userCount
        },
        { status: 409 }
      );
    }

    // Delete role
    await prisma.roleManagement.delete({
      where: {
        id: parseInt(id),
      },
    });

    console.log('Deleted role:', role.name);

    return NextResponse.json(
      { 
        message: 'Role deleted successfully',
        deletedRole: {
          id: role.id.toString(),
          name: role.name,
        }
      }
    );
  } catch (error) {
    console.error('Error deleting role:', error);
    return NextResponse.json(
      { 
        error: "Failed to delete role",
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    );
  }
} 