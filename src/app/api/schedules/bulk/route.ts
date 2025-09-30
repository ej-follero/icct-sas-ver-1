import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function PATCH(request: NextRequest) {
  try {
    const { scheduleIds, action, data } = await request.json();

    if (!scheduleIds || !Array.isArray(scheduleIds) || scheduleIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Schedule IDs are required' },
        { status: 400 }
      );
    }

    if (!action || !['activate', 'deactivate', 'bulkEdit', 'archive', 'bulkStatusChange'].includes(action)) {
      return NextResponse.json(
        { success: false, error: 'Invalid action. Must be activate, deactivate, bulkEdit, archive, or bulkStatusChange' },
        { status: 400 }
      );
    }

    let updateData: any = {};
    let message = '';

    switch (action) {
      case 'activate':
        updateData = { status: 'Active' };
        message = `Successfully activated ${scheduleIds.length} schedule(s)`;
        break;
      case 'deactivate':
        updateData = { status: 'Inactive' };
        message = `Successfully deactivated ${scheduleIds.length} schedule(s)`;
        break;
      case 'bulkEdit':
        if (!data) {
          return NextResponse.json(
            { success: false, error: 'Data is required for bulk edit' },
            { status: 400 }
          );
        }
        updateData = { ...data };
        message = `Successfully updated ${scheduleIds.length} schedule(s)`;
        break;
      case 'archive':
        updateData = { status: 'CANCELLED' };
        message = `Successfully archived ${scheduleIds.length} schedule(s)`;
        break;
      case 'bulkStatusChange':
        if (!data?.status) {
          return NextResponse.json(
            { success: false, error: 'Status is required for bulk status change' },
            { status: 400 }
          );
        }
        updateData = { status: data.status };
        message = `Successfully changed status to ${data.status} for ${scheduleIds.length} schedule(s)`;
        break;
    }

    // Update schedules in bulk
    const result = await prisma.subjectSchedule.updateMany({
      where: {
        subjectSchedId: {
          in: scheduleIds.map(id => parseInt(id))
        }
      },
      data: updateData
    });

    return NextResponse.json({
      success: true,
      message,
      count: result.count
    });

  } catch (error) {
    console.error('Bulk update error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update schedules'
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function POST(request: NextRequest) {
  try {
    const { scheduleIds, action } = await request.json();

    if (!scheduleIds || !Array.isArray(scheduleIds) || scheduleIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Schedule IDs are required' },
        { status: 400 }
      );
    }

    if (!action || !['duplicate', 'export'].includes(action)) {
      return NextResponse.json(
        { success: false, error: 'Invalid action. Must be duplicate or export' },
        { status: 400 }
      );
    }

    if (action === 'duplicate') {
      // Fetch the schedules to duplicate
      const schedules = await prisma.subjectSchedule.findMany({
        where: {
          subjectSchedId: {
            in: scheduleIds.map(id => parseInt(id))
          }
        },
        include: {
          subject: true,
          section: true,
          instructor: true,
          room: true,
          semester: true,
        }
      });

      // Create duplicates with modified names
      const duplicates = await Promise.all(
        schedules.map(async (schedule) => {
          return await prisma.subjectSchedule.create({
            data: {
              subjectId: schedule.subjectId,
              sectionId: schedule.sectionId,
              instructorId: schedule.instructorId,
              roomId: schedule.roomId,
              day: schedule.day,
              startTime: schedule.startTime,
              endTime: schedule.endTime,
              slots: schedule.slots,
              scheduleType: schedule.scheduleType,
              status: 'Active', // New duplicates are active
              semesterId: schedule.semesterId,
              academicYear: schedule.academicYear,
              isRecurring: schedule.isRecurring,
              startDate: schedule.startDate,
              endDate: schedule.endDate,
              maxStudents: schedule.maxStudents,
              notes: schedule.notes ? `${schedule.notes} (Copy)` : 'Copy',
            }
          });
        })
      );

      return NextResponse.json({
        success: true,
        message: `Successfully duplicated ${duplicates.length} schedule(s)`,
        count: duplicates.length
      });
    }

    if (action === 'export') {
      // Fetch schedules for export
      const schedules = await prisma.subjectSchedule.findMany({
        where: {
          subjectSchedId: {
            in: scheduleIds.map(id => parseInt(id))
          }
        },
        include: {
          subject: true,
          section: true,
          instructor: true,
          room: true,
          semester: true,
        }
      });

      return NextResponse.json({
        success: true,
        message: `Export data for ${schedules.length} schedule(s)`,
        data: schedules
      });
    }

  } catch (error) {
    console.error('Bulk action error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to perform bulk action'
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { scheduleIds } = await request.json();

    if (!scheduleIds || !Array.isArray(scheduleIds) || scheduleIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Schedule IDs are required' },
        { status: 400 }
      );
    }

    // Soft delete schedules in bulk - update status to "CANCELLED"
    const result = await prisma.subjectSchedule.updateMany({
      where: {
        subjectSchedId: {
          in: scheduleIds.map(id => parseInt(id))
        }
      },
      data: {
        status: 'CANCELLED'
      }
    });

    return NextResponse.json({
      success: true,
      message: `Successfully deleted ${result.count} schedule(s)`,
      count: result.count
    });

  } catch (error) {
    console.error('Bulk delete error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete schedules'
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
