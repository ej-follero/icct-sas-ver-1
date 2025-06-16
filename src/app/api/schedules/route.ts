import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = parseInt(searchParams.get("pageSize") || "10", 10);
    const search = searchParams.get("search") || "";

    const where: any = {};
    if (search) {
      where.OR = [
        { subject: { subjectName: { contains: search, mode: "insensitive" } } },
        { section: { sectionName: { contains: search, mode: "insensitive" } } },
        { instructor: { firstName: { contains: search, mode: "insensitive" } } },
        { instructor: { lastName: { contains: search, mode: "insensitive" } } },
      ];
    }

    const total = await prisma.subjectSchedule.count({ where });
    const schedules = await prisma.subjectSchedule.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { startTime: "asc" },
      include: {
        subject: true,
        section: true,
        instructor: true,
        room: true,
        semester: true,
      },
    });
    return NextResponse.json({ data: schedules, total });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch schedules" }, { status: 500 });
  }
} 