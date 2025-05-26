import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Attendance, User, Student, SubjectSchedule, Subjects, CourseOffering, Section, Instructor } from '@prisma/client';

type SubjectScheduleWithRelations = SubjectSchedule & {
  subject: Subjects & {
    CourseOffering: CourseOffering;
  };
  section: Section;
  instructor: Instructor;
};

type AttendanceWithRelations = Attendance & {
  user: User;
  Student: Student[];
  SubjectSchedule: SubjectScheduleWithRelations[];
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    const courseId = searchParams.get('courseId');
    const sectionId = searchParams.get('sectionId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const status = searchParams.get('status');

    console.log('Received filter parameters:', {
      studentId,
      courseId,
      sectionId,
      startDate,
      endDate,
      status
    });

    // Build the where clause based on filters
    const where: any = {};

    if (studentId) {
      where.Student = {
        some: {
          studentIdNum: studentId
        }
      };
    }

    if (courseId) {
      where.SubjectSchedule = {
        some: {
          subject: {
            CourseOffering: {
              courseId: parseInt(courseId)
            }
          }
        }
      };
    }

    if (sectionId) {
      where.SubjectSchedule = {
        ...where.SubjectSchedule,
        some: {
          section: {
            sectionId: parseInt(sectionId)
          }
        }
      };
    }

    if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0); // Set to beginning of day
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999); // Set to end of day
      where.timestamp = {
        gte: start,
        lte: end
      };
    }

    if (status) {
      where.status = status;
    }

    console.log('Filter conditions:', JSON.stringify(where, null, 2));

    // Get total count of attendance records
    const totalRecords = await prisma.attendance.count();
    console.log('Total attendance records in database:', totalRecords);

    // Fetch attendance records with related data
    const records = await prisma.attendance.findMany({
      where,
      include: {
        user: true,
        Student: true,
        SubjectSchedule: {
          include: {
            subject: {
              include: {
                CourseOffering: true
              }
            },
            section: true,
            instructor: true
          }
        }
      },
      orderBy: {
        timestamp: 'desc'
      }
    });

    console.log('Found attendance records:', records.length);
    if (records.length > 0) {
      console.log('Sample record:', JSON.stringify(records[0], null, 2));
    }

    // Transform the records to match the frontend interface
    const transformedRecords = records.map((record: AttendanceWithRelations) => {
      // Get the first student from the array or use null if empty
      const student = record.Student?.[0] || null;
      const subjectSchedule = record.SubjectSchedule?.[0] || null;
      const subject = subjectSchedule?.subject;
      const section = subjectSchedule?.section;
      const instructor = subjectSchedule?.instructor;

      // Format the scheduled time
      const scheduledTime = subjectSchedule?.startTime ? {
        start: new Date(subjectSchedule.startTime).toLocaleTimeString(),
        end: new Date(subjectSchedule.endTime).toLocaleTimeString()
      } : { start: '-', end: '-' };

      return {
        id: record.attendanceId,
        date: record.timestamp.toISOString().split('T')[0],
        studentId: student?.studentIdNum || '-',
        studentName: student ? `${student.firstName} ${student.lastName}` : '-',
        subject: subject?.subjectName || '-',
        section: section?.sectionName || '-',
        instructor: instructor ? `${instructor.firstName} ${instructor.lastName}` : '-',
        timeIn: record.timestamp.toLocaleTimeString(),
        timeOut: record.checkOutTime ? record.checkOutTime.toLocaleTimeString() : '-',
        scheduledTime,
        status: record.status,
        remarks: record.notes || '-'
      };
    });

    console.log('Transformed records:', transformedRecords.length);
    if (transformedRecords.length > 0) {
      console.log('Sample transformed record:', JSON.stringify(transformedRecords[0], null, 2));
    }

    return NextResponse.json(transformedRecords);
  } catch (error) {
    console.error('Error fetching attendance records:', error);
    return NextResponse.json(
      { error: 'Failed to fetch attendance records' },
      { status: 500 }
    );
  }
} 