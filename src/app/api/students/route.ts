import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const q = (url.searchParams.get('q') || '').trim();
  const page = Math.max(1, Number(url.searchParams.get('page') || 1));
  const pageSize = Math.min(100, Math.max(1, Number(url.searchParams.get('pageSize') || 10)));
  const sort = (url.searchParams.get('sort') || 'name') as 'name' | 'studentIdNum';
  const order = (url.searchParams.get('order') || 'asc') as 'asc' | 'desc';

  // Optional: only if you want to filter by instructor’s roster later
  const instructorId = url.searchParams.get('instructorId')
    ? Number(url.searchParams.get('instructorId'))
    : undefined;

  // WHERE: name or studentIdNum contains q (case-insensitively)
  const where: any = {};
  if (q) {
    where.OR = [
      { firstName: { contains: q, mode: 'insensitive' } },
      { lastName:  { contains: q, mode: 'insensitive' } },
      { studentIdNum: { contains: q, mode: 'insensitive' } },
    ];
  }

  // If you later enforce rosters per instructor, add your join/filter here.
  // Example (pseudo):
  // if (instructorId) where.StudentSchedule = { some: { instructorId } };

  try {
    const [total, rows] = await prisma.$transaction([
      prisma.student.count({ where }),
      prisma.student.findMany({
        where,
        orderBy:
          sort === 'studentIdNum'
            ? { studentIdNum: order }
            : [
                { lastName: order },
                { firstName: order },
              ],
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          studentId: true,
          studentIdNum: true,
          firstName: true,
          lastName: true,
        },
      }),
    ]);

    const items = rows.map((s) => ({
      id: s.studentId,
      studentIdNum: s.studentIdNum,
      firstName: s.firstName,
      lastName: s.lastName,
      fullName: `${s.lastName}, ${s.firstName}`,
    }));

    return NextResponse.json({ items, total, page, pageSize });
  } catch (e: any) {
    console.error('GET /api/students error:', e);
    return NextResponse.json({ error: e?.message ?? 'Failed to load students' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
