import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = parseInt(searchParams.get("pageSize") || "10", 10);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const room = searchParams.get("room") || "";
    const sortBy = searchParams.get("sortBy") || "deviceId";
    const sortDir = searchParams.get("sortDir") === "desc" ? "desc" : "asc";

    // Build where clause
    const where: any = {
      ...(search && {
        OR: [
          { deviceId: { contains: search, mode: "insensitive" as const } },
          { deviceName: { contains: search, mode: "insensitive" as const } },
        ],
      }),
      ...(status && status !== "all" && { status }),
      ...(room && room !== "all" && { roomId: Number(room) }),
    };

    // Get total count
    const total = await prisma.rFIDReader.count({ where });

    // Get paginated data
    const data = await prisma.rFIDReader.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { [sortBy]: sortDir },
    });

    return NextResponse.json({ data, total });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch RFID readers" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const reader = await prisma.rFIDReader.create({
      data: {
        deviceId: data.deviceId,
        deviceName: data.deviceName,
        roomId: data.roomId,
        ipAddress: data.ipAddress,
        status: data.status,
        notes: data.notes,
        components: data.components || {},
        assemblyDate: new Date(),
        lastSeen: new Date(),
      },
    });
    return NextResponse.json(reader);
  } catch (error) {
    return NextResponse.json({ error: "Failed to create RFID reader" }, { status: 500 });
  }
} 