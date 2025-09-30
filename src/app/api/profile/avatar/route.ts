import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { createHash } from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('avatar') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'File must be an image' },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size must be less than 5MB' },
        { status: 400 }
      );
    }

    // TODO: Get user ID from session/token
    const userId = 1; // This should come from authentication

    // Generate unique filename
    const fileExtension = file.name.split('.').pop();
    const hash = createHash('md5').update(file.name + Date.now()).digest('hex');
    const fileName = `${hash}.${fileExtension}`;
    
    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'avatars');
    await mkdir(uploadsDir, { recursive: true });

    // Save file
    const filePath = join(uploadsDir, fileName);
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Update user avatar in database
    const avatarUrl = `/uploads/avatars/${fileName}`;
    
    // Update student profile if exists
    const student = await prisma.student.findFirst({
      where: { userId }
    });

    if (student) {
      await prisma.student.update({
        where: { studentId: student.studentId },
        data: { img: avatarUrl }
      });
    }

    // Update instructor profile if exists
    const instructor = await prisma.instructor.findFirst({
      where: { userId }
    });

    if (instructor) {
      await prisma.instructor.update({
        where: { instructorId: instructor.instructorId },
        data: { img: avatarUrl }
      });
    }

    // Log avatar change event
    await prisma.securityLogs.create({
      data: {
        userId,
        eventType: 'AVATAR_CHANGED',
        severity: 'LOW',
        description: 'User changed their profile avatar',
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      }
    });

    return NextResponse.json({ 
      data: { avatarUrl },
      message: 'Avatar updated successfully' 
    });
  } catch (error) {
    console.error('Error uploading avatar:', error);
    return NextResponse.json(
      { error: 'Failed to upload avatar' },
      { status: 500 }
    );
  }
}
