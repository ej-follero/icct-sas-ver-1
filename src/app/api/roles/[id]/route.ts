import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const roleId = parseInt(params.id);
    if (isNaN(roleId)) {
      return NextResponse.json({ error: 'Invalid role ID' }, { status: 400 });
    }

    const roleData = await prisma.roleManagement.findUnique({
      where: { id: roleId },
      include: {
        _count: {
          select: {
            users: true
          }
        }
      }
    });

    if (!roleData) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }

    // Transform the response
    const transformedRole = {
      id: roleData.id.toString(),
      name: roleData.name,
      description: roleData.description || '',
      permissions: Array.isArray(roleData.permissions) ? roleData.permissions : [],
      status: roleData.status,
      totalUsers: roleData._count.users,
      createdAt: roleData.createdAt.toISOString(),
      updatedAt: roleData.updatedAt.toISOString()
    };

    return NextResponse.json({ data: transformedRole });
  } catch (error) {
    console.error('GET /api/roles/[id] error', error);
    return NextResponse.json({ 
      error: 'Failed to fetch role',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const roleId = parseInt(params.id);
    if (isNaN(roleId)) {
      return NextResponse.json({ error: 'Invalid role ID' }, { status: 400 });
    }

    const data = await request.json();

    // Check if role exists
    const existingRole = await prisma.roleManagement.findUnique({
      where: { id: roleId }
    });

    if (!existingRole) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }

    // Check if name is being changed and if it conflicts with existing roles
    if (data.name && data.name !== existingRole.name) {
      const nameConflict = await prisma.roleManagement.findFirst({
        where: { 
          name: { 
            equals: data.name, 
            mode: "insensitive" 
          },
          id: { not: roleId }
        }
      });

      if (nameConflict) {
        return NextResponse.json({ 
          error: "Role name already exists" 
        }, { status: 400 });
      }
    }

    const updatedRole = await prisma.roleManagement.update({
      where: { id: roleId },
      data: {
        ...(data.name && { name: data.name.trim() }),
        ...(data.description !== undefined && { description: data.description?.trim() || null }),
        ...(data.permissions && { permissions: data.permissions }),
        ...(data.status && { status: data.status }),
      },
      include: {
        _count: {
          select: {
            users: true
          }
        }
      }
    });

    // Transform the response
    const transformedRole = {
      id: updatedRole.id.toString(),
      name: updatedRole.name,
      description: updatedRole.description || '',
      permissions: Array.isArray(updatedRole.permissions) ? updatedRole.permissions : [],
      status: updatedRole.status,
      totalUsers: updatedRole._count.users,
      createdAt: updatedRole.createdAt.toISOString(),
      updatedAt: updatedRole.updatedAt.toISOString()
    };

    return NextResponse.json({ data: transformedRole });
  } catch (error: any) {
    console.error('Error updating role:', error);
    
    // Handle specific Prisma errors
    if (error.code === 'P2002') {
      return NextResponse.json({ 
        error: "Role name already exists. Please use a unique name." 
      }, { status: 400 });
    }
    
    return NextResponse.json({ 
      error: error.message || "Failed to update role" 
    }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const roleId = parseInt(params.id);
    if (isNaN(roleId)) {
      return NextResponse.json({ error: 'Invalid role ID' }, { status: 400 });
    }

    // Check if role exists
    const existingRole = await prisma.roleManagement.findUnique({
      where: { id: roleId },
      include: {
        _count: {
          select: {
            users: true
          }
        }
      }
    });

    if (!existingRole) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }

    // Check if role has users assigned
    if (existingRole._count.users > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete role with assigned users' 
      }, { status: 400 });
    }

    await prisma.roleManagement.delete({
      where: { id: roleId }
    });

    return NextResponse.json({ message: 'Role deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting role:', error);
    
    return NextResponse.json({ 
      error: error.message || "Failed to delete role" 
    }, { status: 500 });
  }
}