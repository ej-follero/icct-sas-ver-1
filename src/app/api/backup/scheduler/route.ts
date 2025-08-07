import { NextRequest, NextResponse } from "next/server";
import { backupSchedulerService } from "@/lib/services/backup-scheduler.service";

// GET - Get scheduler status
export async function GET() {
  try {
    const status = await backupSchedulerService.getSchedulerStatus();
    
    return NextResponse.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error("Error getting scheduler status:", error);
    return NextResponse.json(
      { error: "Failed to get scheduler status" },
      { status: 500 }
    );
  }
}

// POST - Control scheduler
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'start':
        // Scheduler starts automatically, just return status
        const status = await backupSchedulerService.getSchedulerStatus();
        return NextResponse.json({
          success: true,
          message: "Scheduler is running",
          data: status
        });

      case 'stop':
        backupSchedulerService.stopScheduler();
        return NextResponse.json({
          success: true,
          message: "Scheduler stopped"
        });

      case 'status':
        const currentStatus = await backupSchedulerService.getSchedulerStatus();
        return NextResponse.json({
          success: true,
          data: currentStatus
        });

      default:
        return NextResponse.json(
          { error: "Invalid action" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Error controlling scheduler:", error);
    return NextResponse.json(
      { error: "Failed to control scheduler" },
      { status: 500 }
    );
  }
} 