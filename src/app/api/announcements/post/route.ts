export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { PrismaClient, Audience } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * GET /api/announcements
 * Query params:
 *   audience?: "ALL" | "INSTRUCTORS" | "STUDENTS" | "SECTION"
 *   sectionId?: number  (used when audience = SECTION)
 *   includeFuture?: "1" returns scheduled (publishAt > now)
 */
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const audience = url.searchParams.get("audience") as Audience | null;
    const sectionId = url.searchParams.get("sectionId");
    const includeFuture = url.searchParams.get("includeFuture") === "1";

    const where: any = {};
    if (audience) where.audience = audience;
    if (audience === "SECTION" && sectionId) where.sectionId = Number(sectionId);
    if (!includeFuture) where.publishAt = { lte: new Date() };

    const items = await prisma.announcement.findMany({
      where,
      orderBy: [{ pinned: "desc" }, { publishAt: "desc" }, { announcementId: "desc" }],
      select: {
        announcementId: true,
        title: true,
        body: true,
        audience: true,
        sectionId: true,
        publishAt: true,
        pinned: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ items });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Failed to load" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * POST /api/announcements
 * body: { title, body, audience, sectionId?, publishAt?, pinned?, createdBy }
 */
export async function POST(req: NextRequest) {
  try {
    const data = await req.json();

    const title = (data.title ?? "").trim();
    const body = (data.body ?? "").trim();
    const audience = data.audience as Audience | undefined;
    const sectionId = data.sectionId ? Number(data.sectionId) : null;
    const pinned = Boolean(data.pinned);
    const createdBy = Number(data.createdBy ?? 0);
    const publishAt = data.publishAt ? new Date(data.publishAt) : new Date();

    if (!title) return NextResponse.json({ error: "Title is required" }, { status: 400 });
    if (!body) return NextResponse.json({ error: "Message is required" }, { status: 400 });
    if (!audience) return NextResponse.json({ error: "Audience is required" }, { status: 400 });
    if (audience === "SECTION" && !sectionId)
      return NextResponse.json({ error: "sectionId required for SECTION audience" }, { status: 400 });
    if (!createdBy) return NextResponse.json({ error: "createdBy is required" }, { status: 400 });

    const item = await prisma.announcement.create({
      data: {
        title,
        body,
        audience,
        sectionId,
        pinned,
        createdBy,
        publishAt,
      },
      select: {
        announcementId: true,
      },
    });

    return NextResponse.json({ ok: true, id: item.announcementId });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Failed to create" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
