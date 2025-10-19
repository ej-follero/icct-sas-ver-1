import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Guardian creation schema
const guardianSchema = z.object({
  email: z.string().email('Invalid email format'),
  phoneNumber: z.string().min(10, 'Phone number must be at least 10 characters'),
  firstName: z.string().min(1, 'First name is required'),
  middleName: z.string().optional(),
  lastName: z.string().min(1, 'Last name is required'),
  suffix: z.string().optional(),
  address: z.string().min(1, 'Address is required'),
  img: z.string().optional(),
  gender: z.enum(['MALE', 'FEMALE']),
  guardianType: z.enum(['PARENT', 'GUARDIAN']),
  occupation: z.string().optional(),
  workplace: z.string().optional(),
  emergencyContact: z.string().optional(),
  relationshipToStudent: z.string().min(1, 'Relationship to student is required'),
});

// GET /api/guardians - Fetch all guardians
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'all';
    const guardianType = searchParams.get('guardianType') || 'all';

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phoneNumber: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status !== 'all') {
      where.status = status;
    }

    if (guardianType !== 'all') {
      where.guardianType = guardianType;
    }

    // Fetch guardians with related data
    const [guardians, total] = await Promise.all([
      prisma.guardian.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          Student: {
            select: {
              studentId: true,
              studentIdNum: true,
              firstName: true,
              lastName: true,
              email: true,
              CourseOffering: {
                select: {
                  courseName: true,
                  courseCode: true,
                }
              }
            }
          }
        }
      }),
      prisma.guardian.count({ where })
    ]);

    // Calculate statistics
    const statistics = await prisma.guardian.groupBy({
      by: ['status'],
      _count: { status: true }
    });

    const statusCounts = statistics.reduce((acc, stat) => {
      acc[stat.status] = stat._count.status;
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json({
      success: true,
      data: guardians,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      statistics: {
        total: total,
        statusCounts
      }
    });
  } catch (error) {
    console.error('Error fetching guardians:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch guardians' },
      { status: 500 }
    );
  }
}

// POST /api/guardians - Create new guardian
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validatedData = guardianSchema.parse(body);

    // Check for existing email or phone
    const existingGuardian = await prisma.guardian.findFirst({
      where: {
        OR: [
          { email: validatedData.email },
          { phoneNumber: validatedData.phoneNumber }
        ]
      }
    });

    if (existingGuardian) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Guardian with this email or phone number already exists' 
        },
        { status: 400 }
      );
    }

    // Create guardian
    const guardian = await prisma.guardian.create({
      data: {
        ...validatedData,
        status: 'ACTIVE'
      },
      include: {
        Student: {
          select: {
            studentId: true,
            studentIdNum: true,
            firstName: true,
            lastName: true,
            email: true,
            CourseOffering: {
              select: {
                courseName: true,
                courseCode: true,
              }
            }
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: guardian,
      message: 'Guardian created successfully'
    });
  } catch (error) {
    console.error('Error creating guardian:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Validation failed',
          details: error.errors 
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to create guardian' },
      { status: 500 }
    );
  }
}