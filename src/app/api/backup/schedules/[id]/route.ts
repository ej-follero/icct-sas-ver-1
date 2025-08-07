import { NextResponse } from "next/server";
import { backupSchedulingService } from "@/lib/services/backup-scheduling.service";

// GET /api/backup/schedules/[id] - Get a specific backup schedule
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const schedule = await backupSchedulingService.getSchedule(params.id);
    
    if (!schedule) {
      return NextResponse.json(
        { error: "Backup schedule not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: schedule
    });

  } catch (error) {
    console.error("Error fetching backup schedule:", error);
    return NextResponse.json(
      { 
        error: "Failed to fetch backup schedule",
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    );
  }
}

// PUT /api/backup/schedules/[id] - Update a backup schedule
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const {
      name,
      description,
      frequency,
      interval,
      timeOfDay,
      daysOfWeek,
      dayOfMonth,
      backupType,
      location,
      isEncrypted,
      retentionDays
    } = body;

    const schedule = await backupSchedulingService.updateSchedule(params.id, {
      name,
      description,
      frequency,
      interval,
      timeOfDay,
      daysOfWeek,
      dayOfMonth,
      backupType,
      location,
      isEncrypted,
      retentionDays
    });

    return NextResponse.json({
      success: true,
      data: schedule
    });

  } catch (error) {
    console.error("Error updating backup schedule:", error);
    return NextResponse.json(
      { 
        error: "Failed to update backup schedule",
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    );
  }
}

// DELETE /api/backup/schedules/[id] - Delete a backup schedule
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await backupSchedulingService.deleteSchedule(params.id);

    return NextResponse.json({
      success: true,
      message: "Backup schedule deleted successfully"
    });

  } catch (error) {
    console.error("Error deleting backup schedule:", error);
    return NextResponse.json(
      { 
        error: "Failed to delete backup schedule",
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    );
  }
} 