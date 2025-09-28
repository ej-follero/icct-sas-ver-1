// app/api/reports/route.ts
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import {
  PrismaClient,
  ReportStatus,
  ReportType,
  Role,
  AttendanceStatus,
} from "@prisma/client";

const prisma = new PrismaClient();
const DIR = path.join(process.cwd(), "public", "reports");

function ensureDir() {
  if (!fs.existsSync(DIR)) fs.mkdirSync(DIR, { recursive: true });
}
function listItems() {
  ensureDir();
  return fs
    .readdirSync(DIR)
    .map((name) => {
      const full = path.join(DIR, name);
      const stat = fs.statSync(full);
      if (!stat.isFile()) return null;
      return {
        name,
        size: stat.size,
        mtime: stat.mtime.toISOString(),
        url: `/reports/${encodeURIComponent(name)}`,
      };
    })
    .filter(Boolean);
}
function csvEscape(cell: unknown) {
  const s = String(cell ?? "");
  return /[,"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
function toCsv(headers: string[], rows: any[][]) {
  const head = headers.join(",");
  const body = rows.map((r) => r.map(csvEscape).join(",")).join("\n");
  return head + "\n" + (body ? body + "\n" : "");
}

export async function GET() {
  try {
    return NextResponse.json({ items: listItems() });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Failed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    if (action === "save-sample") {
      ensureDir();
      const name = `sample_${Date.now()}.csv`;
      fs.writeFileSync(path.join(DIR, name), "col1,col2\nA,B\n");
      return NextResponse.json({ ok: true, name });
    }

    if (action === "save") {
      const { headers, rows, filenameBase } = (await req.json()) as {
        headers?: string[];
        rows?: string[][];
        filenameBase?: string;
      };
      if (!Array.isArray(headers) || !Array.isArray(rows)) {
        return NextResponse.json({ error: "headers[] and rows[][] are required" }, { status: 400 });
      }
      ensureDir();
      const safeBase =
        (filenameBase || "report").replace(/[^a-zA-Z0-9_\-]/g, "_").slice(0, 60) || "report";
      const name = `${safeBase}_${Date.now()}.csv`;
      fs.writeFileSync(path.join(DIR, name), toCsv(headers, rows));
      return NextResponse.json({ ok: true, name });
    }

    if (action === "delete") {
      const { name } = (await req.json()) as { name?: string };
      if (!name || typeof name !== "string") {
        return NextResponse.json({ error: "name is required" }, { status: 400 });
      }
      if (name.includes("/") || name.includes("\\")) {
        return NextResponse.json({ error: "invalid filename" }, { status: 400 });
      }
      const full = path.join(DIR, name);
      if (!fs.existsSync(full)) {
        return NextResponse.json({ error: "file not found" }, { status: 404 });
      }
      fs.unlinkSync(full);
      return NextResponse.json({ ok: true });
    }

    if (action === "export-attendance") {
      const body = (await req.json()) as {
        generatedBy: number;
        start: string;
        end: string;
        role?: Role;
        sectionId?: number;
        status?: AttendanceStatus;
      };

      const start = new Date(body.start);
      const end = new Date(body.end);

      const log = await prisma.reportLog.create({
        data: {
          generatedBy: body.generatedBy,
          reportType: ReportType.ATTENDANCE_SUMMARY,
          reportName: `attendance_${start.toISOString().slice(0, 10)}_${end
            .toISOString()
            .slice(0, 10)}`,
          startDate: start,
          endDate: end,
          status: ReportStatus.GENERATING,
          fileFormat: "csv",
          parameters: body as any,
        },
      });

      try {
        const where: any = { timestamp: { gte: start, lte: end } };
        if (body.role) where.userRole = body.role;
        if (body.status) where.status = body.status;
        if (body.sectionId) {
          where.SubjectSchedule = {
            some: { sectionId: body.sectionId },
          };
        }

        const records = await prisma.attendance.findMany({
          where,
          orderBy: { timestamp: "asc" },
          include: {
            user: true,
            SubjectSchedule: {
              include: {
                section: { include: { Course: true } },
                subject: true,
                room: true,
              },
            },
          },
        });

        const headers = [
          "AttendanceID",
          "UserRole",
          "UserName",
          "Email",
          "Status",
          "Type",
          "Verification",
          "Timestamp",
          "CheckOutTime",
          "Duration",
          "Section",
          "CourseCode",
          "CourseName",
          "SubjectCode",
          "SubjectName",
          "Room",
          "Day",
          "StartTime",
          "EndTime",
          "ScheduleId",
          "EventId",
        ];

        const rows = records.map((r) => {
          const sch = r.SubjectSchedule?.[0];
          const sectionName = sch?.section?.sectionName ?? "";
          const courseCode = sch?.section?.Course?.courseCode ?? "";
          const courseName = sch?.section?.Course?.courseName ?? "";
          const subjectCode = sch?.subject?.subjectCode ?? "";
          const subjectName = sch?.subject?.subjectName ?? "";
          const roomNo = sch?.room?.roomNo ?? "";
          const day = sch?.day ?? "";
          const startTime = sch?.startTime ?? "";
          const endTime = sch?.endTime ?? "";
          return [
            r.attendanceId,
            r.userRole,
            r.user?.userName ?? "",
            r.user?.email ?? "",
            r.status,
            r.attendanceType,
            r.verification,
            r.timestamp.toISOString(),
            r.checkOutTime ? r.checkOutTime.toISOString() : "",
            r.duration ?? "",
            sectionName,
            courseCode,
            courseName,
            subjectCode,
            subjectName,
            roomNo,
            day,
            startTime,
            endTime,
            r.scheduleId ?? "",
            r.eventId ?? "",
          ];
        });

        ensureDir();
        const filename = `${log.reportName}_${Date.now()}.csv`;
        const full = path.join(DIR, filename);
        fs.writeFileSync(full, toCsv(headers, rows));
        const size = fs.statSync(full).size;

        await prisma.reportLog.update({
          where: { reportId: log.reportId },
          data: {
            status: ReportStatus.COMPLETED,
            filepath: `/reports/${filename}`,
            fileSize: size,
          },
        });

        return NextResponse.json({ ok: true, name: filename, count: rows.length });
      } catch (err: any) {
        await prisma.reportLog.update({
          where: { reportId: log.reportId },
          data: { status: ReportStatus.FAILED, error: String(err?.message ?? err) },
        });
        return NextResponse.json({ error: String(err?.message ?? err) }, { status: 500 });
      }
    }

    return NextResponse.json({ error: "Unsupported POST action" }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Failed" }, { status: 500 });
  }
}
