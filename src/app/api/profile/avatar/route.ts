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

    // Get user ID from JWT token in cookies
    const token = request.cookies.get('token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verify JWT token and extract user ID
    let userId: number;
    try {
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const userIdRaw = (decoded as any)?.userId;
      userId = Number(userIdRaw);
      if (!Number.isFinite(userId)) {
        throw new Error('Invalid user id');
      }
    } catch (jwtError) {
      console.error('JWT verification failed:', jwtError);
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      );
    }

    // Generate unique filename
    const originalName = (file.name || 'avatar').replace(/[^a-zA-Z0-9_.-]/g, '');
    const nameExt = originalName.includes('.') ? originalName.split('.').pop() : '';
    const inferredExt = file.type === 'image/png' ? 'png' : file.type === 'image/jpeg' ? 'jpg' : file.type === 'image/webp' ? 'webp' : (nameExt || 'png');
    const hash = createHash('md5').update(originalName + Date.now()).digest('hex');
    const fileName = `${hash}.${inferredExt}`;
    
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

    // Update User model avatar field (primary)
    await prisma.user.update({
      where: { userId },
      data: { avatar: avatarUrl }
    });

    // Fetch the user to get email for instructor linkage
    const user = await prisma.user.findUnique({ where: { userId } });

    // Update student profile if exists
    const student = await prisma.student.findFirst({ where: { userId } });
    if (student) {
      await prisma.student.update({
        where: { studentId: student.studentId },
        data: { img: avatarUrl }
      });
    }

    // Update instructor profile if exists (matched by email)
    if (user?.email) {
      const instructor = await prisma.instructor.findFirst({ where: { email: user.email } });
      if (instructor) {
        await prisma.instructor.update({
          where: { instructorId: instructor.instructorId },
          data: { img: avatarUrl }
        });
      }
    }

    // Log avatar change event
    await prisma.securityLog.create({
      data: {
        userId,
        level: 'INFO',
        module: 'PROFILE',
        action: 'AVATAR_CHANGED',
        details: 'User changed their profile avatar',
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
