// src/app/api/reports/generate/route.ts
import { NextRequest, NextResponse } from "next/server";
import {
  PrismaClient,
  AttendanceStatus,
  ReportStatus,
  ReportType,
} from "@prisma/client";
import fs from "node:fs/promises";
import path from "node:path";

const prisma = new PrismaClient();

/* ---------------------------------------
   Helper: aggregate attendance per student
----------------------------------------*/
async function aggregateAttendance(
  instructorId: number,
  startDate: Date,
  endDate: Date
) {
  const logs = await prisma.attendance.findMany({
    where: {
      instructorId,
      timestamp: { gte: startDate, lte: endDate },
      studentId: { not: null },
    },
    select: {
      status: true,
      timestamp: true,
      student: {
        select: {
          studentId: true,
          studentIdNum: true,
          firstName: true,
          lastName: true,
        },
      },
      subjectSchedule: {
        select: {
          subjectSchedId: true,
          subject: { select: { subjectName: true, subjectCode: true } },
          section: { select: { sectionName: true } },
        },
      },
    },
    orderBy: { timestamp: "asc" },
  });

  type Row = {
    studentId: number;
    idNumber: string;
    name: string;
    section: string;
    subject: string;
    present: number;
    absent: number;
    late: number;
    excused: number;
    lastSeen: string | null;
  };

  const byStudent = new Map<number, Row>();

  for (const log of logs) {
    const s = log.student!;
    const ss = log.subjectSchedule;

    const key = s.studentId;
    if (!byStudent.has(key)) {
      byStudent.set(key, {
        studentId: s.studentId,
        idNumber: s.studentIdNum,
        name: `${s.lastName}, ${s.firstName}`,
        section: ss?.section?.sectionName ?? "-",
        subject: ss?.subject?.subjectName ?? "-",
        present: 0,
        absent: 0,
        late: 0,
        excused: 0,
        lastSeen: null,
      });
    }

    const row = byStudent.get(key)!;
    switch (log.status) {
      case AttendanceStatus.PRESENT:
        row.present += 1;
        break;
      case AttendanceStatus.ABSENT:
        row.absent += 1;
        break;
      case AttendanceStatus.LATE:
        row.late += 1;
        break;
      case AttendanceStatus.EXCUSED:
        row.excused += 1;
        break;
    }
    if (!row.lastSeen || new Date(row.lastSeen) < log.timestamp) {
      row.lastSeen = log.timestamp.toISOString();
    }
  }

  const items = Array.from(byStudent.values()).sort((a, b) => {
    const totA = a.present + a.absent + a.late + a.excused || 1;
    const totB = b.present + b.absent + b.late + b.excused || 1;
    const arA = a.absent / totA;
    const arB = b.absent / totB;
    if (arB !== arA) return arB - arA;
    if (b.absent !== a.absent) return b.absent - a.absent;
    return a.name.localeCompare(b.name);
  });

  const totals = items.reduce(
    (acc, r) => {
      acc.present += r.present;
      acc.absent += r.absent;
      acc.late += r.late;
      acc.excused += r.excused;
      return acc;
    },
    { present: 0, absent: 0, late: 0, excused: 0 }
  );

  const total = totals.present + totals.absent + totals.late + totals.excused;
  const attendanceRate = total
    ? Math.round(((total - totals.absent) / total) * 100)
    : 0;

  return { items, totals: { ...totals, total }, attendanceRate };
}

/* -------------------------
   GET (your original logic)
--------------------------*/
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const instructorId = Number(url.searchParams.get("instructorId"));
  const start = url.searchParams.get("start");
  const end = url.searchParams.get("end");

  if (!instructorId || !start || !end) {
    return NextResponse.json(
      { error: "Missing required parameters: instructorId, start, end" },
      { status: 400 }
    );
  }

  try {
    const startDate = new Date(start);
    const endDate = new Date(end);
    endDate.setHours(23, 59, 59, 999);

    const { items, totals, attendanceRate } = await aggregateAttendance(
      instructorId,
      startDate,
      endDate
    );

    return NextResponse.json({
      meta: {
        instructorId,
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        totalRecords: items.length,
        attendanceRate,
      },
      items,
      totals,
    });
  } catch (e: any) {
    console.error("GET /api/reports/generate error:", e);
    return NextResponse.json(
      { error: "Failed to fetch report" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

/* ------------------------------------
   POST — create a ReportLog row (View)
-------------------------------------*/
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));

  const instructorId = Number(body.instructorId);
  const reportName = (body.reportName || "Attendance Summary").toString();
  const reportType =
    (ReportType as any)?.[
      (body.reportType || "ATTENDANCE_SUMMARY").toUpperCase()
    ] ?? ReportType.CUSTOM;

  if (!instructorId) {
    return NextResponse.json(
      { message: "instructorId required" },
      { status: 400 }
    );
  }

  try {
    const now = new Date();
    const startDate = body.start
      ? new Date(body.start)
      : new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const endDate = body.end ? new Date(body.end) : now;
    endDate.setHours(23, 59, 59, 999);

    // 1) create ReportLog as GENERATING
    const log = await prisma.reportLog.create({
      data: {
        generatedBy: instructorId, // ← your schema: equals User.userId
        reportName,
        reportType,
        description: body.description ?? null,
        startDate,
        endDate,
        status: ReportStatus.GENERATING,
        parameters: { instructorId, startDate, endDate },
        fileFormat: "CSV",
      },
    });

    // 2) aggregate data (same as GET)
    const { items } = await aggregateAttendance(
      instructorId,
      startDate,
      endDate
    );

    // 3) optional: write CSV file if requested
    let filepath: string | null = null;
    let fileSize: number | null = null;

    if (body.saveFile) {
      const header =
        "Student ID,ID Number,Name,Section,Subject,Present,Absent,Late,Excused,Last Seen\n";
      const csvBody = items
        .map((r) =>
          [
            r.studentId,
            r.idNumber,
            `"${r.name}"`,
            `"${r.section}"`,
            `"${r.subject}"`,
            r.present,
            r.absent,
            r.late,
            r.excused,
            r.lastSeen ?? "",
          ].join(",")
        )
        .join("\n");
      const csv = header + csvBody;

      const filename = `attendance_${log.reportId}.csv`;
      const outDir = path.join(process.cwd(), "public", "reports");
      await fs.mkdir(outDir, { recursive: true });
      await fs.writeFile(path.join(outDir, filename), csv, "utf8");

      filepath = `/reports/${filename}`;
      fileSize = Buffer.byteLength(csv, "utf8");
    }

    // 4) mark COMPLETED and attach file info (if any)
    const updated = await prisma.reportLog.update({
      where: { reportId: log.reportId },
      data: {
        status: ReportStatus.COMPLETED,
        filepath,
        fileFormat: filepath ? "CSV" : null,
        fileSize,
      },
      select: {
        reportId: true,
        reportName: true,
        reportType: true,
        startDate: true,
        endDate: true,
        status: true,
        createdAt: true,
        filepath: true,
        fileFormat: true,
        fileSize: true,
      },
    });

    return NextResponse.json({ item: updated }, { status: 201 });
  } catch (e: any) {
    console.error("POST /api/reports/generate error:", e);
    return NextResponse.json(
      { message: "failed", detail: e?.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
