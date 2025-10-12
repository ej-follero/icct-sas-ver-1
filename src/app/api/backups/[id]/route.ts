import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const backup = await prisma.backup.findUnique({
      where: { id: parseInt(id) }
    });

    if (!backup) {
      return NextResponse.json(
        { success: false, error: 'Backup not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      item: backup
    });
  } catch (error) {
    console.error('Error fetching backup:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch backup' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, errorMessage, size, completedAt } = body;

    const backup = await prisma.backup.update({
      where: { id: parseInt(id) },
      data: {
        ...(status && { status }),
        ...(errorMessage && { errorMessage }),
        ...(size && { size }),
        ...(completedAt && { completedAt: new Date(completedAt) })
      }
    });

    return NextResponse.json({
      success: true,
      item: backup
    });
  } catch (error) {
    console.error('Error updating backup:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update backup' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.backup.delete({
      where: { id: parseInt(id) }
    });

    return NextResponse.json({
      success: true,
      message: 'Backup deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting backup:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete backup' },
      { status: 500 }
    );
  }
}
