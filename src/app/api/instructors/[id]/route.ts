import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { InstructorType, Status, UserGender } from '@prisma/client';

type PutBody = {
  firstName: string;
  middleName: string;
  lastName: string;
  suffix?: string | null;
  email: string;
  phoneNumber: string;
  gender: 'MALE' | 'FEMALE';
  instructorType: 'FULL_TIME' | 'PART_TIME';
  status: 'ACTIVE' | 'INACTIVE';
  departmentId: number;
  employeeId: string;
  rfidTag: string;
  subjectIds?: number[];
};

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const instructorId = parseInt(id);
    if (isNaN(instructorId)) {
      return NextResponse.json({ error: 'Invalid instructor ID' }, { status: 400 });
    }

    const instructor = await prisma.instructor.findUnique({
      where: { instructorId },
      include: {
        Subjects: { select: { subjectId: true } },
      },
    });

    if (!instructor) {
      return NextResponse.json({ error: 'Instructor not found' }, { status: 404 });
    }

    return NextResponse.json({
      data: {
        instructorId: instructor.instructorId,
        firstName: instructor.firstName,
        middleName: instructor.middleName,
        lastName: instructor.lastName,
        suffix: instructor.suffix,
        email: instructor.email,
        phoneNumber: instructor.phoneNumber,
        gender: instructor.gender,
        instructorType: instructor.instructorType,
        status: instructor.status,
        departmentId: instructor.departmentId,
        employeeId: instructor.employeeId,
        rfidTag: instructor.rfidTag,
        subjectIds: instructor.Subjects.map(s => s.subjectId),
      },
    });
  } catch (error) {
    console.error('[INSTRUCTOR_GET]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const instructorId = parseInt(id);
    if (isNaN(instructorId)) {
      return NextResponse.json({ error: 'Invalid instructor ID' }, { status: 400 });
    }

    const body = (await request.json()) as Partial<PutBody>;
    const {
      firstName,
      middleName,
      lastName,
      suffix,
      email,
      phoneNumber,
      gender,
      instructorType,
      status,
      departmentId,
      employeeId,
      rfidTag,
      subjectIds,
    } = body;

    // Basic validation
    const required = {
      firstName,
      middleName,
      lastName,
      email,
      phoneNumber,
      gender,
      instructorType,
      status,
      departmentId,
      employeeId,
      rfidTag,
    } as const;

    for (const [key, value] of Object.entries(required)) {
      if (
        value === undefined ||
        value === null ||
        (typeof value === 'string' && value.trim().length === 0)
      ) {
        return NextResponse.json({ error: `${key} is required` }, { status: 400 });
      }
    }

    // Validate enums
    const allowedGenders: Array<UserGender> = ['MALE', 'FEMALE'];
    const allowedTypes: Array<InstructorType> = ['FULL_TIME', 'PART_TIME'];
    const allowedStatus: Array<Status> = ['ACTIVE', 'INACTIVE'];

    if (!allowedGenders.includes(gender as UserGender)) {
      return NextResponse.json({ error: 'Invalid gender' }, { status: 400 });
    }
    if (!allowedTypes.includes(instructorType as InstructorType)) {
      return NextResponse.json({ error: 'Invalid instructorType' }, { status: 400 });
    }
    if (!allowedStatus.includes(status as Status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    // Check existing instructor
    const existing = await prisma.instructor.findUnique({ where: { instructorId } });
    if (!existing) {
      return NextResponse.json({ error: 'Instructor not found' }, { status: 404 });
    }

    // Uniqueness checks when changing values
    if (email && email !== existing.email) {
      const emailExists = await prisma.instructor.findUnique({ where: { email } });
      if (emailExists && emailExists.instructorId !== instructorId) {
        return NextResponse.json({ error: 'Email already exists' }, { status: 409 });
      }
    }
    if (phoneNumber && phoneNumber !== existing.phoneNumber) {
      const phoneExists = await prisma.instructor.findUnique({ where: { phoneNumber } });
      if (phoneExists && phoneExists.instructorId !== instructorId) {
        return NextResponse.json({ error: 'Phone number already exists' }, { status: 409 });
      }
    }
    if (employeeId && employeeId !== existing.employeeId) {
      const empExists = await prisma.instructor.findUnique({ where: { employeeId } });
      if (empExists && empExists.instructorId !== instructorId) {
        return NextResponse.json({ error: 'Employee ID already exists' }, { status: 409 });
      }
    }
    if (rfidTag && rfidTag !== existing.rfidTag) {
      const tagExists = await prisma.instructor.findUnique({ where: { rfidTag } });
      if (tagExists && tagExists.instructorId !== instructorId) {
        return NextResponse.json({ error: 'RFID tag already exists' }, { status: 409 });
      }
    }

    // Ensure department exists
    const deptIdNum = Number(departmentId);
    if (!Number.isFinite(deptIdNum)) {
      return NextResponse.json({ error: 'Invalid departmentId' }, { status: 400 });
    }
    const department = await prisma.department.findUnique({ where: { departmentId: deptIdNum } });
    if (!department) {
      return NextResponse.json({ error: 'Department not found' }, { status: 404 });
    }

    // Prepare subject relation update
    let subjectsUpdate: any = undefined;
    if (Array.isArray(subjectIds)) {
      const ids = subjectIds.filter((n) => Number.isFinite(n)) as number[];
      subjectsUpdate = {
        set: ids.map((sid) => ({ subjectId: sid })),
      };
    }

    // Update instructor
    const updated = await prisma.instructor.update({
      where: { instructorId },
      data: {
        firstName: firstName!,
        middleName: middleName!,
        lastName: lastName!,
        suffix: suffix ?? null,
        email: email!,
        phoneNumber: phoneNumber!,
        gender: gender as UserGender,
        instructorType: instructorType as InstructorType,
        status: status as Status,
        departmentId: deptIdNum,
        employeeId: employeeId!,
        rfidTag: rfidTag!,
        ...(subjectsUpdate ? { Subjects: subjectsUpdate } : {}),
      },
      include: {
        Department: { select: { departmentId: true, departmentName: true, departmentCode: true } },
        Subjects: { select: { subjectId: true, subjectName: true, subjectCode: true } },
      },
    });

    return NextResponse.json({
      data: updated,
      message: 'Instructor updated successfully',
    });
  } catch (error: any) {
    console.error('[INSTRUCTOR_PUT]', error);
    // Prisma unique constraint
    if (error?.code === 'P2002') {
      const target = Array.isArray(error.meta?.target) ? error.meta.target.join(',') : error.meta?.target;
      return NextResponse.json({ error: 'Unique constraint failed', target }, { status: 409 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const instructorId = parseInt(id);
    if (isNaN(instructorId)) {
      return NextResponse.json({ error: 'Invalid instructor ID' }, { status: 400 });
    }

    const body = await request.json();
    const { status } = body;

    // Check existing instructor
    const existing = await prisma.instructor.findUnique({ where: { instructorId } });
    if (!existing) {
      return NextResponse.json({ error: 'Instructor not found' }, { status: 404 });
    }

    // Update instructor status
    const updated = await prisma.instructor.update({
      where: { instructorId },
      data: {
        status: status as Status,
      },
      include: {
        Department: {
          select: {
            departmentId: true,
            departmentName: true,
            departmentCode: true,
          }
        }
      }
    });

    return NextResponse.json({
      data: updated,
      message: 'Instructor status updated successfully',
    });
  } catch (error: any) {
    console.error('[INSTRUCTOR_PATCH]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}