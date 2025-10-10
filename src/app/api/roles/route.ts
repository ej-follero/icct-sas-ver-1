import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
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

    // Get paginated data with base role info
    const roles = await prisma.roleManagement.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { [sortBy]: sortDir },
      include: { _count: { select: { users: true } } }
    });

    // Build user counts for enum roles and custom roles in one go
    const [enumRoleCounts, customRoleCounts] = await Promise.all([
      prisma.user.groupBy({
        by: ['role'],
        _count: { role: true }
      }).catch(() => [] as Array<{ role: any; _count: { role: number } }>),
      prisma.user.groupBy({
        by: ['customRoleId'],
        _count: { customRoleId: true }
      }).catch(() => [] as Array<{ customRoleId: number | null; _count: { customRoleId: number } }>)
    ]);

    const enumCountMap = new Map<string, number>();
    for (const row of enumRoleCounts as any[]) {
      if (!row || typeof row.role === 'undefined' || row.role === null) continue;
      enumCountMap.set(String(row.role), Number(row._count?.role ?? 0));
    }

    const customCountMap = new Map<number, number>();
    for (const row of customRoleCounts as any[]) {
      if (!row || row.customRoleId === null || typeof row.customRoleId === 'undefined') continue;
      customCountMap.set(Number(row.customRoleId), Number(row._count?.customRoleId ?? 0));
    }

    const BUILT_IN_ROLES = new Set(['SUPER_ADMIN', 'ADMIN', 'DEPARTMENT_HEAD', 'INSTRUCTOR', 'STUDENT']);

    // Transform the data to match the expected format
    const transformedRoles = roles.map(role => ({
      id: role.id.toString(),
      name: role.name,
      description: role.description || '',
      permissions: Array.isArray(role.permissions) ? role.permissions : [],
      status: role.status,
      totalUsers: (() => {
        const viaCustom = customCountMap.get(role.id) ?? 0;
        const viaEnum = BUILT_IN_ROLES.has(role.name) ? (enumCountMap.get(role.name) ?? 0) : 0;
        // Prefer computed counts; fall back to stored column if both are zero
        const combined = viaCustom + viaEnum;
        if (combined > 0) return combined;
        const included = (role as any)._count?.users ?? 0;
        return included || role.totalUsers || 0;
      })(),
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