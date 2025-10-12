import { NextResponse } from "next/server";
import { backupSchedulingService } from "@/lib/services/backup-scheduling.service";

// PUT /api/backup/schedules/[id]/toggle - Toggle schedule active status
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const schedule = await backupSchedulingService.toggleScheduleStatus(id);

    return NextResponse.json({
      success: true,
      data: schedule
    });

  } catch (error) {
    console.error("Error toggling backup schedule status:", error);
    return NextResponse.json(
      { 
        error: "Failed to toggle backup schedule status",
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    );
  }
} 