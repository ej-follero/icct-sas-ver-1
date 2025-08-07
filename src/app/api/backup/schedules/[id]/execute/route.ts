import { NextResponse } from "next/server";
import { backupSchedulingService } from "@/lib/services/backup-scheduling.service";

// POST /api/backup/schedules/[id]/execute - Execute a backup schedule
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const backup = await backupSchedulingService.executeScheduledBackup(params.id);

    return NextResponse.json({
      success: true,
      data: backup,
      message: "Backup schedule executed successfully"
    });

  } catch (error) {
    console.error("Error executing backup schedule:", error);
    return NextResponse.json(
      { 
        error: "Failed to execute backup schedule",
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    );
  }
} 