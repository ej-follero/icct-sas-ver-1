import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    console.log('Fetching comprehensive filter options...');

    // Fetch all departments with their codes
    const departments = await prisma.department.findMany({
      select: {
        departmentId: true,
        departmentName: true,
        departmentCode: true,
        departmentStatus: true,
      },
      where: {
        departmentStatus: 'ACTIVE',
      },
      orderBy: {
        departmentName: 'asc',
      },
    });
    console.log('Departments fetched:', departments.length);

    // Fetch all students with their related data
    const students = await prisma.student.findMany({
      select: {
        studentId: true,
        firstName: true,
        lastName: true,
        studentIdNum: true,
        yearLevel: true,
        status: true,
        studentType: true,
        Department: {
          select: {
            departmentId: true,
            departmentName: true,
            departmentCode: true,
          },
        },
        CourseOffering: {
          select: {
            courseId: true,
            courseName: true,
            courseCode: true,
          },
        },
        StudentSection: {
          select: {
            Section: {
              select: {
                sectionId: true,
                sectionName: true,
                yearLevel: true,
                Course: {
                  select: {
                    courseName: true,
                    courseCode: true,
                  },
                },
              },
            },
          },
        },
      },
      where: {
        status: 'ACTIVE',
      },
    });
    console.log('Students fetched:', students.length);

    // Fetch all courses
    const courses = await prisma.courseOffering.findMany({
      select: {
        courseId: true,
        courseName: true,
        courseCode: true,
        courseStatus: true,
        Department: {
          select: {
            departmentName: true,
            departmentCode: true,
          },
        },
      },
      where: {
        courseStatus: 'ACTIVE',
      },
      orderBy: {
        courseName: 'asc',
      },
    });
    console.log('Courses fetched:', courses.length);

    // Fetch all sections
    const sections = await prisma.section.findMany({
      select: {
        sectionId: true,
        sectionName: true,
        sectionStatus: true,
        yearLevel: true,
        Course: {
          select: {
            courseName: true,
            courseCode: true,
          },
        },
      },
      where: {
        sectionStatus: 'ACTIVE',
      },
      orderBy: {
        sectionName: 'asc',
      },
    });
    console.log('Sections fetched:', sections.length);

    // Fetch all subjects
    const subjects = await prisma.subjects.findMany({
      select: {
        subjectId: true,
        subjectName: true,
        subjectCode: true,
        status: true,
        Department: {
          select: {
            departmentName: true,
            departmentCode: true,
          },
        },
        CourseOffering: {
          select: {
            courseName: true,
            courseCode: true,
          },
        },
      },
      where: {
        status: 'ACTIVE',
      },
      orderBy: {
        subjectName: 'asc',
      },
    });
    console.log('Subjects fetched:', subjects.length);

    // Fetch all instructors
    const instructors = await prisma.instructor.findMany({
      select: {
        instructorId: true,
        firstName: true,
        lastName: true,
        instructorType: true,
        status: true,
        Department: {
          select: {
            departmentName: true,
            departmentCode: true,
          },
        },
      },
      where: {
        status: 'ACTIVE',
      },
      orderBy: {
        firstName: 'asc',
      },
    });
    console.log('Instructors fetched:', instructors.length);

    // Fetch all rooms
    const rooms = await prisma.room.findMany({
      select: {
        roomId: true,
        roomNo: true,
        roomType: true,
        roomBuildingLoc: true,
        roomFloorLoc: true,
        status: true,
      },
      where: {
        status: 'AVAILABLE',
        isActive: true,
      },
      orderBy: {
        roomNo: 'asc',
      },
    });
    console.log('Rooms fetched:', rooms.length);

    // Fetch unique schedule days and times from SubjectSchedule
    const schedules = await prisma.subjectSchedule.findMany({
      select: {
        day: true,
        startTime: true,
        endTime: true,
        status: true,
      },
      where: {
        status: 'ACTIVE',
      },
      distinct: ['day', 'startTime', 'endTime'],
    });
    console.log('Unique schedules fetched:', schedules.length);

    // Transform the data to match the frontend interface
    const transformedData = {
      departments: departments.map(department => ({
        id: department.departmentId.toString(),
        code: department.departmentCode,
        name: department.departmentName,
        displayName: `${department.departmentCode} - ${department.departmentName}`,
        status: department.departmentStatus,
      })),
      
      students: students.map(student => ({
        id: student.studentId.toString(),
        studentName: `${student.firstName} ${student.lastName}`,
        studentId: student.studentIdNum,
        departmentId: student.Department?.departmentId?.toString() || '',
        departmentCode: student.Department?.departmentCode || '',
        departmentName: student.Department?.departmentName || '',
        course: student.CourseOffering?.courseName || 'Unknown',
        courseCode: student.CourseOffering?.courseCode || '',
        yearLevel: student.yearLevel,
        status: student.status,
        studentType: student.studentType,
        section: student.StudentSection[0]?.Section.sectionName || '',
      })),
      
      courses: courses.map(course => ({
        id: course.courseId.toString(),
        name: course.courseName,
        code: course.courseCode,
        department: course.Department?.departmentName || '',
        departmentCode: course.Department?.departmentCode || '',
        displayName: `${course.courseCode} - ${course.courseName}`,
        status: course.courseStatus,
      })),
      
      sections: sections.map(section => ({
        id: section.sectionId.toString(),
        name: section.sectionName,
        yearLevel: section.yearLevel,
        course: section.Course?.courseName || '',
        courseCode: section.Course?.courseCode || '',
        displayName: `${section.sectionName} (${section.Course?.courseCode || ''})`,
        status: section.sectionStatus,
      })),
      
      subjects: subjects.map(subject => ({
        id: subject.subjectId.toString(),
        name: subject.subjectName,
        code: subject.subjectCode,
        department: subject.Department?.departmentName || '',
        departmentCode: subject.Department?.departmentCode || '',
        course: subject.CourseOffering?.courseName || '',
        courseCode: subject.CourseOffering?.courseCode || '',
        displayName: `${subject.subjectCode} - ${subject.subjectName}`,
        status: subject.status,
      })),
      
      instructors: instructors.map(instructor => ({
        id: instructor.instructorId.toString(),
        name: `${instructor.firstName} ${instructor.lastName}`,
        firstName: instructor.firstName,
        lastName: instructor.lastName,
        instructorType: instructor.instructorType,
        department: instructor.Department?.departmentName || '',
        departmentCode: instructor.Department?.departmentCode || '',
        displayName: `${instructor.firstName} ${instructor.lastName} (${instructor.Department?.departmentCode || ''})`,
        status: instructor.status,
      })),
      
      rooms: rooms.map(room => ({
        id: room.roomId.toString(),
        name: room.roomNo,
        type: room.roomType,
        building: room.roomBuildingLoc,
        floor: room.roomFloorLoc,
        displayName: `${room.roomNo} - ${room.roomBuildingLoc} (${room.roomFloorLoc})`,
        status: room.status,
      })),
      
      scheduleDays: [...new Set(schedules.map(s => s.day))].sort(),
      scheduleTimes: [...new Set(schedules.map(s => `${s.startTime} - ${s.endTime}`))].sort(),
      
      // Additional filter options
      yearLevels: [...new Set(students.map(s => s.yearLevel))].sort(),
      studentStatuses: [...new Set(students.map(s => s.status))].sort(),
      studentTypes: [...new Set(students.map(s => s.studentType))].sort(),
      instructorTypes: [...new Set(instructors.map(i => i.instructorType))].sort(),
      roomTypes: [...new Set(rooms.map(r => r.roomType))].sort(),
    };

    console.log('Transformed data summary:', {
      departmentsCount: transformedData.departments.length,
      studentsCount: transformedData.students.length,
      coursesCount: transformedData.courses.length,
      sectionsCount: transformedData.sections.length,
      subjectsCount: transformedData.subjects.length,
      instructorsCount: transformedData.instructors.length,
      roomsCount: transformedData.rooms.length,
      scheduleDaysCount: transformedData.scheduleDays.length,
      scheduleTimesCount: transformedData.scheduleTimes.length,
    });

    return NextResponse.json(transformedData);
  } catch (error) {
    console.error('Error fetching filter options:', error);
    
    // Return a more detailed error message
    if (error instanceof Error) {
      return NextResponse.json(
        { error: `Failed to fetch filter options: ${error.message}` },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch filter options' },
      { status: 500 }
    );
  }
} 