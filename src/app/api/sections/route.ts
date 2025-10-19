import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export async function GET() {
  try {
    // Keep it lightweight: just id + name, sorted.
    const sections = await prisma.section.findMany({
      select: { sectionId: true, sectionName: true },
      orderBy: { sectionName: 'asc' },
    });
    return NextResponse.json({ items: sections });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Failed to load sections' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
