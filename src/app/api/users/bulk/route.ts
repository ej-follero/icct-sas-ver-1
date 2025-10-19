import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createNotification } from '@/lib/notifications';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { UserStatus, Role, Status } from '@prisma/client';

// Schema for user import data (with optional role-specific fields)
const userImportSchema = z.object({
  userName: z.string().min(1, "Username is required"),
  email: z.string().email("Invalid email address"),
  role: z.enum(["SUPER_ADMIN", "ADMIN", "DEPARTMENT_HEAD", "INSTRUCTOR", "STUDENT"]),
  status: z.enum(["active", "inactive", "suspended", "pending", "blocked"]).optional().default("active"),
  isEmailVerified: z.boolean().optional().default(false),
  twoFactorEnabled: z.boolean().optional().default(false),
  passwordHash: z.string().optional(),
  // shared personal
  firstName: z.string().optional(),
  middleName: z.string().optional(),
  lastName: z.string().optional(),
  phoneNumber: z.string().optional(),
  gender: z.enum(["MALE", "FEMALE"]).optional(),
  address: z.string().optional(),
  // instructor
  instructorType: z.enum(["FULL_TIME", "PART_TIME"]).optional(),
  departmentId: z.number().optional(),
  officeLocation: z.string().optional(),
  officeHours: z.string().optional(),
  specialization: z.string().optional(),
  employeeId: z.string().optional(),
  // student
  studentIdNum: z.string().optional(),
  studentType: z.enum(["REGULAR", "IRREGULAR"]).optional(),
  yearLevel: z.enum(["FIRST_YEAR", "SECOND_YEAR", "THIRD_YEAR", "FOURTH_YEAR"]).optional(),
  courseId: z.number().optional(),
  birthDate: z.string().optional(),
  nationality: z.string().optional(),
  guardianId: z.number().optional(),
  // guardian
  guardianType: z.enum(["PARENT", "GUARDIAN"]).optional(),
  occupation: z.string().optional(),
  workplace: z.string().optional(),
  emergencyContact: z.string().optional(),
  relationshipToStudent: z.string().optional(),
  // rfid
  rfidTag: z.string().optional(),
});

const bulkImportSchema = z.object({
  records: z.array(userImportSchema),
  options: z.object({
    skipDuplicates: z.boolean().optional().default(true),
    updateExisting: z.boolean().optional().default(false),
    generatePasswords: z.boolean().optional().default(true),
  }).optional().default({}),
});

// POST - Bulk import users
export async function POST(request: NextRequest) {
  try {
    // JWT Authentication - Admin only
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
    const adminRoles = ['SUPER_ADMIN', 'ADMIN'];
    if (!adminRoles.includes(reqUser.role)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
    const body = await request.json();
    const validatedData = bulkImportSchema.parse(body);
    
    const { records, options } = validatedData;
    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[]
    };

    // Process each record
    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      
      try {
        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
          where: { email: record.email }
        });

        if (existingUser) {
          if (options.skipDuplicates) {
            results.failed++;
            results.errors.push(`Row ${i + 1}: User with email ${record.email} already exists`);
            continue;
          }
          
          if (options.updateExisting) {
            // Update existing user
            const updateData: any = {
              userName: record.userName,
              role: record.role,
              status: record.status === 'active' ? UserStatus.ACTIVE :
                      record.status === 'inactive' ? UserStatus.INACTIVE :
                      record.status === 'suspended' ? UserStatus.SUSPENDED :
                      record.status === 'pending' ? UserStatus.PENDING :
                      record.status === 'blocked' ? UserStatus.BLOCKED :
                      UserStatus.ACTIVE,
              isEmailVerified: record.isEmailVerified,
              twoFactorEnabled: record.twoFactorEnabled,
              updatedAt: new Date(),
            };

            await prisma.user.update({
              where: { userId: existingUser.userId },
              data: updateData,
            });
            
            // Update or create role-specific entity if sufficient fields are provided
            try {
              if (record.role === 'INSTRUCTOR' && record.firstName && record.lastName && record.phoneNumber && record.gender && record.instructorType && record.departmentId && record.employeeId) {
                await prisma.instructor.upsert({
                  where: { instructorId: existingUser.userId },
                  update: {
                    email: record.email,
                    phoneNumber: record.phoneNumber,
                    firstName: record.firstName,
                    middleName: record.middleName ?? '',
                    lastName: record.lastName,
                    suffix: null,
                    gender: record.gender as any,
                    instructorType: record.instructorType as any,
                    departmentId: record.departmentId,
                    officeLocation: record.officeLocation ?? null,
                    officeHours: record.officeHours ?? null,
                    specialization: record.specialization ?? null,
                    rfidTag: record.rfidTag ?? (existingUser.userId + '-' + Date.now()),
                    employeeId: record.employeeId,
                  },
                  create: {
                    instructorId: existingUser.userId,
                    email: record.email,
                    phoneNumber: record.phoneNumber,
                    firstName: record.firstName,
                    middleName: record.middleName ?? '',
                    lastName: record.lastName,
                    suffix: null,
                    gender: record.gender as any,
                    instructorType: record.instructorType as any,
                    status: Status.ACTIVE,
                    departmentId: record.departmentId,
                    officeLocation: record.officeLocation ?? null,
                    officeHours: record.officeHours ?? null,
                    specialization: record.specialization ?? null,
                    rfidTag: record.rfidTag ?? (existingUser.userId + '-' + Date.now()),
                    employeeId: record.employeeId,
                  }
                });
              }
              if (record.role === 'STUDENT' && record.firstName && record.lastName && record.phoneNumber && record.gender && record.studentIdNum && record.studentType && record.yearLevel && record.address) {
                await prisma.student.upsert({
                  where: { studentId: existingUser.userId },
                  update: {
                    studentIdNum: record.studentIdNum,
                    rfidTag: record.rfidTag ?? (existingUser.userId + '-' + Date.now()),
                    firstName: record.firstName,
                    middleName: record.middleName ?? null,
                    lastName: record.lastName,
                    suffix: null,
                    email: record.email,
                    phoneNumber: record.phoneNumber,
                    address: record.address,
                    img: null,
                    gender: record.gender as any,
                    birthDate: record.birthDate ? new Date(record.birthDate) : null,
                    nationality: record.nationality ?? null,
                    studentType: record.studentType as any,
                    yearLevel: record.yearLevel as any,
                    courseId: record.courseId ?? null,
                    departmentId: null,
                    lastLogin: null,
                    guardianId: record.guardianId ?? 0,
                    userId: existingUser.userId,
                  },
                  create: {
                    studentId: existingUser.userId,
                    studentIdNum: record.studentIdNum,
                    rfidTag: record.rfidTag ?? (existingUser.userId + '-' + Date.now()),
                    firstName: record.firstName,
                    middleName: record.middleName ?? null,
                    lastName: record.lastName,
                    suffix: null,
                    email: record.email,
                    phoneNumber: record.phoneNumber,
                    address: record.address,
                    img: null,
                    gender: record.gender as any,
                    birthDate: record.birthDate ? new Date(record.birthDate) : null,
                    nationality: record.nationality ?? null,
                    studentType: record.studentType as any,
                    status: Status.ACTIVE,
                    yearLevel: record.yearLevel as any,
                    courseId: record.courseId ?? null,
                    departmentId: null,
                    lastLogin: null,
                    guardianId: record.guardianId ?? 0,
                    userId: existingUser.userId,
                  }
                });
              }
            } catch (roleErr: any) {
              results.errors.push(`Row ${i + 1}: ${roleErr?.message || 'Failed updating role entity'}`);
            }
            
            results.success++;
            continue;
          }
        }

        // Create new user
        const userData: any = {
          userName: record.userName,
          email: record.email,
          role: record.role,
          status: record.status === 'active' ? UserStatus.ACTIVE :
                  record.status === 'inactive' ? UserStatus.INACTIVE :
                  record.status === 'suspended' ? UserStatus.SUSPENDED :
                  record.status === 'pending' ? UserStatus.PENDING :
                  record.status === 'blocked' ? UserStatus.BLOCKED :
                  UserStatus.ACTIVE,
          isEmailVerified: record.isEmailVerified,
          twoFactorEnabled: record.twoFactorEnabled,
        };

        // Handle password
        if (record.passwordHash) {
          userData.passwordHash = record.passwordHash;
        } else if (options.generatePasswords) {
          // Generate a temporary password
          const tempPassword = generateTemporaryPassword();
          const hashedPassword = await bcrypt.hash(tempPassword, 12);
          userData.passwordHash = hashedPassword;
          
          // Log the temporary password (remove in production!)
          console.log(`Temporary password for ${record.email}: ${tempPassword}`);
        } else {
          // Use a default password
          const defaultPassword = "ChangeMe123!";
          const hashedPassword = await bcrypt.hash(defaultPassword, 12);
          userData.passwordHash = hashedPassword;
        }

        const createdUser = await prisma.user.create({
          data: userData,
        });
        // Role-specific creation when fields present
        if (record.role === 'INSTRUCTOR' && record.firstName && record.lastName && record.phoneNumber && record.gender && record.instructorType && record.departmentId && record.employeeId) {
          await prisma.instructor.create({
            data: {
              instructorId: createdUser.userId,
              email: record.email,
              phoneNumber: record.phoneNumber,
              firstName: record.firstName,
              middleName: record.middleName ?? '',
              lastName: record.lastName,
              suffix: null,
              gender: record.gender as any,
              instructorType: record.instructorType as any,
              status: UserStatus.ACTIVE as any,
              departmentId: record.departmentId,
              officeLocation: record.officeLocation ?? null,
              officeHours: record.officeHours ?? null,
              specialization: record.specialization ?? null,
              rfidTag: record.rfidTag ?? `${createdUser.userId}-${Date.now()}`,
              employeeId: record.employeeId,
            }
          });
        }
        if (record.role === 'STUDENT' && record.firstName && record.lastName && record.phoneNumber && record.gender && record.studentIdNum && record.studentType && record.yearLevel && record.address) {
          await prisma.student.create({
            data: {
              studentId: createdUser.userId,
              studentIdNum: record.studentIdNum,
              rfidTag: record.rfidTag ?? `${createdUser.userId}-${Date.now()}`,
              firstName: record.firstName,
              middleName: record.middleName ?? null,
              lastName: record.lastName,
              suffix: null,
              email: record.email,
              phoneNumber: record.phoneNumber,
              address: record.address,
              img: null,
              gender: record.gender as any,
              birthDate: record.birthDate ? new Date(record.birthDate) : null,
              nationality: record.nationality ?? null,
              studentType: record.studentType as any,
              status: UserStatus.ACTIVE as any,
              yearLevel: record.yearLevel as any,
              courseId: record.courseId ?? null,
              departmentId: null,
              lastLogin: null,
              guardianId: record.guardianId ?? 0,
              userId: createdUser.userId,
            }
          });
        }
         
        results.success++;
        
      } catch (error: any) {
        results.failed++;
        results.errors.push(`Row ${i + 1}: ${error.message || 'Unknown error'}`);
      }
    }

    try {
      await createNotification(reqUserId, {
        title: 'Import completed',
        message: `Users import: ${results.success} success, ${results.failed} failed`,
        priority: results.failed > 0 ? 'NORMAL' : 'NORMAL',
        type: 'DATA',
      });
    } catch {}
    return NextResponse.json({
      message: `Bulk import completed. ${results.success} successful, ${results.failed} failed.`,
      results
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error in bulk import:', error);
    return NextResponse.json(
      { error: 'Failed to import users' },
      { status: 500 }
    );
  }
}

// Helper function to generate temporary passwords
function generateTemporaryPassword(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
} 