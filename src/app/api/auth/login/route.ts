import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { auditService } from '@/lib/services/audit.service';
import { env } from '@/lib/env-validation';
import { createNotification } from '@/lib/notifications';


export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    let { email, studentIdNum, employeeId, password, rememberMe, identifier } = body;
    
    // Support a single concise identifier: email OR studentIdNum (e.g., 2025-01234) OR employeeId
    if (identifier && !email && !studentIdNum && !employeeId) {
      const idStr = String(identifier).trim();
      const isEmail = /.+@.+\..+/.test(idStr);
      const isStudentIdNum = /^(\d{4}-\d{5})$/.test(idStr);
      const isNumeric = /^\d+$/.test(idStr);
      if (isEmail) {
        email = idStr.toLowerCase();
      } else if (isStudentIdNum) {
        studentIdNum = idStr;
      } else if (isNumeric) {
        employeeId = idStr;
      }
    }
    let user = null;

    if (email) {
      user = await prisma.user.findUnique({
        where: { email: String(email).toLowerCase() },
      });
    } else if (studentIdNum) {
      const student = await prisma.student.findUnique({
        where: { studentIdNum: studentIdNum },
        include: { User: true },
      });
      if (student) {
        user = student.User;
      }
    } else if (employeeId) {
      // Look up instructor by employeeId
      const instructor = await prisma.instructor.findUnique({
        where: { employeeId: String(employeeId).trim() },
      });
      
      if (instructor) {
        // Find user by instructor email
        user = await prisma.user.findUnique({
          where: { email: instructor.email },
        });
      }
    }

    if (!user) {
      // Log failed login attempt
      await auditService.logAuthEvent(
        0, // No user ID for failed login
        'LOGIN_FAILED',
        `Failed login attempt for identifier: ${identifier || email || studentIdNum || employeeId}`,
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
    let isValidPassword = false;
    
    // For all users (including instructors), verify password
    isValidPassword = await bcrypt.compare(password, user.passwordHash);
    
    if (!isValidPassword) {
      // Update failed attempts for all users
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

      // Notify admin on multiple failed attempts (threshold 5)
      try {
        const updated = await prisma.user.findUnique({ where: { userId: user.userId }, select: { failedLoginAttempts: true, role: true } });
        if (updated && updated.failedLoginAttempts >= 5 && (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN')) {
          await createNotification(user.userId, {
            title: 'Failed admin login attempts',
            message: `There have been ${updated.failedLoginAttempts} failed login attempts for your account`,
            priority: 'HIGH',
            type: 'SECURITY',
          });
        }
      } catch {}

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