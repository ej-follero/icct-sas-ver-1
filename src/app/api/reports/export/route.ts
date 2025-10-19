// src/app/api/reports/export/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { AttendanceStatus, ReportStatus, ReportType } from "@prisma/client";
import fs from "node:fs";
import path from "node:path";

/** ---- helpers ---- */

function toISODateEndInclusive(d: Date) {
  const z = new Date(d);
  z.setHours(23, 59, 59, 999);
  return z;
}

function escCSV(v: any) {
  if (v == null) return "";
  const s = String(v);
  const needs = s.includes(",") || s.includes('"') || s.includes("\n");
  return needs ? `"${s.replace(/"/g, '""')}"` : s;
}

function dirEnsure(p: string) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

/** ---- main ---- */

export async function POST(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const instructorId = Number(url.searchParams.get("instructorId")); // ← keep your current pattern
    const { start, end } = await req.json();

    if (!instructorId || Number.isNaN(instructorId)) {
      return NextResponse.json(
        { error: "Missing/invalid instructorId" },
        { status: 400 }
      );
    }
    if (!start || !end) {
      return NextResponse.json({ error: "Missing start/end" }, { status: 400 });
    }

    const startDate = new Date(start);
    const endDate = toISODateEndInclusive(new Date(end));

    // Pull minimal rows
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
            subject: { select: { subjectName: true, subjectCode: true } },
            section: { select: { sectionName: true } },
          },
        },
      },
      orderBy: { timestamp: "asc" },
    });

    // Aggregate by student
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

    const map = new Map<number, Row>();
    for (const a of logs) {
      const s = a.student!;
      const ss = a.subjectSchedule;
      const key = s.studentId;
      if (!map.has(key)) {
        map.set(key, {
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
      const r = map.get(key)!;
      switch (a.status) {
        case AttendanceStatus.PRESENT:
          r.present++;
          break;
        case AttendanceStatus.ABSENT:
          r.absent++;
          break;
        case AttendanceStatus.LATE:
          r.late++;
          break;
        case AttendanceStatus.EXCUSED:
          r.excused++;
          break;
      }
      if (!r.lastSeen || new Date(r.lastSeen) < a.timestamp) {
        r.lastSeen = a.timestamp.toISOString();
      }
    }
    const items = Array.from(map.values());

    // 1) Create ReportLog (PENDING)
    const report = await prisma.reportLog.create({
      data: {
        generatedBy: instructorId,
        reportType: ReportType.STUDENT_ATTENDANCE,
        reportName: "Attendance Analytics",
        description: `Analytics from ${start} to ${end}`,
        startDate: startDate,
        endDate: endDate,
        status: ReportStatus.PENDING,
        fileFormat: "CSV",
        parameters: { instructorId, start, end },
      },
      select: { reportId: true },
    });

    // 2) Build CSV text
    const csvHeader = [
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
    ].join(",");

    const csvRows = items.map((r) =>
      [
        r.studentId,
        escCSV(r.idNumber),
        escCSV(r.name),
        escCSV(r.section),
        escCSV(r.subject),
        r.present,
        r.absent,
        r.late,
        r.excused,
        r.lastSeen ? new Date(r.lastSeen).toISOString() : "",
      ].join(",")
    );

    const csv = [csvHeader, ...csvRows].join("\n");

    // 3) Write to /tmp and store path (works dev & server)
    const baseDir = path.join("/tmp", "reports");
    dirEnsure(baseDir);
    const filename = `attendance_${report.reportId}_i${instructorId}_${start}_${end}.csv`;
    const absPath = path.join(baseDir, filename);
    fs.writeFileSync(absPath, csv, "utf-8");
    const fileSize = fs.statSync(absPath).size;

    // 4) Mark COMPLETED with file info
    await prisma.reportLog.update({
      where: { reportId: report.reportId },
      data: {
        status: ReportStatus.COMPLETED,
        filepath: absPath, // store absolute server path
        fileSize: fileSize,
        fileFormat: "CSV",
      },
    });

    // 5) Return small payload (UI can toast success)
    return NextResponse.json({
      ok: true,
      reportId: report.reportId,
      fileFormat: "CSV",
      fileSize,
      downloadUrl: `/api/reports/file/${report.reportId}`, // UI can open this
      count: items.length,
    });
  } catch (e: any) {
    console.error("POST /api/reports/export error:", e);
    return NextResponse.json(
      { error: e?.message ?? "Failed to export" },
      { status: 500 }
    );
  }
}
