export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { PrismaClient, AttendanceStatus, ScheduleStatus } from "@prisma/client";

const prisma = new PrismaClient();

/* ---------- helpers ---------- */

type RangeKey = "7d" | "30d" | "all" | "custom";

function normalizeStr(v: string | null): string | undefined {
  return v ?? undefined;
}

function resolveRange(
  now: Date,
  range: RangeKey,
  start?: string | undefined,
  end?: string | undefined
) {
  if (range === "all") return { start: undefined, end: undefined };

  if (range === "custom") {
    if (!start || !end) {
      const to = now;
      const from = new Date(now);
      from.setDate(from.getDate() - 30);
      return { start: from, end: to };
    }
    const from = new Date(start);
    const to = new Date(end);
    return { start: from, end: to };
  }

  const to = now;
  const from = new Date(now);
  if (range === "7d") from.setDate(from.getDate() - 7);
  else if (range === "30d") from.setDate(from.getDate() - 30);
  return { start: from, end: to };
}

function pct(numer: number, denom: number) {
  if (!denom) return 0;
  return Math.round((numer / denom) * 1000) / 10; // 1 decimal
}

/* ---------- GET ---------- */

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

    const topN = url.searchParams.get("top")
      ? Math.max(1, Math.min(50, Number(url.searchParams.get("top")) || 5))
      : 5;

    const search = url.searchParams.get("q")?.trim().toLowerCase() || "";

    const rangeParam = (url.searchParams.get("range") ?? "30d") as RangeKey;
    const start = normalizeStr(url.searchParams.get("start"));
    const end = normalizeStr(url.searchParams.get("end"));

    const now = new Date();
    const { start: from, end: to } = resolveRange(now, rangeParam, start, end);

    /* 1) Instructor’s ACTIVE schedules (+ optional subject filter) */
    const schedules = await prisma.subjectSchedule.findMany({
      where: {
        instructorId,
        status: ScheduleStatus.ACTIVE,
        ...(subjectId ? { subjectId } : {}),
      },
      select: {
        subjectSchedId: true,
        sectionId: true,
      },
    });

    if (schedules.length === 0) {
      return NextResponse.json({
        range: { start: from?.toISOString(), end: to?.toISOString() },
        count: 0,
        items: [],
      });
    }

    const scheduleIds = schedules.map((s) => s.subjectSchedId);
    const sectionIds = Array.from(new Set(schedules.map((s) => s.sectionId)));

    /* 2) Students under those sections
          IMPORTANT: use capitalized relation names (Section, Student) */
    const studentSections = await prisma.studentSection.findMany({
      where: {
        sectionId: { in: sectionIds },
      },
      select: {
        studentId: true,
        Section: { select: { sectionName: true } }, // ← fixed
        Student: {                                   // ← fixed
          select: {
            studentId: true,
            studentIdNum: true,
            firstName: true,
            middleName: true,
            lastName: true,
            gender: true,
            status: true,
          },
        },
      },
    });

    // de-duplicate to latest section per student
    const byStudent = new Map<
      number,
      {
        studentId: number;
        studentNumber: string;
        firstName: string;
        lastName: string;
        middleName: string | null;
        sectionName: string | null;
        gender: string;
        status: string;
      }
    >();

    for (const ss of studentSections) {
      const s = ss.Student; // ← fixed
      byStudent.set(s.studentId, {
        studentId: s.studentId,
        studentNumber: s.studentIdNum,
        firstName: s.firstName,
        lastName: s.lastName,
        middleName: s.middleName ?? null,
        sectionName: ss.Section?.sectionName ?? null, // ← fixed
        gender: s.gender,
        status: s.status,
      });
    }

    const students = Array.from(byStudent.values());
    if (students.length === 0) {
      return NextResponse.json({
        range: { start: from?.toISOString(), end: to?.toISOString() },
        count: 0,
        items: [],
      });
    }

    /* 3) Count ABSENT and TOTAL for each student (scoped to instructor schedules + date range) */
    const items = await Promise.all(
      students.map(async (s) => {
        const baseWhere: any = {
          scheduleId: { in: scheduleIds },
          Student: { some: { studentId: s.studentId } },
        };
        if (from) baseWhere.timestamp = { ...(baseWhere.timestamp || {}), gte: from };
        if (to) baseWhere.timestamp = { ...(baseWhere.timestamp || {}), lte: to };

        const [absences, total] = await Promise.all([
          prisma.attendance.count({
            where: { ...baseWhere, status: AttendanceStatus.ABSENT },
          }),
          prisma.attendance.count({ where: baseWhere }),
        ]);

        const rate = pct(absences, total);
        return {
          studentId: s.studentId,
          studentNumber: s.studentNumber,
          name: `${s.lastName}, ${s.firstName}${s.middleName ? " " + s.middleName : ""}`,
          section: s.sectionName ?? "",
          gender: s.gender,
          status: s.status,
          absences,
          total,
          rate,
        };
      })
    );

    /* 4) Optional search */
    const filtered = !search
      ? items
      : items.filter((it) => {
          const hay = `${it.studentNumber} ${it.name} ${it.section}`.toLowerCase();
          return hay.includes(search);
        });

    /* 5) Rank & cap */
    const top = filtered
      .sort((a, b) => {
        if (b.absences !== a.absences) return b.absences - a.absences;
        if (b.rate !== a.rate) return b.rate - a.rate;
        return a.name.localeCompare(b.name);
      })
      .slice(0, topN);

    return NextResponse.json({
      range: { start: from?.toISOString(), end: to?.toISOString() },
      count: top.length,
      items: top,
    });
  } catch (e: any) {
    console.error("[absentees] error", e);
    return NextResponse.json(
      { error: e?.message ?? "Failed to fetch top absentees" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
