import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { AttendanceStatus } from "@prisma/client";
import fs from "node:fs/promises";
import path from "node:path";

// Build a CSV safely
function csvEscape(v: string | number | null | undefined) {
  if (v === null || v === undefined) return "";
  const s = String(v);
  const needs = s.includes(",") || s.includes('"') || s.includes("\n");
  return needs ? `"${s.replace(/"/g, '""')}"` : s;
}
function rowsToCsv(rows: any[]) {
  const header = [
    "Student ID",
    "ID Number",
    "Name",
    "Section",
    "Subject",
    "Present",
    "Absent",
    "Late",
    "Excused",
    "Last Seen",
  ];
  const lines = [header.join(",")];
  for (const r of rows) {
    lines.push(
      [
        r.studentId,
        csvEscape(r.idNumber),
        csvEscape(r.name),
        csvEscape(r.section),
        csvEscape(r.subject),
        r.present,
        r.absent,
        r.late,
        r.excused,
        r.lastSeen
          ? new Date(r.lastSeen).toISOString().replace("T", " ").slice(0, 16)
          : "",
      ].join(",")
    );
  }
  return lines.join("\n");
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const reportId = Number(params.id);
  if (!reportId || Number.isNaN(reportId)) {
    return NextResponse.json({ error: "Invalid report id" }, { status: 400 });
  }

  // 1) Look up report log
  const log = await prisma.reportLog.findUnique({
    where: { reportId },
    select: {
      reportId: true,
      reportName: true,
      reportType: true,
      status: true,
      fileFormat: true,
      fileSize: true,
      filepath: true,
      parameters: true, // JSON containing { start, end, instructorId }
      createdAt: true,
    },
  });

  if (!log)
    return NextResponse.json({ error: "Report not found" }, { status: 404 });

  // 2) If a file path exists, try to read and stream it
  if (log.filepath) {
    try {
      // adjust base as needed if you store files elsewhere
      const absolute = path.isAbsolute(log.filepath)
        ? log.filepath
        : path.join(process.cwd(), log.filepath.replace(/^\/+/, ""));
      const data = await fs.readFile(absolute);
      const fmt = (log.fileFormat || "csv").toLowerCase();
      const ext = fmt === "csv" ? "csv" : "txt";

      return new NextResponse(data, {
        status: 200,
        headers: {
          "Content-Type":
            fmt === "csv" ? "text/csv" : "application/octet-stream",
          "Content-Disposition": `attachment; filename="report_${reportId}.${ext}"`,
        },
      });
    } catch {
      // fall through to on-the-fly generation
    }
  }

  // 3) No file? Re-generate from parameters (CSV only)
  // Expecting parameters like { start: "YYYY-MM-DD", end: "YYYY-MM-DD", instructorId: 7 }
  const p = (log as any).parameters || {};
  const start = p?.start ? new Date(p.start) : null;
  const end = p?.end ? new Date(p.end) : null;
  const instructorId = Number(p?.instructorId);

  if (!start || !end || !instructorId || Number.isNaN(instructorId)) {
    return NextResponse.json(
      { error: "File not found and parameters are missing to regenerate." },
      { status: 404 }
    );
  }

  // make end inclusive (end of day)
  end.setHours(23, 59, 59, 999);

  // Pull attendance and aggregate (same logic as your /api/reports/generate)
  const logs = await prisma.attendance.findMany({
    where: {
      instructorId,
      timestamp: { gte: start, lte: end },
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
  for (const a of logs) {
    const s = a.student!;
    const ss = a.subjectSchedule;
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
    switch (a.status) {
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
      default:
        break;
    }
    if (!row.lastSeen || new Date(row.lastSeen) < a.timestamp) {
      row.lastSeen = a.timestamp.toISOString();
    }
  }

  const items = Array.from(byStudent.values()).sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  const csv = rowsToCsv(items);
  const fname = `attendance_report_${reportId}.csv`;

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${fname}"`,
    },
  });
}
