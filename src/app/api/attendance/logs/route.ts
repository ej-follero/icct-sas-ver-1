// /app/api/attendance/logs/route.ts
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const fmtDate = (d: Date) => d.toISOString().split("T")[0];
const fmtTime = (d?: Date | null) =>
  d ? d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "—";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const instructorId = Number(searchParams.get("instructorId"));
    const date = searchParams.get("date");          // optional
    const status = searchParams.get("status");      // optional
    const studentQ = searchParams.get("student");   // optional

    if (!instructorId || Number.isNaN(instructorId)) {
      return NextResponse.json({ error: "instructorId is required" }, { status: 400 });
    }

    const where: any = {
      userRole: "STUDENT",
      SubjectSchedule: { some: { instructorId } },  // attendance linked to this instructor's schedules
    };

    if (date) {
      const start = new Date(date); start.setHours(0,0,0,0);
      const end = new Date(date);   end.setHours(23,59,59,999);
      where.timestamp = { gte: start, lte: end };
    }
    if (status && status !== "ALL") where.status = status;

    if (studentQ) {
      where.Student = {
        some: {
          OR: [
            { studentIdNum: { contains: studentQ, mode: "insensitive" } },
            { firstName:    { contains: studentQ, mode: "insensitive" } },
            { lastName:     { contains: studentQ, mode: "insensitive" } },
          ],
        },
      };
    }

    const records = await prisma.attendance.findMany({
      where,
      include: {
        Student: true,
        SubjectSchedule: {
          include: {
            subject: true,
            section: true,
            room: true,
          },
        },
      },
      orderBy: { timestamp: "desc" },
    });

    const items = records.map((r) => {
      const student = r.Student?.[0];
      const sched = r.SubjectSchedule?.[0];

      return {
        date: fmtDate(r.timestamp),
        studentId: student?.studentIdNum ?? "-",
        studentName: student ? `${student.firstName} ${student.lastName}` : "-",
        subject: sched?.subject?.subjectName ?? "-",
        section: sched?.section?.sectionName ?? "-",
        room: sched?.room?.roomNo ?? "-",
        in: fmtTime(r.timestamp),
        out: fmtTime(r.checkOutTime),
        status: r.status,
        remarks: r.notes ?? "—",
      };
    });

    return NextResponse.json({ items });
  } catch (e: any) {
    console.error("[logs] error:", e);
    return NextResponse.json({ error: e?.message ?? "Failed to fetch attendance logs" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
