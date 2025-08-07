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
    const status = searchParams.get('status');
    const backupId = searchParams.get('backupId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const result = await restoreService.getRestorePoints({
      status: status as any || undefined,
      backupId: backupId || undefined,
      page,
      limit
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in restore points GET:', error);
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
    const { backupId, name, description } = body;

    if (!backupId || !name) {
      return NextResponse.json({ error: "Backup ID and name are required" }, { status: 400 });
    }

    const restorePoint = await restoreService.createRestorePoint(
      backupId,
      name,
      1, // TODO: Get from session when authentication is implemented
      description
    );

    return NextResponse.json(restorePoint);
  } catch (error) {
    console.error('Error in restore points POST:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
} 