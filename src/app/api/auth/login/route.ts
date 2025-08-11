import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { auditService } from '@/lib/services/audit.service';
import { env } from '@/lib/env-validation';

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
      // Log failed login attempt
      await auditService.logAuthEvent(
        0, // No user ID for failed login
        'LOGIN_FAILED',
        `Failed login attempt for email: ${email}`,
        request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        request.headers.get('user-agent') || 'unknown'
      );

      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Check if account is locked due to too many failed attempts
    if (user.failedLoginAttempts >= 5) {
      const lockoutTime = user.lastLogin ? new Date(user.lastLogin.getTime() + 30 * 60 * 1000) : new Date();
      if (new Date() < lockoutTime) {
        await auditService.logSecurityEvent(
          user.userId,
          'ACCOUNT_LOCKED',
          `Account locked due to too many failed login attempts`,
          request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
          request.headers.get('user-agent') || 'unknown'
        );

        return NextResponse.json(
          { error: 'Account is temporarily locked due to too many failed attempts. Please try again later.' },
          { status: 423 }
        );
      } else {
        // Reset failed attempts after lockout period
        await prisma.user.update({
          where: { userId: user.userId },
          data: { failedLoginAttempts: 0 },
        });
      }
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      // Increment failed login attempts
      await prisma.user.update({
        where: { userId: user.userId },
        data: { 
          failedLoginAttempts: user.failedLoginAttempts + 1,
          lastLogin: new Date(),
        },
      });

      // Log failed login attempt
      await auditService.logAuthEvent(
        user.userId,
        'LOGIN_FAILED',
        `Failed login attempt for user: ${user.email}`,
        request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        request.headers.get('user-agent') || 'unknown'
      );

      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Check if user is active
    if (user.status !== 'ACTIVE') {
      await auditService.logSecurityEvent(
        user.userId,
        'LOGIN_BLOCKED',
        `Login blocked for inactive account: ${user.email}`,
        request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        request.headers.get('user-agent') || 'unknown'
      );

      return NextResponse.json(
        { error: 'Account is not active' },
        { status: 403 }
      );
    }

    // Generate JWT token using validated environment variable
    const token = jwt.sign(
      {
        userId: user.userId,
        email: user.email,
        role: user.role,
      },
      env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Update last login and reset failed attempts
    await prisma.user.update({
      where: { userId: user.userId },
      data: { 
        lastLogin: new Date(),
        failedLoginAttempts: 0,
      },
    });

    // Log successful login
    await auditService.logAuthEvent(
      user.userId,
      'LOGIN',
      `Successful login for user: ${user.email}`,
      request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      request.headers.get('user-agent') || 'unknown'
    );

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
      secure: env.SECURE_COOKIES,
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