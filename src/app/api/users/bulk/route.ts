import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { UserStatus, Role } from '@prisma/client';

// Schema for user import data
const userImportSchema = z.object({
  userName: z.string().min(1, "Username is required"),
  email: z.string().email("Invalid email address"),
  role: z.enum(["SUPER_ADMIN", "ADMIN", "DEPARTMENT_HEAD", "INSTRUCTOR", "STUDENT", "GUARDIAN", "SYSTEM_AUDITOR"]),
  status: z.enum(["active", "inactive", "suspended", "pending", "blocked"]).optional().default("active"),
  isEmailVerified: z.boolean().optional().default(false),
  twoFactorEnabled: z.boolean().optional().default(false),
  passwordHash: z.string().optional(),
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

        await prisma.user.create({
          data: userData,
        });
        
        results.success++;
        
      } catch (error: any) {
        results.failed++;
        results.errors.push(`Row ${i + 1}: ${error.message || 'Unknown error'}`);
      }
    }

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