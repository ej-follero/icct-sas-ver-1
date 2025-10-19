import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { Role, Status as PrismaStatus, UserStatus } from '@prisma/client';

// Server-side schema mirroring the client form
const baseSchema = z.object({
  userName: z.string().min(1),
  email: z.string().email(),
  passwordHash: z.string().min(1),
  role: z.nativeEnum(Role),
  status: z
    .enum(['active', 'inactive', 'suspended', 'pending', 'blocked'])
    .default('active'),

  // shared personal info
  firstName: z.string().min(1),
  middleName: z.string().optional().nullable(),
  lastName: z.string().min(1),
  suffix: z.string().optional().nullable(),
  phoneNumber: z.string().min(1),
  gender: z.enum(['MALE', 'FEMALE']),
  address: z.string().optional().nullable(),
});

const instructorSchema = baseSchema.extend({
  role: z.literal(Role.INSTRUCTOR),
  instructorType: z.enum(['FULL_TIME', 'PART_TIME']),
  departmentId: z.number(),
  officeLocation: z.string().optional().nullable(),
  officeHours: z.string().optional().nullable(),
  specialization: z.string().optional().nullable(),
  employeeId: z.string().min(1),
  rfidTag: z.string().min(1),
});

const studentSchema = baseSchema.extend({
  role: z.literal(Role.STUDENT),
  studentIdNum: z.string().min(1),
  studentType: z.enum(['REGULAR', 'IRREGULAR']),
  yearLevel: z.enum(['FIRST_YEAR', 'SECOND_YEAR', 'THIRD_YEAR', 'FOURTH_YEAR']),
  courseId: z.number().optional(),
  birthDate: z.string().optional().nullable(),
  nationality: z.string().optional().nullable(),
  guardianId: z.number().optional().nullable(),
  rfidTag: z.string().min(1),
  address: z.string().min(1),
});

const anySchema = z.union([instructorSchema, studentSchema, baseSchema]);

function toUserStatus(status: string | undefined): UserStatus {
  switch (status) {
    case 'active':
      return UserStatus.ACTIVE;
    case 'inactive':
      return UserStatus.INACTIVE;
    case 'suspended':
      return UserStatus.SUSPENDED;
    case 'pending':
      return UserStatus.PENDING;
    case 'blocked':
      return UserStatus.BLOCKED;
    default:
      return UserStatus.ACTIVE;
  }
}

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const data = anySchema.parse(json);

    // Ensure email is unique early
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      return NextResponse.json({ error: 'User with this email already exists' }, { status: 409 });
    }

    const result = await prisma.$transaction(async (tx) => {
      // Create the base user
      const user = await tx.user.create({
        data: {
          userName: data.userName,
          email: data.email,
          passwordHash: data.passwordHash,
          role: data.role,
          status: toUserStatus(data.status),
          isEmailVerified: false,
          twoFactorEnabled: false,
        },
      });

      // Role-specific creation
      if (data.role === Role.INSTRUCTOR) {
        const instructorData = data as z.infer<typeof instructorSchema>;
        await tx.instructor.create({
          data: {
            instructorId: user.userId,
            email: instructorData.email,
            phoneNumber: instructorData.phoneNumber,
            firstName: instructorData.firstName,
            middleName: instructorData.middleName || '',
            lastName: instructorData.lastName,
            suffix: instructorData.suffix ?? undefined,
            gender: instructorData.gender as any,
            instructorType: instructorData.instructorType as any,
            status: PrismaStatus.ACTIVE,
            departmentId: instructorData.departmentId,
            officeLocation: instructorData.officeLocation ?? undefined,
            officeHours: instructorData.officeHours ?? undefined,
            specialization: instructorData.specialization ?? undefined,
            rfidTag: instructorData.rfidTag,
            employeeId: instructorData.employeeId,
          },
        });
      } else if (data.role === Role.STUDENT) {
        const studentData = data as z.infer<typeof studentSchema>;
        await tx.student.create({
          data: {
            studentId: user.userId,
            studentIdNum: studentData.studentIdNum,
            rfidTag: studentData.rfidTag,
            firstName: studentData.firstName,
            middleName: studentData.middleName || '',
            lastName: studentData.lastName,
            suffix: studentData.suffix ?? undefined,
            email: studentData.email,
            phoneNumber: studentData.phoneNumber,
            address: studentData.address,
            img: null,
            gender: studentData.gender as any,
            birthDate: studentData.birthDate ? new Date(studentData.birthDate) : null,
            nationality: studentData.nationality ?? undefined,
            studentType: studentData.studentType as any,
            status: PrismaStatus.ACTIVE,
            yearLevel: studentData.yearLevel as any,
            courseId: studentData.courseId,
            departmentId: null,
            lastLogin: null,
            guardianId: studentData.guardianId ?? 0,
            userId: user.userId,
          },
        });
      }

      return user;
    });

    return NextResponse.json({ data: { id: result.userId } }, { status: 201 });
  } catch (err: any) {
    const message = err?.message || 'Failed to create user with role';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}


