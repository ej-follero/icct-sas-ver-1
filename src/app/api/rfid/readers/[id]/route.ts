import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const reader = await prisma.rFIDReader.findUnique({
      where: { readerId: parseInt(params.id) },
    });
    if (!reader) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(reader);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch RFID reader" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json();
    const reader = await prisma.rFIDReader.update({
      where: { readerId: parseInt(params.id) },
      data: {
        deviceId: data.deviceId,
        deviceName: data.deviceName,
        roomId: data.roomId,
        ipAddress: data.ipAddress,
        status: data.status,
        notes: data.notes,
        components: data.components || {},
        lastSeen: new Date(),
      },
    });
    return NextResponse.json(reader);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update RFID reader" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.rFIDReader.delete({
      where: { readerId: parseInt(params.id) },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete RFID reader" }, { status: 500 });
  }
} 