import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// PUT /api/backup/[id] - Update backup status
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { status, errorMessage, size, completedAt, filePath } = body;

    const updatedBackup = await prisma.systemBackup.update({
      where: { id: parseInt(id) },
      data: {
        status,
        errorMessage,
        size,
        filePath,
        completedAt: completedAt ? new Date(completedAt) : undefined,
      },
      include: {
        createdByUser: {
          select: {
            userId: true,
            userName: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: updatedBackup.id.toString(),
        name: updatedBackup.name,
        type: updatedBackup.type,
        status: updatedBackup.status,
        createdAt: updatedBackup.createdAt.toISOString(),
        description: updatedBackup.description,
        retentionDays: updatedBackup.retentionDays,
        isEncrypted: updatedBackup.isEncrypted,
        location: updatedBackup.location,
        size: updatedBackup.size,
        createdBy: updatedBackup.createdByUser.userName,
        completedAt: updatedBackup.completedAt?.toISOString(),
        errorMessage: updatedBackup.errorMessage,
        filePath: updatedBackup.filePath,
      },
    });
  } catch (error) {
    console.error("Error updating backup:", error);
    return NextResponse.json(
      { 
        error: "Failed to update backup",
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    );
  }
}

// DELETE /api/backup/[id] - Delete backup
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    await prisma.systemBackup.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({
      success: true,
      message: "Backup deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting backup:", error);
    return NextResponse.json(
      { 
        error: "Failed to delete backup",
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    );
  }
} 