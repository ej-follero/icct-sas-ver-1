import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ScheduleStatus, SemesterType } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

type DayEnum =
  | "MONDAY"
  | "TUESDAY"
  | "WEDNESDAY"
  | "THURSDAY"
  | "FRIDAY"
  | "SATURDAY"
  | "SUNDAY";

type UiStatus = "ACTIVE" | "INACTIVE" | "CANCELLED";

function niceEnumLabel(v?: string | null) {
  if (!v) return "";
  return v.replace(/([a-z])([A-Z])/g, "$1 $2");
}

function makeSemesterName(
  semesterType: SemesterType,
  academicYear?: string | null,
  year?: number | null
) {
  if (academicYear)
    return `AY ${academicYear} – ${niceEnumLabel(semesterType)}`;
  return `${niceEnumLabel(semesterType)} ${year ?? ""}`.trim();
}

function mapStatus(s: ScheduleStatus): UiStatus {
  if (s === "ACTIVE") return "ACTIVE";
  if (s === "CANCELLED") return "CANCELLED";
  return "INACTIVE"; // collapse other values for your component union type
}

export async function GET(req: NextRequest) {
  try {
    const instructorId = Number(
      new URL(req.url).searchParams.get("instructorId")
    );
    if (!instructorId || Number.isNaN(instructorId) || instructorId <= 0) {
      return NextResponse.json(
        { error: "instructorId is required (positive number)" },
        { status: 400 }
      );
    }

    const rows = await prisma.subjectSchedule.findMany({
      where: { instructorId },
      include: {
        subject: {
          select: { subjectId: true, subjectName: true, subjectCode: true },
        },
        section: {
          select: { sectionId: true, sectionName: true, academicYear: true },
        },
        instructor: {
          select: { instructorId: true, firstName: true, lastName: true },
        },
        room: { select: { roomId: true, roomNo: true, roomBuildingLoc: true } },
        semester: {
          select: { semesterId: true, year: true, semesterType: true },
        },
        _count: { select: { StudentSchedule: true } }, // currentEnrollment
      },
      orderBy: [{ day: "asc" }, { startTime: "asc" }],
    });

    // Explicit type to avoid any "implicit any" warnings in strict TS configs
    const mapped = rows.map(
      (
        r
      ): {
        subjectSchedId: number;
        subjectId: number;
        sectionId: number;
        instructorId: number;
        roomId: number;
        day: DayEnum;
        startTime: string;
        endTime: string;
        slots: number;
        scheduleType: string;
        status: UiStatus;
        semesterId: number;
        academicYear: string;
        isRecurring: boolean;
        startDate: string | null;
        endDate: string | null;
        maxStudents: number;
        currentEnrollment: number;
        notes: string | null;
        createdAt: string;
        updatedAt: string;
        subject: {
          subjectId: number;
          subjectName: string;
          subjectCode: string;
        };
        section: { sectionId: number; sectionName: string };
        instructor: {
          instructorId: number;
          firstName: string;
          lastName: string;
        };
        room: { roomId: number; roomName: string; building: string };
        semester: { semesterId: number; semesterName: string };
      } => {
        const academicYear = r.section?.academicYear ?? null;
        return {
          subjectSchedId: r.subjectSchedId,
          subjectId: r.subjectId,
          sectionId: r.sectionId,
          instructorId: r.instructorId,
          roomId: r.roomId,
          day: r.day as DayEnum,
          startTime: r.startTime,
          endTime: r.endTime,
          slots: r.slots,
          scheduleType: r.scheduleType,
          status: mapStatus(r.status),
          semesterId: r.semesterId,
          academicYear: academicYear ?? `${r.semester?.year ?? ""}`.trim(),
          isRecurring: r.isRecurring,
          startDate: r.startDate ? r.startDate.toISOString() : null,
          endDate: r.endDate ? r.endDate.toISOString() : null,
          maxStudents: r.maxStudents ?? 0,
          currentEnrollment: r._count?.StudentSchedule ?? 0,
          notes: r.notes ?? null,
          createdAt: r.createdAt.toISOString(),
          updatedAt: r.updatedAt.toISOString(),
          subject: {
            subjectId: r.subject.subjectId,
            subjectName: r.subject.subjectName,
            subjectCode: r.subject.subjectCode,
          },
          section: {
            sectionId: r.section.sectionId,
            sectionName: r.section.sectionName,
          },
          instructor: {
            instructorId: r.instructor.instructorId,
            firstName: r.instructor.firstName,
            lastName: r.instructor.lastName,
          },
          room: {
            roomId: r.room.roomId,
            roomName: r.room.roomNo, // what your component expects
            building: niceEnumLabel(r.room.roomBuildingLoc),
          },
          semester: {
            semesterId: r.semester.semesterId,
            semesterName: makeSemesterName(
              r.semester.semesterType,
              academicYear,
              r.semester.year
            ),
          },
        };
      }
    );

    return NextResponse.json(mapped, {
      status: 200,
      headers: { "Cache-Control": "no-store" },
    });
  } catch (err: any) {
    console.error("GET /api/schedules error:", err);
    return NextResponse.json(
      { error: err?.message ?? "Internal Server Error" },
      { status: 500 }
    );
  }
}
