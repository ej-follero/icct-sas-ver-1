export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient, AttendanceStatus } from "@prisma/client";

const prisma = new PrismaClient();

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function endOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const instructorId = Number(url.searchParams.get("instructorId"));
    const days = Number(url.searchParams.get("days") || 30);
    const subjectCode = url.searchParams.get("subject") || "";

    if (!instructorId || Number.isNaN(instructorId)) {
      return NextResponse.json({ error: "instructorId required" }, { status: 400 });
    }

    const today = startOfDay(new Date());
    const from = startOfDay(new Date(today.getTime() - (days - 1) * 24 * 60 * 60 * 1000));
    const to = endOfDay(today);

    const schedules = await prisma.subjectSchedule.findMany({
      where: { instructorId },
      select: {
        subjectSchedId: true,
        subject: { select: { subjectCode: true, subjectName: true } },
      },
    });

    const subjectSet = new Map<string, string>();
    for (const s of schedules) {
      subjectSet.set(s.subject.subjectCode, s.subject.subjectName);
    }

    const filteredSchedIds = schedules
      .filter(s => (subjectCode ? s.subject.subjectCode === subjectCode : true))
      .map(s => s.subjectSchedId);

    if (filteredSchedIds.length === 0) {
      return NextResponse.json({
        days: [],
        subjects: Array.from(subjectSet, ([code, name]) => ({ code, name })),
      });
    }

    const rows = await prisma.attendance.findMany({
      where: {
        scheduleId: { in: filteredSchedIds },
        timestamp: { gte: from, lte: to },
      },
      select: { status: true, timestamp: true },
      orderBy: { timestamp: "asc" },
    });

    const dayMap = new Map<
      string,
      { date: string; present: number; absent: number; late: number; excused: number; total: number }
    >();

    for (let i = 0; i < days; i++) {
      const d = new Date(from.getTime() + i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().slice(0, 10);
      dayMap.set(key, { date: key, present: 0, absent: 0, late: 0, excused: 0, total: 0 });
    }

    for (const r of rows) {
      const key = new Date(r.timestamp).toISOString().slice(0, 10);
      const bucket = dayMap.get(key);
      if (!bucket) continue;
      bucket.total += 1;
      if (r.status === AttendanceStatus.PRESENT) bucket.present += 1;
      else if (r.status === AttendanceStatus.ABSENT) bucket.absent += 1;
      else if (r.status === AttendanceStatus.LATE) bucket.late += 1;
      else if (r.status === AttendanceStatus.EXCUSED) bucket.excused += 1;
    }

    const daysArr = Array.from(dayMap.values());

    return NextResponse.json({
      days: daysArr,
      subjects: Array.from(subjectSet, ([code, name]) => ({ code, name })),
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Failed to fetch trends" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
