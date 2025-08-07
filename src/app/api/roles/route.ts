import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/roles - Get all roles
export async function GET() {
  try {
    console.log('Fetching roles from database...');
    
    // Ensure the client is connected
    try {
      await prisma.$connect();
      console.log('Database connection successful');
    } catch (connectionError) {
      console.error('Database connection failed:', connectionError);
      return NextResponse.json(
        { 
          error: "Database connection failed",
          details: process.env.NODE_ENV === 'development' ? connectionError : undefined
        },
        { status: 503 }
      );
    }

    const roles = await prisma.roleManagement.findMany({
      orderBy: {
        name: 'asc',
      },
    });

    console.log(`Retrieved ${roles.length} roles from database`);

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

    // Get user counts for each role based on the role field in User table
    const rolesWithUserCounts = await Promise.all(
      roles.map(async (role) => {
        const enumRole = roleNameToEnumMap[role.name];
        const userCount = enumRole ? await prisma.user.count({
          where: {
            role: enumRole as any, // Cast to the Role enum type
          },
        }) : 0;

        return {
          id: role.id.toString(),
          name: role.name,
          description: role.description || '',
          permissions: role.permissions as string[],
          status: role.status,
          totalUsers: userCount,
          createdAt: role.createdAt.toISOString(),
          updatedAt: role.updatedAt.toISOString(),
        };
      })
    );

    return NextResponse.json({ data: rolesWithUserCounts });
  } catch (error) {
    console.error('Error fetching roles:', error);
    return NextResponse.json(
      { 
        error: "Failed to fetch roles",
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    );
  } finally {
    try {
      await prisma.$disconnect();
    } catch (disconnectError) {
      console.error('Error disconnecting from database:', disconnectError);
    }
  }
}

// POST /api/roles - Create a new role
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, description, permissions, status } = body;

    // Validate required fields
    if (!name || !permissions || !Array.isArray(permissions)) {
      return NextResponse.json(
        { error: "Missing required fields: name and permissions array" },
        { status: 400 }
      );
    }

    // Check if role name already exists
    const existingRole = await prisma.roleManagement.findUnique({
      where: {
        name: name.trim(),
      },
    });

    if (existingRole) {
      return NextResponse.json(
        { error: "Role name already exists" },
        { status: 409 }
      );
    }

    // Create new role
    const newRole = await prisma.roleManagement.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        permissions: permissions,
        status: status || "ACTIVE",
      },
    });

    console.log('Created new role:', newRole.name);

    // Map role name to Role enum value
    const roleNameToEnumMap: { [key: string]: string } = {
      'Super Admin': 'SUPER_ADMIN',
      'Admin': 'ADMIN',
      'Department Head': 'DEPARTMENT_HEAD',
      'Instructor': 'INSTRUCTOR',
      'Student': 'STUDENT',
      'Parent': 'GUARDIAN',
      'System Auditor': 'SYSTEM_AUDITOR',
    };

    const enumRole = roleNameToEnumMap[newRole.name];
    const userCount = enumRole ? await prisma.user.count({
      where: {
        role: enumRole as any, // Cast to the Role enum type
      },
    }) : 0;

    const formattedRole = {
      id: newRole.id.toString(),
      name: newRole.name,
      description: newRole.description || '',
      permissions: newRole.permissions as string[],
      status: newRole.status,
      totalUsers: userCount,
      createdAt: newRole.createdAt.toISOString(),
      updatedAt: newRole.updatedAt.toISOString(),
    };

    return NextResponse.json(
      { 
        data: formattedRole, 
        message: 'Role created successfully' 
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating role:', error);
    return NextResponse.json(
      { 
        error: "Failed to create role",
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    );
  }
} 