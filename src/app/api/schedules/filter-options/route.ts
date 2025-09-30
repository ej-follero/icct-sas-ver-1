import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    console.log('Fetching filter options from database...');
    
    // Fetch all unique values for filter options from the database
    const [
      semesters,
      days,
      instructors,
      rooms,
      subjects,
      sections,
      academicYears,
      scheduleTypes,
      departments,
      buildings,
      floors,
      roomTypes
    ] = await Promise.all([
      // Semesters - use semesterType and year to create semester names
      prisma.semester.findMany({
        select: { 
          semesterType: true,
          year: true,
          semesterId: true
        },
        orderBy: [{ year: 'desc' }, { semesterType: 'asc' }]
      }),
      
      // Days
      prisma.subjectSchedule.findMany({
        where: { status: { not: 'CANCELLED' } },
        select: { day: true },
        distinct: ['day'],
        orderBy: { day: 'asc' }
      }),
      
      // Instructors
      prisma.instructor.findMany({
        select: { 
          instructorId: true,
          firstName: true,
          lastName: true 
        },
        orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }]
      }),
      
      // Rooms
      prisma.room.findMany({
        select: { 
          roomNo: true,
          roomBuildingLoc: true,
          roomFloorLoc: true,
          roomType: true
        },
        orderBy: { roomNo: 'asc' }
      }),
      
      // Subjects
      prisma.subjects.findMany({
        select: { 
          subjectName: true,
          subjectCode: true,
          departmentId: true
        },
        orderBy: { subjectName: 'asc' }
      }),
      
      // Sections
      prisma.section.findMany({
        select: { sectionName: true },
        distinct: ['sectionName'],
        orderBy: { sectionName: 'asc' }
      }),
      
      // Academic Years
      prisma.subjectSchedule.findMany({
        where: { status: { not: 'CANCELLED' } },
        select: { academicYear: true },
        distinct: ['academicYear'],
        orderBy: { academicYear: 'desc' }
      }),
      
      // Schedule Types
      prisma.subjectSchedule.findMany({
        where: { status: { not: 'CANCELLED' } },
        select: { scheduleType: true },
        distinct: ['scheduleType'],
        orderBy: { scheduleType: 'asc' }
      }),
      
      // Departments
      prisma.department.findMany({
        select: { 
          departmentName: true,
          departmentId: true
        },
        orderBy: { departmentName: 'asc' }
      }),
      
      // Buildings (from rooms)
      prisma.room.findMany({
        select: { roomBuildingLoc: true },
        distinct: ['roomBuildingLoc'],
        orderBy: { roomBuildingLoc: 'asc' }
      }),
      
      // Floors (from rooms)
      prisma.room.findMany({
        select: { roomFloorLoc: true },
        distinct: ['roomFloorLoc'],
        orderBy: { roomFloorLoc: 'asc' }
      }),
      
      // Room Types
      prisma.room.findMany({
        select: { roomType: true },
        distinct: ['roomType'],
        orderBy: { roomType: 'asc' }
      })
    ]);

    // Transform the data for the frontend with fallbacks
    const filterOptions = {
      semesters: semesters?.map(s => `${s.year} - ${s.semesterType}`) || [],
      days: days?.map(d => d.day) || [],
      instructors: instructors?.map(i => ({
        id: i.instructorId,
        name: `${i.firstName} ${i.lastName}`,
        firstName: i.firstName,
        lastName: i.lastName
      })) || [],
      rooms: rooms?.map(r => ({
        roomNo: r.roomNo,
        building: r.roomBuildingLoc,
        floor: r.roomFloorLoc,
        roomType: r.roomType
      })) || [],
      subjects: subjects?.map(s => ({
        name: s.subjectName,
        code: s.subjectCode,
        departmentId: s.departmentId
      })) || [],
      sections: sections?.map(s => s.sectionName) || [],
      academicYears: academicYears?.map(a => a.academicYear) || [],
      scheduleTypes: scheduleTypes?.map(s => s.scheduleType) || [],
      departments: departments?.map(d => d.departmentName) || [],
      buildings: buildings?.map(b => b.roomBuildingLoc) || [],
      floors: floors?.map(f => f.roomFloorLoc) || [],
      roomTypes: roomTypes?.map(r => r.roomType) || []
    };

    console.log('Filter options fetched successfully:', {
      semesters: filterOptions.semesters.length,
      days: filterOptions.days.length,
      instructors: filterOptions.instructors.length,
      rooms: filterOptions.rooms.length,
      subjects: filterOptions.subjects.length,
      sections: filterOptions.sections.length,
      academicYears: filterOptions.academicYears.length,
      scheduleTypes: filterOptions.scheduleTypes.length,
      departments: filterOptions.departments.length,
      buildings: filterOptions.buildings.length,
      floors: filterOptions.floors.length,
      roomTypes: filterOptions.roomTypes.length
    });

    return NextResponse.json({
      success: true,
      data: filterOptions
    });

  } catch (error) {
    console.error('Error fetching filter options:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch filter options' 
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
