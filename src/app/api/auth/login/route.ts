import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, studentId, employeeId, password, rememberMe } = body;
    let user = null;

    if (email) {
      user = await prisma.user.findUnique({
        where: { email },
        include: {
          Student: true,
          Instructor: true,
          Guardian: true,
        },
      });
    } else if (studentId) {
      const student = await prisma.student.findUnique({
        where: { studentIdNum: studentId },
        include: { User: true },
      });
      if (student) {
        user = await prisma.user.findUnique({
          where: { userId: student.userId },
          include: {
            Student: true,
            Instructor: true,
            Guardian: true,
          },
        });
      }
    } else if (employeeId) {
      const instructor = await prisma.instructor.findUnique({
        where: { instructorId: Number(employeeId) },
        include: { User: true },
      });
      if (instructor) {
        user = await prisma.user.findUnique({
          where: { userId: instructor.instructorId },
          include: {
            Student: true,
            Instructor: true,
            Guardian: true,
          },
        });
      }
    }

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Check if user is active
    if (user.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Account is not active' },
        { status: 403 }
      );
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.userId,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    // Update last login
    await prisma.user.update({
      where: { userId: user.userId },
      data: { lastLogin: new Date() },
    });

    // Prepare user data for response
    const userData = {
      id: user.userId,
      email: user.email,
      role: user.role,
      status: user.status,
      student: user.Student,
      instructor: user.Instructor,
      guardian: user.Guardian,
    };

    // Set HTTP-only cookie with the token
    const response = NextResponse.json(
      { user: userData },
      { status: 200 }
    );

    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 24, // 30 days or 1 day
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 