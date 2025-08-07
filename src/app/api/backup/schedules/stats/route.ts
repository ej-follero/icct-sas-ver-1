import { NextResponse } from "next/server";
import { backupSchedulingService } from "@/lib/services/backup-scheduling.service";

// GET /api/backup/schedules/stats - Get backup schedule statistics
export async function GET() {
  try {
    const stats = await backupSchedulingService.getScheduleStats();
    
    return NextResponse.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error("Error fetching backup schedule stats:", error);
    return NextResponse.json(
      { 
        error: "Failed to fetch backup schedule statistics",
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    );
  }
} 