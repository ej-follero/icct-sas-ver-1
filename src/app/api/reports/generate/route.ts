export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { PrismaClient, AttendanceStatus, ScheduleStatus } from "@prisma/client";

const prisma = new PrismaClient();

/* ---------------- helpers ---------------- */

type RangeKey = "7d" | "30d" | "90d" | "all" | "custom";

function normalize(v: string | null): string | undefined {
  return v ?? undefined;
}

function resolveRange(
  now: Date,
  range: RangeKey,
  start?: string,
  end?: string
): { from?: Date; to?: Date } {
  if (range === "all") return {};
  if (range === "custom") {
    if (!start || !end) return {};
    return { from: new Date(start), to: new Date(end) };
  }
  const to = now;
  const from = new Date(now);
  if (range === "7d") from.setDate(from.getDate() - 7);
  else if (range === "30d") from.setDate(from.getDate() - 30);
  else if (range === "90d") from.setDate(from.getDate() - 90);
  return { from, to };
}

function pct(n: number, d: number) {
  if (!d) return 0;
  return Math.round((n / d) * 1000) / 10;
}

/* --------------- GET: build the table data --------------- */

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);

    const instructorId = Number(url.searchParams.get("instructorId"));
    if (!instructorId || Number.isNaN(instructorId)) {
      return NextResponse.json(
        { error: "instructorId is required" },
        { status: 400 }
      );
    }

    const subjectId = url.searchParams.get("subjectId")
      ? Number(url.searchParams.get("subjectId"))
      : undefined;

    const rangeParam = (url.searchParams.get("range") ?? "30d") as RangeKey;
    const start = normalize(url.searchParams.get("start"));
    const end = normalize(url.searchParams.get("end"));
    const now = new Date();
    const { from, to } = resolveRange(now, rangeParam, start, end);

    // 1) Instructor's ACTIVE schedules (optionally filter by subject)
    const schedules = await prisma.subjectSchedule.findMany({
      where: {
        instructorId,
        status: ScheduleStatus.ACTIVE,
        ...(subjectId ? { subjectId } : {}),
      },
      select: {
        subjectSchedId: true, // might be nullable in your schema
        subject: { select: { subjectCode: true, subjectName: true } },
        section: { select: { sectionName: true } },
        // add room if you actually have it (else remove)
        // room: true,
      },
      orderBy: [{ subjectId: "asc" }, { sectionId: "asc" }],
    });

    // SAFETY: filter out null schedule IDs before using them as numbers
    const scheduleIds = schedules
      .map((s) => s.subjectSchedId)
      .filter((id): id is number => typeof id === "number");

    if (scheduleIds.length === 0) {
      return NextResponse.json({
        summary: { total: 0, present: 0, absent: 0, late: 0, excused: 0 },
        items: [],
      });
    }

    // Map scheduleId -> meta
    const scheduleMeta = new Map<
      number,
      { subjCode: string; subjName: string; section: string; room: string | null }
    >();
    for (const s of schedules) {
      if (s.subjectSchedId == null) continue; // <-- fix: skip null
      scheduleMeta.set(s.subjectSchedId, {
        subjCode: s.subject.subjectCode,
        subjName: s.subject.subjectName,
        section: s.section.sectionName,
        room: null, // replace if you select a real room field
      });
    }

    // 2) Pull attendance rows under those schedules & date range
    const where: any = {
      scheduleId: { in: scheduleIds },
    };
    if (from || to) {
      where.timestamp = {};
      if (from) where.timestamp.gte = from;
      if (to) where.timestamp.lte = to;
    }

    const logs = await prisma.attendance.findMany({
      where,
      select: {
        attendanceId: true,
        scheduleId: true,
        timestamp: true,
        status: true,
        Student: {
          select: {
            studentId: true,
            studentIdNum: true,
            firstName: true,
            middleName: true,
            lastName: true,
          },
        },
      },
      orderBy: [{ timestamp: "asc" }],
    });

    // 3) Transform to the simple "Generate Report" table items
    type Row = {
      date: string;
      subject: string;
      section: string;
      status: AttendanceStatus;
      studentIds: string[];
    };

    const rows: Row[] = logs.map((log) => {
      const meta = log.scheduleId ? scheduleMeta.get(log.scheduleId) : undefined;
      const date = new Date(log.timestamp);
      const dateStr = date.toISOString().slice(0, 10);
      const subj = meta ? `${meta.subjCode} — ${meta.subjName}` : "—";
      const sect = meta ? meta.section : "—";

      const studentIds =
        log.Student?.map((s) => s.studentIdNum).filter(Boolean) ?? [];

      return {
        date: dateStr,
        subject: subj,
        section: sect,
        status: log.status,
        studentIds,
      };
    });

    // 4) Compute summary cards
    const total = rows.length;
    const present = rows.filter((r) => r.status === AttendanceStatus.PRESENT).length;
    const absent = rows.filter((r) => r.status === AttendanceStatus.ABSENT).length;
    const late = rows.filter((r) => r.status === AttendanceStatus.LATE).length;
    const excused = rows.filter((r) => r.status === AttendanceStatus.EXCUSED).length;

    return NextResponse.json({
      summary: { total, present, absent, late, excused, rate: pct(present, total) },
      items: rows.map((r) => ({
        date: r.date,
        subject: r.subject,
        section: r.section,
        status: r.status,
        studentIds: r.studentIds.join(", "),
      })),
    });
  } catch (e: any) {
    console.error("[reports.generate] error", e);
    return NextResponse.json(
      { error: e?.message ?? "Failed to generate report" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
