import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { 
  StudentUserProfile, 
  BulkActionRequest, 
  UserImportRecord 
} from '@/types/user-management';

// Validation schemas
const createStudentUserSchema = z.object({
  // User fields
  userName: z.string().min(3).max(50),
  email: z.string().email(),
  password: z.string().min(8),
  
  // Student fields
  studentIdNum: z.string(),
  rfidTag: z.string(),
  firstName: z.string().min(1),
  middleName: z.string().optional(),
  lastName: z.string().min(1),
  suffix: z.string().optional(),
  phoneNumber: z.string(),
  address: z.string(),
  gender: z.enum(['MALE', 'FEMALE']),
  birthDate: z.string().optional(),
  nationality: z.string().optional(),
  studentType: z.enum(['REGULAR', 'IRREGULAR']),
  yearLevel: z.enum(['FIRST_YEAR', 'SECOND_YEAR', 'THIRD_YEAR', 'FOURTH_YEAR']),
  courseId: z.number().optional(),
  departmentId: z.number().optional(),
  guardianId: z.number(),
});

const updateStudentUserSchema = createStudentUserSchema.partial();

const bulkActionSchema = z.object({
  action: z.enum([
    'activate', 'deactivate', 'suspend', 'block', 
    'reset_password', 'enable_2fa', 'disable_2fa',
    'send_verification_email', 'send_credentials'
  ]),
  userIds: z.array(z.number()),
  options: z.object({
    notifyUsers: z.boolean().optional(),
    reason: z.string().optional(),
    temporaryPassword: z.boolean().optional(),
    suspensionDuration: z.number().optional(),
  }).optional(),
});

// GET - Fetch student users with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    // JWT Authentication (SUPER_ADMIN, ADMIN, DEPARTMENT_HEAD, INSTRUCTOR)
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const reqUserId = Number((decoded as any)?.userId);
    if (!Number.isFinite(reqUserId)) {
      return NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 });
    }

    const reqUser = await prisma.user.findUnique({ where: { userId: reqUserId }, select: { status: true, role: true } });
    if (!reqUser || reqUser.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'User not found or inactive' }, { status: 401 });
    }
    const allowedRoles = ['SUPER_ADMIN', 'ADMIN', 'DEPARTMENT_HEAD', 'INSTRUCTOR'];
    if (!allowedRoles.includes(reqUser.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status');
    const yearLevel = searchParams.get('yearLevel');
    const department = searchParams.get('department');
    const course = searchParams.get('course');
    const verificationStatus = searchParams.get('verificationStatus');
    const loginActivity = searchParams.get('loginActivity');

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      role: 'STUDENT',
      AND: []
    };

    // Search filter
    if (search) {
      where.AND.push({
        OR: [
          { userName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { Student: { 
            OR: [
              { firstName: { contains: search, mode: 'insensitive' } },
              { lastName: { contains: search, mode: 'insensitive' } },
              { studentIdNum: { contains: search, mode: 'insensitive' } },
            ]
          }}
        ]
      });
    }

    // Status filter
    if (status && status !== 'all') {
      where.AND.push({ status: status.toUpperCase() });
    }

    // Year level filter
    if (yearLevel && yearLevel !== 'all') {
      const yl = yearLevel.toUpperCase();
      const valid = ['FIRST_YEAR','SECOND_YEAR','THIRD_YEAR','FOURTH_YEAR'];
      if (valid.includes(yl)) {
        where.AND.push({ Student: { some: { yearLevel: yl } } });
      }
    }

    // Department filter
    if (department && department !== 'all') {
      where.AND.push({ Student: { some: { Department: { is: { departmentName: department } } } } });
    }

    // Course filter
    if (course && course !== 'all') {
      where.AND.push({ Student: { some: { CourseOffering: { is: { courseName: course } } } } });
    }

    // Verification status filter
    if (verificationStatus && verificationStatus !== 'all') {
      switch (verificationStatus) {
        case 'verified':
          where.AND.push({ isEmailVerified: true });
          break;
        case 'unverified':
          where.AND.push({ isEmailVerified: false });
          break;
      }
    }

    // Login activity filter
    if (loginActivity && loginActivity !== 'all') {
      const now = new Date();
      switch (loginActivity) {
        case 'recent':
          const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          where.AND.push({ lastLogin: { gte: sevenDaysAgo } });
          break;
        case 'inactive':
          const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          where.AND.push({ lastLogin: { lt: thirtyDaysAgo } });
          break;
        case 'never':
          where.AND.push({ lastLogin: null });
          break;
      }
    }

    // Remove empty AND array
    if (where.AND.length === 0) {
      delete where.AND;
    }

    // Fetch users with student data
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        include: {
          Student: {
            include: {
              CourseOffering: true,
              Department: true,
              Guardian: true,
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.user.count({ where })
    ]);

    // Transform data to match StudentUserProfile interface
    const studentUsers: StudentUserProfile[] = users.map(user => ({
      // User data
      userId: user.userId,
      userName: user.userName,
      email: user.email,
      role: user.role as 'STUDENT',
      status: user.status as any,
      lastLogin: user.lastLogin ?? undefined,
      lastPasswordChange: user.lastPasswordChange ?? undefined,
      failedLoginAttempts: user.failedLoginAttempts,
      isEmailVerified: user.isEmailVerified,
      twoFactorEnabled: user.twoFactorEnabled,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      
      // Student data
      studentId: user.Student?.[0]?.studentId || 0,
      studentIdNum: user.Student?.[0]?.studentIdNum || '',
      rfidTag: user.Student?.[0]?.rfidTag || '',
      firstName: user.Student?.[0]?.firstName || '',
      middleName: user.Student?.[0]?.middleName ?? undefined,
      lastName: user.Student?.[0]?.lastName || '',
      suffix: user.Student?.[0]?.suffix ?? undefined,
      phoneNumber: user.Student?.[0]?.phoneNumber || '',
      address: user.Student?.[0]?.address || '',
      img: user.Student?.[0]?.img ?? undefined,
      gender: user.Student?.[0]?.gender as 'MALE' | 'FEMALE',
      birthDate: user.Student?.[0]?.birthDate ?? undefined,
      nationality: user.Student?.[0]?.nationality ?? undefined,
      studentType: user.Student?.[0]?.studentType as 'REGULAR' | 'IRREGULAR',
      yearLevel: user.Student?.[0]?.yearLevel as any,
      courseId: user.Student?.[0]?.courseId ?? undefined,
      departmentId: user.Student?.[0]?.departmentId ?? undefined,
      guardianId: user.Student?.[0]?.guardianId || 0,
      
      // Related data
      courseName: user.Student?.[0]?.CourseOffering?.courseName,
      departmentName: user.Student?.[0]?.Department?.departmentName,
      guardianName: user.Student?.[0]?.Guardian ? 
        `${user.Student[0].Guardian.firstName} ${user.Student[0].Guardian.lastName}` : '',
      guardianContact: user.Student?.[0]?.Guardian?.phoneNumber,
      
      // Analytics (not in schema; default to 0)
      totalSubjects: 0,
      totalAttendance: 0,
      attendanceRate: 0,
    }));

    return NextResponse.json({
      data: studentUsers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching student users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch student users' },
      { status: 500 }
    );
  }
}

// POST - Create new student user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createStudentUserSchema.parse(body);

    // Check if username or email already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { userName: validatedData.userName },
          { email: validatedData.email }
        ]
      }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Username or email already exists' },
        { status: 400 }
      );
    }

    // Check if student ID already exists
    const existingStudent = await prisma.student.findFirst({
      where: {
        OR: [
          { studentIdNum: validatedData.studentIdNum },
          { rfidTag: validatedData.rfidTag }
        ]
      }
    });

    if (existingStudent) {
      return NextResponse.json(
        { error: 'Student ID or RFID tag already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(validatedData.password, 12);

    // Create user and student in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          userName: validatedData.userName,
          email: validatedData.email,
          passwordHash,
          role: 'STUDENT',
          status: 'PENDING', // Require activation
        }
      });

      // Create student profile
      const student = await tx.student.create({
        data: {
          studentIdNum: validatedData.studentIdNum,
          rfidTag: validatedData.rfidTag,
          firstName: validatedData.firstName,
          middleName: validatedData.middleName,
          lastName: validatedData.lastName,
          suffix: validatedData.suffix,
          email: validatedData.email,
          phoneNumber: validatedData.phoneNumber,
          address: validatedData.address,
          gender: validatedData.gender,
          birthDate: validatedData.birthDate ? new Date(validatedData.birthDate) : null,
          nationality: validatedData.nationality,
          studentType: validatedData.studentType,
          yearLevel: validatedData.yearLevel,
          courseId: validatedData.courseId,
          departmentId: validatedData.departmentId,
          guardianId: validatedData.guardianId,
          userId: user.userId,
        }
      });

      return { user, student };
    });

    return NextResponse.json({
      message: 'Student user created successfully',
      userId: result.user.userId,
      studentId: result.student.studentId
    }, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating student user:', error);
    return NextResponse.json(
      { error: 'Failed to create student user' },
      { status: 500 }
    );
  }
}

// PUT - Update student user
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = parseInt(searchParams.get('userId') || '0');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validatedData = updateStudentUserSchema.parse(body);

    // Update user and student in transaction
    await prisma.$transaction(async (tx) => {
      // Update user fields
      const userFields: any = {};
      if (validatedData.userName) userFields.userName = validatedData.userName;
      if (validatedData.email) userFields.email = validatedData.email;
      
      if (Object.keys(userFields).length > 0) {
        await tx.user.update({
          where: { userId },
          data: userFields
        });
      }

      // Update student fields
      const studentFields: any = {};
      if (validatedData.firstName) studentFields.firstName = validatedData.firstName;
      if (validatedData.lastName) studentFields.lastName = validatedData.lastName;
      if (validatedData.phoneNumber) studentFields.phoneNumber = validatedData.phoneNumber;
      // ... add other fields as needed

      if (Object.keys(studentFields).length > 0) {
        await tx.student.updateMany({
          where: { userId },
          data: studentFields
        });
      }
    });

    return NextResponse.json({
      message: 'Student user updated successfully'
    });

  } catch (error) {
    console.error('Error updating student user:', error);
    return NextResponse.json(
      { error: 'Failed to update student user' },
      { status: 500 }
    );
  }
}

// DELETE - Delete student user
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = parseInt(searchParams.get('userId') || '0');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Delete in transaction (student first due to foreign key)
    await prisma.$transaction(async (tx) => {
      await tx.student.deleteMany({
        where: { userId }
      });
      
      await tx.user.delete({
        where: { userId }
      });
    });

    return NextResponse.json({
      message: 'Student user deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting student user:', error);
    return NextResponse.json(
      { error: 'Failed to delete student user' },
      { status: 500 }
    );
  }
} 