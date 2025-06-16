import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = parseInt(searchParams.get("pageSize") || "10", 10);
    const search = searchParams.get("search") || "";
    const severity = searchParams.get("severity") || "";
    const eventType = searchParams.get("eventType") || "";
    const readerId = searchParams.get("readerId") || "";
    const startDate = searchParams.get("startDate") || "";
    const endDate = searchParams.get("endDate") || "";
    const sortBy = searchParams.get("sortBy") || "timestamp";
    const sortDir = searchParams.get("sortDir") === "asc" ? "asc" : "desc";

    // Build where clause
    const where: any = {};
    if (search) {
      where.OR = [
        { message: { contains: search, mode: "insensitive" } },
        { ipAddress: { contains: search, mode: "insensitive" } },
        { resolution: { contains: search, mode: "insensitive" } },
      ];
    }
    if (severity) where.severity = severity;
    if (eventType) where.eventType = eventType;
    if (readerId) where.readerId = parseInt(readerId);
    if (startDate && endDate) {
      where.timestamp = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const total = await prisma.rFIDReaderLogs.count({ where });
    const logs = await prisma.rFIDReaderLogs.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { [sortBy]: sortDir },
      include: {
        reader: {
          select: {
            readerId: true,
            deviceId: true,
            deviceName: true,
            roomId: true,
          },
        },
      },
    });
    return NextResponse.json({ data: logs, total });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch RFID reader logs" }, { status: 500 });
  }
} 