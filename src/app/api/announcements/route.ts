// app/api/announcements/route.ts
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { PrismaClient, Role, Status, Priority } from "@prisma/client";

const prisma = new PrismaClient();

function toInt(v: string | null, d: number) {
  const n = v ? parseInt(v, 10) : NaN;
  return Number.isFinite(n) && n > 0 ? n : d;
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const q = url.searchParams.get("q")?.trim() || "";
    const role = url.searchParams.get("role") as Role | null;
    const status = url.searchParams.get("status") as Status | null;
    const priority = url.searchParams.get("priority") as Priority | null;
    const page = toInt(url.searchParams.get("page"), 1);
    const pageSize = toInt(url.searchParams.get("pageSize"), 20);

    const where: any = {};
    if (q) {
      where.OR = [
        { title: { contains: q, mode: "insensitive" } },
        { content: { contains: q, mode: "insensitive" } },
      ];
    }
    if (role) where.userType = role;
    if (status) where.status = status;
    if (priority) where.priority = priority;

    const [total, items] = await Promise.all([
      prisma.announcement.count({ where }),
      prisma.announcement.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          admin: { select: { userId: true, userName: true, email: true } },
          instructor: { select: { instructorId: true, firstName: true, lastName: true } },
          section: { select: { sectionId: true, sectionName: true } },
          subject: { select: { subjectId: true, subjectCode: true, subjectName: true } },
        },
      }),
    ]);

    return NextResponse.json({
      page,
      pageSize,
      total,
      items: items.map((a) => ({
        id: a.announcementId,
        title: a.title,
        content: a.content,
        isGeneral: a.isGeneral,
        userType: a.userType,
        status: a.status,
        priority: a.priority,
        createdAt: a.createdAt,
        updatedAt: a.updatedAt,
        subject: a.subject ? { id: a.subject.subjectId, code: a.subject.subjectCode, name: a.subject.subjectName } : null,
        section: a.section ? { id: a.section.sectionId, name: a.section.sectionName } : null,
        instructor: a.instructor ? { id: a.instructor.instructorId, name: `${a.instructor.firstName} ${a.instructor.lastName}` } : null,
        admin: a.admin ? { id: a.admin.userId, name: a.admin.userName, email: a.admin.email } : null,
      })),
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Failed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    if (action === "delete") {
      const { id } = (await req.json()) as { id?: number };
      if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });
      await prisma.announcement.delete({ where: { announcementId: id } });
      return NextResponse.json({ ok: true });
    }

    if (action === "create-sample") {
      const { createdby = 1 } = (await req.json()) as { createdby?: number };
      const now = new Date();
      const a = await prisma.announcement.create({
        data: {
          createdby,
          userType: Role.STUDENT,
          title: `Sample Announcement ${now.toLocaleString()}`,
          content:
            "This is a sample announcement for testing the view. You can delete this anytime.",
          isGeneral: true,
          status: Status.ACTIVE,
          priority: Priority.NORMAL,
        },
      });
      return NextResponse.json({ ok: true, id: a.announcementId });
    }

    return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Failed" }, { status: 500 });
  }
}
