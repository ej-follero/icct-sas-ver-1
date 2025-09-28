export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient, AttendanceStatus } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const instructorId = Number(url.searchParams.get("instructorId"));

    if (!instructorId || Number.isNaN(instructorId)) {
      return NextResponse.json({ error: "instructorId required" }, { status: 400 });
    }

    // Find all schedules for this instructor
    const schedules = await prisma.subjectSchedule.findMany({
      where: { instructorId },
      select: { subjectSchedId: true, subject: { select: { subjectCode: true, subjectName: true } } },
    });

    const subjectMap: Record<string, any> = {};
    for (const sched of schedules) {
      const att = await prisma.attendance.groupBy({
        by: ["status"],
        where: { scheduleId: sched.subjectSchedId },
        _count: { status: true },
      });

      const total = att.reduce((s, a) => s + a._count.status, 0);
      subjectMap[sched.subject.subjectCode] = {
        name: sched.subject.subjectName,
        total,
        present: att.find(a => a.status === AttendanceStatus.PRESENT)?._count.status ?? 0,
        absent: att.find(a => a.status === AttendanceStatus.ABSENT)?._count.status ?? 0,
        late: att.find(a => a.status === AttendanceStatus.LATE)?._count.status ?? 0,
        excused: att.find(a => a.status === AttendanceStatus.EXCUSED)?._count.status ?? 0,
      };
    }

    return NextResponse.json({ items: Object.entries(subjectMap).map(([code, d]) => ({ code, ...d })) });
  } catch (e: any) {
    console.error("[overview] error", e);
    return NextResponse.json({ error: e?.message ?? "Failed to fetch overview" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
