import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(request: NextRequest) {
  try {
    const { studentIds, status, reason, updatedAt } = await request.json();
    
    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return NextResponse.json({ 
        error: 'Student IDs are required and must be a non-empty array' 
      }, { status: 400 });
    }

    if (!status) {
      return NextResponse.json({ 
        error: 'Status is required' 
      }, { status: 400 });
    }

    const validStatuses = ['ACTIVE', 'INACTIVE', 'SUSPENDED', 'GRADUATED'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ 
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` 
      }, { status: 400 });
    }

    // Update all students in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const updatePromises = studentIds.map(studentId => 
        tx.student.update({
          where: { studentId },
          data: {
            status,
            updatedAt: new Date(updatedAt || new Date().toISOString()),
            // Add reason to a notes field or create an audit log entry
            notes: reason ? `Status updated: ${reason}` : undefined
          }
        })
      );

      const updatedStudents = await Promise.all(updatePromises);
      
      return {
        success: true,
        updatedCount: updatedStudents.length,
        updatedStudents: updatedStudents.map(student => ({
          studentId: student.studentId,
          studentName: student.studentName,
          status: student.status
        }))
      };
    });

    return NextResponse.json(result);

  } catch (error: any) {
    console.error('Error updating student statuses:', error);
    
    if (error.code === 'P2025') {
      return NextResponse.json({ 
        error: 'One or more students not found' 
      }, { status: 404 });
    }
    
    return NextResponse.json({ 
      error: 'Failed to update student statuses' 
    }, { status: 500 });
  }
}
