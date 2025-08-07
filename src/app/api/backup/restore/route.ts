import { NextRequest, NextResponse } from "next/server";
import { restoreService } from "@/lib/services/restore.service";
// Note: These imports are commented out as they may not exist in the current setup
// import { getServerSession } from "next-auth";
// import { authOptions } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    // Authentication check disabled for now
    // TODO: Implement proper authentication
    // const session = await getServerSession(authOptions);
    // if (!session?.user?.id) {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // }

    const { searchParams } = new URL(request.url);
    const backupId = searchParams.get('backupId');
    const action = searchParams.get('action');

    if (!backupId) {
      return NextResponse.json({ error: "Backup ID is required" }, { status: 400 });
    }

    switch (action) {
      case 'preview':
        const preview = await restoreService.getRestorePreview(backupId);
        return NextResponse.json(preview);

      case 'validate':
        const validation = await restoreService.validateRestore(backupId);
        return NextResponse.json(validation);

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error('Error in restore GET:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Authentication check disabled for now
    // TODO: Implement proper authentication
    // const session = await getServerSession(authOptions);
    // if (!session?.user?.id) {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // }

    const body = await request.json();
    const {
      backupId,
      restorePointName,
      restoreFiles = true,
      restoreDatabase = true,
      validateOnly = false,
      previewOnly = false
    } = body;

    if (!backupId) {
      return NextResponse.json({ error: "Backup ID is required" }, { status: 400 });
    }

    if (previewOnly) {
      const preview = await restoreService.getRestorePreview(backupId);
      return NextResponse.json(preview);
    }

    if (validateOnly) {
      const validation = await restoreService.validateRestore(backupId);
      return NextResponse.json(validation);
    }

    const result = await restoreService.performRestore({
      backupId,
      restorePointName,
      restoreFiles,
      restoreDatabase,
      createdBy: 1 // TODO: Get from session when authentication is implemented
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in restore POST:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
} 