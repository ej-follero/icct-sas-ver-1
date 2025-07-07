import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    
    if (!studentId) {
      return NextResponse.json(
        { error: 'Student ID is required' },
        { status: 400 }
      );
    }

    // Find the student and their associated user
    const student = await prisma.student.findFirst({
      where: {
        studentIdNum: studentId
      },
      include: {
        User: true
      }
    });

    if (!student) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      );
    }

    if (!student.User) {
      return NextResponse.json(
        { error: 'Student does not have an associated user account' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      userId: student.User.userId,
      studentId: student.studentIdNum,
      studentName: `${student.firstName} ${student.lastName}`
    });

  } catch (error) {
    console.error('Error finding student userId:', error);
    return NextResponse.json(
      { error: 'Failed to find student userId' },
      { status: 500 }
    );
  }
} 