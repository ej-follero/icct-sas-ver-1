export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { PrismaClient, AttendanceStatus } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const instructorId = Number(searchParams.get("instructorId"));
    const dateStr = searchParams.get("date") || undefined;

    if (!instructorId || Number.isNaN(instructorId)) {
      return NextResponse.json({ error: "instructorId is required" }, { status: 400 });
    }

    const schedules = await prisma.subjectSchedule.findMany({
      where: { instructorId },
      select: {
        subjectSchedId: true,
        subject: { select: { subjectName: true, subjectCode: true } },
        section: { select: { sectionName: true } },
        room: { select: { roomNo: true } },
      },
      orderBy: [{ day: "asc" }, { startTime: "asc" }],
    });

    if (schedules.length === 0) return NextResponse.json({ items: [] });

    const scheduleIds = schedules.map(s => s.subjectSchedId);

    let dayStart: Date | undefined;
    let dayEnd: Date | undefined;
    if (dateStr) {
      const d = new Date(dateStr);
      dayStart = new Date(d);
      dayStart.setHours(0, 0, 0, 0);
      dayEnd = new Date(d);
      dayEnd.setHours(23, 59, 59, 999);
    }

    const groups = await prisma.attendance.groupBy({
      by: ["scheduleId", "status"],
      where: {
        scheduleId: { in: scheduleIds },
        ...(dayStart && dayEnd ? { timestamp: { gte: dayStart, lte: dayEnd } } : {}),
      },
      _count: { _all: true },
    });

    const bySchedule = new Map<number, Record<AttendanceStatus, number>>();
    for (const g of groups) {
      const m = bySchedule.get(g.scheduleId!) ?? {
        PRESENT: 0,
        ABSENT: 0,
        LATE: 0,
        EXCUSED: 0,
      };
      m[g.status as AttendanceStatus] += g._count._all;
      bySchedule.set(g.scheduleId!, m);
    }

    const items = schedules.map(s => {
      const counts = bySchedule.get(s.subjectSchedId) ?? {
        PRESENT: 0,
        ABSENT: 0,
        LATE: 0,
        EXCUSED: 0,
      };
      const total =
        counts.PRESENT + counts.ABSENT + counts.LATE + counts.EXCUSED;
      const rate = total === 0 ? 0 : Math.round((counts.PRESENT / total) * 100);

      return {
        scheduleId: s.subjectSchedId,
        subject: s.subject?.subjectName ?? "",
        code: s.subject?.subjectCode ?? "",
        section: s.section?.sectionName ?? "",
        room: s.room?.roomNo ?? "",
        present: counts.PRESENT,
        absent: counts.ABSENT,
        late: counts.LATE,
        excused: counts.EXCUSED,
        total,
        rate,
      };
    });

    return NextResponse.json({ items });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Failed to fetch summary" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
