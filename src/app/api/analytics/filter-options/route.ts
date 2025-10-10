import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const departmentId = searchParams.get('departmentId');
    const courseId = searchParams.get('courseId');
    const subjectId = searchParams.get('subjectId');
    
    // Helpers
    const parseMaybeNumber = (val: string | null) => {
      if (!val) return undefined;
      const n = Number(val);
      return Number.isFinite(n) ? n : undefined;
    };

    // Fetch departments
    const departments = await prisma.department.findMany({
      select: {
        departmentId: true,
        departmentName: true,
        departmentCode: true
      },
      orderBy: {
        departmentName: 'asc'
      }
    });

    // Fetch courses (filtered by department if specified), allow id or code
    const courseWhere: any = {};
    if (departmentId && departmentId !== 'all') {
      const deptNum = parseMaybeNumber(departmentId);
      if (deptNum !== undefined) {
        courseWhere.departmentId = deptNum;
      } else {
        courseWhere.Department = { is: { departmentCode: departmentId } };
      }
    }

    const courses = await prisma.courseOffering.findMany({
      where: courseWhere,
      select: {
        courseId: true,
        courseName: true,
        courseCode: true,
        departmentId: true
      },
      orderBy: {
        courseName: 'asc'
      }
    });

    // Fetch subjects (filtered by course if specified); allow course id or code
    const subjectWhere: any = {};
    if (courseId && courseId !== 'all') {
      const cNum = parseMaybeNumber(courseId);
      if (cNum !== undefined) {
        subjectWhere.courseId = cNum;
      } else {
        subjectWhere.CourseOffering = { is: { courseCode: courseId } };
      }
    }

    const subjects = await prisma.subjects.findMany({
      where: subjectWhere,
      select: {
        subjectId: true,
        subjectName: true,
        subjectCode: true,
        courseId: true,
        CourseOffering: {
          select: {
            courseId: true,
            courseCode: true
          }
        }
      },
      orderBy: {
        subjectName: 'asc'
      }
    });

    // Fetch sections (filtered by course and/or subject if specified)
    const sectionWhere: any = {};
    if (courseId && courseId !== 'all') {
      const cNum = parseMaybeNumber(courseId);
      if (cNum !== undefined) {
        sectionWhere.courseId = cNum;
      } else {
        sectionWhere.Course = { is: { courseCode: courseId } };
      }
    }
    if (subjectId && subjectId !== 'all') {
      const sNum = parseMaybeNumber(subjectId);
      sectionWhere.SubjectSchedule = {
        some: {
          ...(sNum !== undefined ? { subjectId: sNum } : {}),
          ...(sNum === undefined ? { subject: { is: { subjectCode: subjectId } } } : {})
        }
      };
    }

    const sections = await prisma.section.findMany({
      where: sectionWhere,
      select: {
        sectionId: true,
        sectionName: true,
        yearLevel: true,
        courseId: true
      },
      orderBy: {
        sectionName: 'asc'
      }
    });

    // Derive year levels based on sections when course is selected; fallback to default enum mapping
    const toYearEnum = (n: number): string => {
      if (n === 1) return 'FIRST_YEAR';
      if (n === 2) return 'SECOND_YEAR';
      if (n === 3) return 'THIRD_YEAR';
      if (n === 4) return 'FOURTH_YEAR';
      return String(n);
    };
    const distinctYearLevels = Array.from(new Set(sections.map(s => s.yearLevel))).filter(Boolean) as number[];
    const yearLevels = (distinctYearLevels.length > 0
      ? distinctYearLevels
      : [1,2,3,4]
    ).map(n => ({ id: toYearEnum(n), name: toYearEnum(n).replace('_', ' ') }));

    // Transform data for frontend
    const filterOptions = {
      departments: departments.map(dept => ({
        id: dept.departmentId.toString(),
        name: dept.departmentName,
        code: dept.departmentCode
      })),
      courses: courses.map(course => ({
        id: course.courseId.toString(),
        name: course.courseName,
        code: course.courseCode,
        departmentId: course.departmentId.toString()
      })),
      subjects: subjects.map(subject => ({
        id: subject.subjectId.toString(),
        name: subject.subjectName,
        code: subject.subjectCode,
        courseId: (subject.courseId || subject.CourseOffering?.courseId)?.toString() || ''
      })),
      sections: sections.map(section => ({
        id: section.sectionId.toString(),
        name: section.sectionName,
        courseId: section.courseId.toString(),
        yearLevel: toYearEnum(section.yearLevel)
      })),
      yearLevels
    };

    return NextResponse.json(filterOptions);
  } catch (error) {
    console.error('Error fetching filter options:', error);
    return NextResponse.json(
      { error: 'Failed to fetch filter options' },
      { status: 500 }
    );
  }
}
