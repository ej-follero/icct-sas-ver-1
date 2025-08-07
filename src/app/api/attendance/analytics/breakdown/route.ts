import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const breakdownType = searchParams.get('type') || 'attendance'; // attendance, riskLevel
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const departmentId = searchParams.get('departmentId');
    const courseId = searchParams.get('courseId');
    const yearLevel = searchParams.get('yearLevel');

    // Build where clause for filtering
    const whereClause: any = {};
    if (startDate && endDate) {
      whereClause.timestamp = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }
    if (departmentId) {
      whereClause.student = { departmentId: parseInt(departmentId) };
    }
    if (courseId) {
      whereClause.student = { ...whereClause.student, courseId: parseInt(courseId) };
    }
    if (yearLevel) {
      whereClause.student = { ...whereClause.student, yearLevel };
    }

    let breakdownData: any[] = [];

    switch (breakdownType) {
      case 'attendance':
        breakdownData = await generateAttendanceBreakdown(whereClause);
        break;
      case 'riskLevel':
        breakdownData = await generateRiskLevelBreakdown(whereClause);
        break;
      default:
        breakdownData = await generateAttendanceBreakdown(whereClause);
    }

    return NextResponse.json({
      success: true,
      data: breakdownData,
      type: breakdownType,
      filters: { startDate, endDate, departmentId, courseId, yearLevel },
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error generating attendance breakdown:', error);
    return NextResponse.json(
      { error: 'Failed to generate attendance breakdown', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

async function generateAttendanceBreakdown(whereClause: any) {
  try {
    // Return mock data for now
    return [
      {
        status: 'PRESENT',
        label: 'Present',
        count: 8500,
        uniqueStudents: 1200,
        percentage: 85.0,
        color: '#10b981',
        bgColor: '#d1fae5'
      },
      {
        status: 'LATE',
        label: 'Late',
        count: 800,
        uniqueStudents: 150,
        percentage: 8.0,
        color: '#f59e0b',
        bgColor: '#fef3c7'
      },
      {
        status: 'ABSENT',
        label: 'Absent',
        count: 500,
        uniqueStudents: 80,
        percentage: 5.0,
        color: '#ef4444',
        bgColor: '#fee2e2'
      },
      {
        status: 'EXCUSED',
        label: 'Excused',
        count: 200,
        uniqueStudents: 30,
        percentage: 2.0,
        color: '#8b5cf6',
        bgColor: '#ede9fe'
      }
    ];
  } catch (error) {
    console.error('Error in generateAttendanceBreakdown:', error);
    return [];
  }
}

async function generateRiskLevelBreakdown(whereClause: any) {
  try {
    // Return mock data for now
    return [
      {
        riskLevel: 'NONE',
        label: 'No Risk',
        count: 800,
        percentage: 70.0,
        color: '#10b981',
        bgColor: '#d1fae5',
        students: []
      },
      {
        riskLevel: 'LOW',
        label: 'Low Risk',
        count: 200,
        percentage: 17.5,
        color: '#f59e0b',
        bgColor: '#fef3c7',
        students: []
      },
      {
        riskLevel: 'MEDIUM',
        label: 'Medium Risk',
        count: 100,
        percentage: 8.8,
        color: '#f97316',
        bgColor: '#fed7aa',
        students: []
      },
      {
        riskLevel: 'HIGH',
        label: 'High Risk',
        count: 40,
        percentage: 3.5,
        color: '#ef4444',
        bgColor: '#fee2e2',
        students: []
      },
      {
        riskLevel: 'CRITICAL',
        label: 'Critical Risk',
        count: 5,
        percentage: 0.4,
        color: '#7f1d1d',
        bgColor: '#fecaca',
        students: []
      }
    ];
  } catch (error) {
    console.error('Error in generateRiskLevelBreakdown:', error);
    return [];
  }
} 