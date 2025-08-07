import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const instructorId = searchParams.get('instructorId');
    const departmentId = searchParams.get('departmentId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    console.log('Received instructor attendance filter parameters:', {
      instructorId,
      departmentId,
      startDate,
      endDate,
      status,
      search
    });

    // Test database connection first
    try {
      await prisma.$connect();
      console.log('Database connection successful');
    } catch (dbError) {
      console.error('Database connection failed:', dbError);
      return NextResponse.json(
        { error: 'Database connection failed', details: dbError instanceof Error ? dbError.message : 'Unknown database error' },
        { status: 500 }
      );
    }

    // First, get all instructors with their basic information
    const instructors = await prisma.instructor.findMany({
      where: {
        ...(instructorId && { instructorId: parseInt(instructorId) }),
        ...(departmentId && { departmentId: parseInt(departmentId) }),
        ...(search && {
          OR: [
            { firstName: { contains: search, mode: 'insensitive' } },
            { lastName: { contains: search, mode: 'insensitive' } },
            { employeeId: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
            { Department: { departmentName: { contains: search, mode: 'insensitive' } } }
          ]
        })
      },
      include: {
        Department: true,
        Subjects: true,
        Attendance: {
          where: {
            ...(startDate && endDate && {
              timestamp: {
                gte: new Date(startDate),
                lte: new Date(endDate)
              }
            }),
            ...(status && { status })
          },
          orderBy: {
            timestamp: 'desc'
          }
        }
      },
      orderBy: {
        firstName: 'asc'
      }
    });

    console.log('Found instructors:', instructors.length);

    // If no instructors found, return empty array instead of error
    if (instructors.length === 0) {
      console.log('No instructors found, returning empty array');
      return NextResponse.json([]);
    }

    // Transform instructor data with attendance metrics
    const transformedInstructors = instructors.map(instructor => {
      const attendanceRecords = instructor.Attendance;
      
      // Calculate attendance metrics
      const totalScheduledClasses = attendanceRecords.length;
      const attendedClasses = attendanceRecords.filter(r => r.status === 'PRESENT').length;
      const absentClasses = attendanceRecords.filter(r => r.status === 'ABSENT').length;
      const lateClasses = attendanceRecords.filter(r => r.status === 'LATE').length;
      const onLeaveClasses = attendanceRecords.filter(r => r.status === 'EXCUSED').length;

      const attendanceRate = totalScheduledClasses > 0 
        ? (attendedClasses / totalScheduledClasses) * 100 
        : 0;

      const punctualityScore = totalScheduledClasses > 0
        ? ((attendedClasses) / (attendedClasses + lateClasses)) * 100
        : 0;

      // Calculate risk level
      let riskLevel = 'LOW';
      if (attendanceRate < 75) riskLevel = 'HIGH';
      else if (attendanceRate < 85) riskLevel = 'MEDIUM';
      else if (attendanceRate >= 95) riskLevel = 'NONE';

      // Calculate weekly pattern (mock for now - could be enhanced with actual data)
      const weeklyPattern = {
        monday: Math.floor(Math.random() * 20) + 80,
        tuesday: Math.floor(Math.random() * 20) + 80,
        wednesday: Math.floor(Math.random() * 20) + 80,
        thursday: Math.floor(Math.random() * 20) + 80,
        friday: Math.floor(Math.random() * 20) + 80,
        saturday: 0,
        sunday: 0
      };

      // Calculate current streak (mock for now)
      const currentStreak = Math.floor(Math.random() * 30) + 1;

      // Calculate consistency rating (mock for now)
      const consistencyRating = Math.floor(Math.random() * 2) + 4;

      // Calculate trend (mock for now)
      const trend = parseFloat((Math.random() * 20 - 10).toFixed(1));

      return {
        instructorId: instructor.instructorId.toString(),
        instructorName: `${instructor.firstName} ${instructor.lastName}`,
        employeeId: instructor.employeeId,
        department: instructor.Department.departmentName,
        instructorType: instructor.instructorType,
        specialization: instructor.specialization,
        email: instructor.email,
        phoneNumber: instructor.phoneNumber,
        officeLocation: instructor.officeLocation,
        officeHours: instructor.officeHours,
        rfidTag: instructor.rfidTag,
        status: instructor.status,
        subjects: instructor.Subjects.map(subject => subject.subjectName),
        schedules: [], // Could be populated with SubjectSchedule data if needed
        totalScheduledClasses,
        attendedClasses,
        absentClasses,
        lateClasses,
        onLeaveClasses,
        attendanceRate: parseFloat(attendanceRate.toFixed(1)),
        punctualityScore: parseFloat(punctualityScore.toFixed(1)),
        riskLevel,
        currentStreak,
        consistencyRating,
        trend,
        weeklyPattern,
        lastAttendance: attendanceRecords.length > 0 
          ? attendanceRecords[0].timestamp 
          : new Date(),
        avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${instructor.firstName}${instructor.lastName}`,
        attendanceRecords
      };
    });

    console.log('Transformed instructors:', transformedInstructors.length);

    return NextResponse.json(transformedInstructors);
  } catch (error) {
    console.error('Error fetching instructor attendance records:', error);
    return NextResponse.json(
      { error: 'Failed to fetch instructor attendance records', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  } finally {
    // Always disconnect from database
    await prisma.$disconnect();
  }
} 