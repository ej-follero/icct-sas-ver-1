import { NextResponse } from "next/server";
import { backupVerificationService } from "@/lib/services/backup-verification.service";

// GET /api/backup/verification - Get verification statistics
export async function GET() {
  try {
    const stats = await backupVerificationService.getVerificationStats();
    
    return NextResponse.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error("Error fetching verification stats:", error);
    return NextResponse.json(
      { 
        error: "Failed to fetch verification statistics",
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    );
  }
}

// POST /api/backup/verification - Verify a specific backup
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { backupId } = body;

    if (!backupId) {
      return NextResponse.json(
        { error: "Missing required field: backupId" },
        { status: 400 }
      );
    }

    const verification = await backupVerificationService.verifyBackup(backupId);

    return NextResponse.json({
      success: true,
      data: verification
    });

  } catch (error) {
    console.error("Error verifying backup:", error);
    return NextResponse.json(
      { 
        error: "Failed to verify backup",
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    );
  }
}

// PUT /api/backup/verification - Verify all backups
export async function PUT() {
  try {
    const result = await backupVerificationService.verifyAllBackups();

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error("Error verifying all backups:", error);
    return NextResponse.json(
      { 
        error: "Failed to verify all backups",
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    );
  }
} 