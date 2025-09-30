import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Authorization: allow ADMIN and SUPER_ADMIN
    const role = request.headers.get('x-user-role');
    const isDev = process.env.NODE_ENV !== 'production';
    
    if (!isDev) {
      if (!role || (role !== 'ADMIN' && role !== 'SUPER_ADMIN')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = parseInt(searchParams.get("pageSize") || "10", 10);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const sortBy = searchParams.get("sortBy") || "name";
    const sortDir = searchParams.get("sortDir") === "desc" ? "desc" : "asc";

    // Build where clause
    const where: any = {
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { description: { contains: search, mode: "insensitive" as const } },
        ],
      }),
      ...(status && status !== "all" && { status }),
    };

    // Get total count
    const total = await prisma.roleManagement.count({ where });

    // Get paginated data with user count
    const roles = await prisma.roleManagement.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { [sortBy]: sortDir },
      include: {
        _count: {
          select: {
            users: true
          }
        }
      }
    });

    // Transform the data to match the expected format
    const transformedRoles = roles.map(role => ({
      id: role.id.toString(),
      name: role.name,
      description: role.description || '',
      permissions: Array.isArray(role.permissions) ? role.permissions : [],
      status: role.status,
      totalUsers: role._count.users,
      createdAt: role.createdAt.toISOString(),
      updatedAt: role.updatedAt.toISOString()
    }));

    return NextResponse.json({ 
      data: transformedRoles,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    });
  } catch (error) {
    console.error('GET /api/roles error', error);
    return NextResponse.json({ 
      error: 'Failed to fetch roles',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

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

    const data = await request.json();
    
    // Validate required fields
    if (!data.name || !data.permissions || !Array.isArray(data.permissions)) {
      return NextResponse.json({ 
        error: "Missing required fields: name and permissions are required" 
      }, { status: 400 });
    }

    // Check if role name already exists
    const existingRole = await prisma.roleManagement.findFirst({
      where: { 
        name: { 
          equals: data.name, 
          mode: "insensitive" 
        } 
      }
    });

    if (existingRole) {
      return NextResponse.json({ 
        error: "Role name already exists" 
      }, { status: 400 });
    }

    const newRole = await prisma.roleManagement.create({
      data: {
        name: data.name.trim(),
        description: data.description?.trim() || null,
        permissions: data.permissions,
        status: data.status || 'ACTIVE',
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
      id: newRole.id.toString(),
      name: newRole.name,
      description: newRole.description || '',
      permissions: Array.isArray(newRole.permissions) ? newRole.permissions : [],
      status: newRole.status,
      totalUsers: newRole._count.users,
      createdAt: newRole.createdAt.toISOString(),
      updatedAt: newRole.updatedAt.toISOString()
    };

    return NextResponse.json({ data: transformedRole }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating role:', error);
    
    // Handle specific Prisma errors
    if (error.code === 'P2002') {
      return NextResponse.json({ 
        error: "Role name already exists. Please use a unique name." 
      }, { status: 400 });
    }
    
    return NextResponse.json({ 
      error: error.message || "Failed to create role" 
    }, { status: 500 });
  }
}