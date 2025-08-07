import { useMemo } from 'react';
import { StudentAttendance } from '@/types/student-attendance';

export function useAttendanceStats(students: StudentAttendance[], timeRange: 'today' | 'week' | 'month') {
  const stats = useMemo(() => {
    if (!students || students.length === 0) {
      return {
        totalStudents: 0,
        averageAttendanceRate: 0,
        totalPresent: 0,
        totalLate: 0,
        totalAbsent: 0,
        totalExcused: 0,
        presentPercentage: 0,
        latePercentage: 0,
        absentPercentage: 0,
        excusedPercentage: 0
      };
    }

    const totalStudents = students.length;
    
    // Calculate totals
    const totalPresent = students.reduce((sum, student) => sum + (student.presentDays || 0), 0);
    const totalLate = students.reduce((sum, student) => sum + (student.lateDays || 0), 0);
    const totalAbsent = students.reduce((sum, student) => sum + (student.absentDays || 0), 0);
    const totalExcused = 0; // excusedDays not available in StudentAttendance type
    
    // Calculate average attendance rate
    const averageAttendanceRate = students.reduce((sum, student) => sum + (student.attendanceRate || 0), 0) / totalStudents;
    
    // Calculate total days
    const totalDays = totalPresent + totalLate + totalAbsent + totalExcused;
    
    // Calculate percentages
    const presentPercentage = totalDays > 0 ? (totalPresent / totalDays) * 100 : 0;
    const latePercentage = totalDays > 0 ? (totalLate / totalDays) * 100 : 0;
    const absentPercentage = totalDays > 0 ? (totalAbsent / totalDays) * 100 : 0;
    const excusedPercentage = 0; // excusedDays not available in StudentAttendance type

    // Apply time range scaling
    const scalingFactor = timeRange === 'today' ? 0.1 : timeRange === 'week' ? 0.25 : 0.5;
    
    // Calculate department breakdown
    const departmentBreakdown = students.reduce((acc, student) => {
      const dept = student.department || 'Unknown';
      if (!acc[dept]) {
        acc[dept] = { present: 0, late: 0, absent: 0, total: 0 };
      }
      acc[dept].present += student.presentDays || 0;
      acc[dept].late += student.lateDays || 0;
      acc[dept].absent += student.absentDays || 0;
      acc[dept].total += (student.presentDays || 0) + (student.lateDays || 0) + (student.absentDays || 0);
      return acc;
    }, {} as Record<string, { present: number; late: number; absent: number; total: number }>);

    // Convert to array format and calculate rates
    const departmentBreakdownArray = Object.entries(departmentBreakdown).map(([name, data]) => ({
      name,
      present: Math.round(data.present * scalingFactor),
      late: Math.round(data.late * scalingFactor),
      absent: Math.round(data.absent * scalingFactor),
      total: Math.round(data.total * scalingFactor),
      rate: data.total > 0 ? Math.round(((data.present + data.late) / data.total) * 100) : 0
    }));

    return {
      totalStudents,
      averageAttendanceRate: Math.round(averageAttendanceRate * 10) / 10,
      totalPresent: Math.round(totalPresent * scalingFactor),
      totalLate: Math.round(totalLate * scalingFactor),
      totalAbsent: Math.round(totalAbsent * scalingFactor),
      totalExcused: Math.round(totalExcused * scalingFactor),
      presentPercentage: Math.round(presentPercentage * 10) / 10,
      latePercentage: Math.round(latePercentage * 10) / 10,
      absentPercentage: Math.round(absentPercentage * 10) / 10,
      excusedPercentage: Math.round(excusedPercentage * 10) / 10,
      departmentBreakdown: departmentBreakdownArray
    };
  }, [students, timeRange]);

  return {
    stats,
    loading: false
  };
} 