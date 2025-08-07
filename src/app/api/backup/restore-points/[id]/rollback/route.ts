import { NextRequest, NextResponse } from "next/server";
import { restoreService } from "@/lib/services/restore.service";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { createdBy } = body;

    if (!createdBy) {
      return NextResponse.json({ error: "Created by user ID is required" }, { status: 400 });
    }

    const result = await restoreService.rollbackToRestorePoint(id, createdBy);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in rollback POST:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
} 