export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient, AttendanceStatus, ScheduleStatus } from "@prisma/client";

const prisma = new PrismaClient();

function dayBounds(iso?: string) {
  const d = iso ? new Date(iso) : new Date();
  const start = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0));
  const end = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 23, 59, 59, 999));
  return { start, end };
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const instructorId = Number(url.searchParams.get("instructorId"));
    const dateStr = url.searchParams.get("date") || undefined;

    if (!instructorId || Number.isNaN(instructorId)) {
      return NextResponse.json({ error: "instructorId is required" }, { status: 400 });
    }

    const { start, end } = dayBounds(dateStr);

    const schedules = await prisma.subjectSchedule.findMany({
      where: { instructorId, status: ScheduleStatus.ACTIVE },
      select: {
        subjectSchedId: true,
        academicYear: true,
        semester: true,
        subject: { select: { subjectCode: true, subjectName: true } },
        section: { select: { sectionName: true } },
        room: { select: { roomNo: true } },
      },
      orderBy: [{ subjectId: "asc" }, { sectionId: "asc" }],
    });

    const items = [];
    let grandPresent = 0;
    let grandAbsent = 0;
    let grandLate = 0;
    let grandExcused = 0;

    for (const s of schedules) {
      const buckets = await prisma.attendance.groupBy({
        by: ["status"],
        where: {
          scheduleId: s.subjectSchedId,
          timestamp: { gte: start, lte: end },
        },
        _count: { _all: true },
      });

      const present = buckets.find(b => b.status === AttendanceStatus.PRESENT)?._count._all ?? 0;
      const absent = buckets.find(b => b.status === AttendanceStatus.ABSENT)?._count._all ?? 0;
      const late = buckets.find(b => b.status === AttendanceStatus.LATE)?._count._all ?? 0;
      const excused = buckets.find(b => b.status === AttendanceStatus.EXCUSED)?._count._all ?? 0;

      const total = present + absent + late + excused;
      const rate = total === 0 ? 0 : Math.round((present / total) * 100);

      grandPresent += present;
      grandAbsent += absent;
      grandLate += late;
      grandExcused += excused;

      items.push({
        scheduleId: s.subjectSchedId,
        code: s.subject.subjectCode,
        subject: s.subject.subjectName,
        section: s.section.sectionName,
        room: s.room.roomNo,
        present,
        absent,
        late,
        excused,
        total,
        rate,
        academicYear: s.academicYear ?? "",
        semester: s.semester ?? "",
      });
    }

    const grandTotal = grandPresent + grandAbsent + grandLate + grandExcused;
    const overallRate = grandTotal === 0 ? 0 : Math.round((grandPresent / grandTotal) * 100);

    return NextResponse.json({
      date: start.toISOString().slice(0, 10),
      totals: {
        present: grandPresent,
        absent: grandAbsent,
        late: grandLate,
        excused: grandExcused,
        total: grandTotal,
        rate: overallRate,
      },
      items,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Failed to fetch daily" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
