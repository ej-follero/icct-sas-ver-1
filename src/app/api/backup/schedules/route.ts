import { NextResponse } from "next/server";
import { backupSchedulingService } from "@/lib/services/backup-scheduling.service";

// GET /api/backup/schedules - Get all backup schedules
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const isActive = searchParams.get('isActive');
    const frequency = searchParams.get('frequency');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search');

    const params = {
      isActive: isActive ? isActive === 'true' : undefined,
      frequency: frequency as any,
      page,
      limit,
      search
    };

    const result = await backupSchedulingService.getSchedules(params);
    
    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error("Error fetching backup schedules:", error);
    return NextResponse.json(
      { 
        error: "Failed to fetch backup schedules",
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    );
  }
}

// POST /api/backup/schedules - Create a new backup schedule
export async function POST(request: Request) {
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
      retentionDays,
      createdBy
    } = body;

    // Validation
    if (!name || !frequency || !timeOfDay || !backupType || !location) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const schedule = await backupSchedulingService.createSchedule({
      name,
      description,
      frequency,
      interval: interval || 1,
      timeOfDay,
      daysOfWeek,
      dayOfMonth,
      backupType,
      location,
      isEncrypted: isEncrypted !== undefined ? isEncrypted : true,
      retentionDays: retentionDays || 30,
      createdBy
    });

    return NextResponse.json({
      success: true,
      data: schedule
    });

  } catch (error) {
    console.error("Error creating backup schedule:", error);
    return NextResponse.json(
      { 
        error: "Failed to create backup schedule",
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    );
  }
} 