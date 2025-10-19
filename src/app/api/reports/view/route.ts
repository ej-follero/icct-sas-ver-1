export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ReportStatus } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const instructorId = Number(searchParams.get("instructorId"));
    const status = searchParams.get("status") as ReportStatus | null;
    const page = Math.max(1, Number(searchParams.get("page") || 1));
    const pageSize = Math.min(
      100,
      Math.max(1, Number(searchParams.get("pageSize") || 10))
    );
    const q = (searchParams.get("q") || "").trim();

    if (!instructorId || Number.isNaN(instructorId)) {
      return NextResponse.json(
        {
          items: [],
          total: 0,
          page,
          pageSize,
          error: "Missing or invalid instructorId",
        },
        { status: 200 }
      );
    }

    // where clause
    const where: any = {
      OR: [
        { generatedBy: instructorId },
        // JSON filter: parameters->>'instructorId' = instructorId
        { parameters: { path: ["instructorId"], equals: instructorId } as any },
      ],
    };

    if (status) where.status = status;
    if (q) {
      (where.AND ??= []).push({
        OR: [
          { reportName: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
        ],
      });
    }

    const [total, items] = await Promise.all([
      prisma.reportLog.count({ where }),
      prisma.reportLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          reportId: true,
          reportName: true,
          reportType: true,
          description: true,
          startDate: true,
          endDate: true,
          status: true,
          fileFormat: true,
          fileSize: true,
          filepath: true,
          createdAt: true,
          parameters: true,
        },
      }),
    ]);

    return NextResponse.json({ items, total, page, pageSize }, { status: 200 });
  } catch (err: any) {
    console.error("[/api/reports/view] FAILED:", err);
    return NextResponse.json(
      {
        items: [],
        total: 0,
        page: 1,
        pageSize: 10,
        error: err?.message || "Failed to fetch reports",
      },
      { status: 200 }
    );
  }
}
