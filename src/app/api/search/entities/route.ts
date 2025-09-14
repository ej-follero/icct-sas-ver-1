import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Search students or instructors by name/id
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = (searchParams.get('type') || 'student') as 'student' | 'instructor';
    const q = (searchParams.get('q') || '').trim();
    const limit = Math.min(Number(searchParams.get('limit') || 10), 50);

    if (!q) return NextResponse.json({ items: [] });

    if (type === 'student') {
      const items = await prisma.student.findMany({
        where: {
          OR: [
            { firstName: { contains: q, mode: 'insensitive' } },
            { lastName: { contains: q, mode: 'insensitive' } },
            { studentIdNum: { contains: q, mode: 'insensitive' } },
          ],
        },
        select: { studentId: true, firstName: true, lastName: true, studentIdNum: true },
        take: limit,
      });
      return NextResponse.json({
        items: items.map(s => ({
          value: String(s.studentId),
          label: `${s.firstName} ${s.lastName} • ${s.studentIdNum}`,
        })),
      });
    }

    const items = await prisma.instructor.findMany({
      where: {
        OR: [
          { firstName: { contains: q, mode: 'insensitive' } },
          { lastName: { contains: q, mode: 'insensitive' } },
          { employeeId: { contains: q, mode: 'insensitive' } },
        ],
      },
      select: { instructorId: true, firstName: true, lastName: true, employeeId: true },
      take: limit,
    });
    return NextResponse.json({
      items: items.map(i => ({
        value: String(i.instructorId),
        label: `${i.firstName} ${i.lastName} • ${i.employeeId}`,
      })),
    });
  } catch (e) {
    console.error('Entity search error', e);
    return NextResponse.json({ items: [] });
  }
}



