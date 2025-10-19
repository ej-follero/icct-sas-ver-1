export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ReportStatus, ReportType } from "@prisma/client";

/**
 * Create a ReportLog row for the current analytics view.
 * Body:
 * {
 *   instructorId: number,
 *   start: "YYYY-MM-DD",
 *   end: "YYYY-MM-DD",
 *   reportName: string,
 *   reportType?: ReportType,
 *   description?: string,
 *   fileFormat?: string,
 *   filepath?: string | null,
 *   parameters?: any
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const {
      instructorId,
      start,
      end,
      reportName,
      reportType = "STUDENT_ATTENDANCE",
      description,
      fileFormat = "CSV",
      filepath,
      parameters,
    } = await req.json();

    if (!instructorId || !start || !end || !reportName) {
      return NextResponse.json(
        {
          ok: false,
          error: "instructorId, start, end, reportName are required",
        },
        { status: 400 }
      );
    }

    const row = await prisma.reportLog.create({
      data: {
        generatedBy: Number(instructorId), // who generated it
        reportType: reportType as ReportType,
        reportName,
        description: description ?? null,
        startDate: new Date(start),
        endDate: new Date(end),
        status: ReportStatus.COMPLETED,
        fileFormat,
        filepath: filepath ?? null,
        // store inputs so view can filter by instructor even if generatedBy differs
        parameters: {
          ...(parameters ?? {}),
          instructorId: Number(instructorId),
          start,
          end,
        },
      },
      select: {
        reportId: true,
        reportName: true,
        status: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ ok: true, report: row }, { status: 200 });
  } catch (e: any) {
    console.error("[/api/reports/save] error:", e);
    return NextResponse.json(
      { ok: false, error: e?.message || "Failed to save report" },
      { status: 500 }
    );
  }
}
