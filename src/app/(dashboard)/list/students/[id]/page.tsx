"use client";

import { useParams } from "next/navigation";
import { useMemo, useEffect, useState } from "react";
import { Container, Grid, Paper, Typography } from "@mui/material";
import CalendarView from "@/components/CalendarView";
import DataChart from "@/components/DataChart";
import { calendarEvents } from "@/lib/data";

type AttendanceData = {
  present: number;
  absent: number;
  late: number;
  excused: number;
  total: number;
};

type AttendanceTrend = {
  date: string;
  present: number;
  absent: number;
  late: number;
  excused: number;
};

type AttendanceRecord = {
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
  timestamp: string;
};

// Mock attendance data - replace with actual API call
const mockAttendanceData: AttendanceRecord[] = [
  { status: 'PRESENT', timestamp: '2024-03-01T08:00:00' },
  { status: 'PRESENT', timestamp: '2024-03-02T08:00:00' },
  { status: 'PRESENT', timestamp: '2024-03-03T08:00:00' },
  { status: 'LATE', timestamp: '2024-03-04T08:30:00' },
  { status: 'PRESENT', timestamp: '2024-03-05T08:00:00' },
  { status: 'ABSENT', timestamp: '2024-03-06T08:00:00' },
  { status: 'PRESENT', timestamp: '2024-03-07T08:00:00' },
  { status: 'EXCUSED', timestamp: '2024-03-08T08:00:00' },
  { status: 'PRESENT', timestamp: '2024-03-09T08:00:00' },
  { status: 'PRESENT', timestamp: '2024-03-10T08:00:00' },
  { status: 'LATE', timestamp: '2024-03-11T08:15:00' },
  { status: 'PRESENT', timestamp: '2024-03-12T08:00:00' },
  { status: 'PRESENT', timestamp: '2024-03-13T08:00:00' },
  { status: 'PRESENT', timestamp: '2024-03-14T08:00:00' },
  { status: 'ABSENT', timestamp: '2024-03-15T08:00:00' },
  { status: 'PRESENT', timestamp: '2024-03-16T08:00:00' },
  { status: 'PRESENT', timestamp: '2024-03-17T08:00:00' },
  { status: 'PRESENT', timestamp: '2024-03-18T08:00:00' },
  { status: 'LATE', timestamp: '2024-03-19T08:45:00' },
  { status: 'PRESENT', timestamp: '2024-03-20T08:00:00' },
];

const SingleStudentPage = () => {
  const params = useParams();
  const studentId = Number(params.id);
  const [attendanceData, setAttendanceData] = useState<AttendanceData>({
    present: 0,
    absent: 0,
    late: 0,
    excused: 0,
    total: 0
  });
  const [attendanceTrend, setAttendanceTrend] = useState<AttendanceTrend[]>([]);

  useEffect(() => {
    // Use mock data instead of API call
    const data = mockAttendanceData;
    
    // Calculate attendance statistics
    const stats = {
      present: data.filter((a) => a.status === 'PRESENT').length,
      absent: data.filter((a) => a.status === 'ABSENT').length,
      late: data.filter((a) => a.status === 'LATE').length,
      excused: data.filter((a) => a.status === 'EXCUSED').length,
      total: data.length
    };
    
    setAttendanceData(stats);

    // Process data for trend chart
    const trendData = data.reduce((acc: { [key: string]: AttendanceTrend }, curr) => {
      const date = new Date(curr.timestamp).toLocaleDateString();
      if (!acc[date]) {
        acc[date] = {
          date,
          present: 0,
          absent: 0,
          late: 0,
          excused: 0
        };
      }
      const status = curr.status.toLowerCase() as keyof Omit<AttendanceTrend, 'date'>;
      acc[date][status]++;
      return acc;
    }, {});

    const sortedTrendData = Object.values(trendData).sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    setAttendanceTrend(sortedTrendData);
  }, [studentId]);

  const pieChartData = [
    { name: 'Present', value: attendanceData.present, fill: '#3B82F6' },
    { name: 'Absent', value: attendanceData.absent, fill: '#EF4444' },
    { name: 'Late', value: attendanceData.late, fill: '#F59E0B' },
    { name: 'Excused', value: attendanceData.excused, fill: '#8B5CF6' }
  ];

  const attendanceRate = attendanceData.total > 0 
    ? Math.round((attendanceData.present / attendanceData.total) * 100)
    : 0;

  return (
    <Container>
      <Grid container spacing={4}>
        <Grid item xs={12}>
          <Paper elevation={3} className="p-4">
            <Typography variant="h5" component="h1" gutterBottom>
              Student Schedule
            </Typography>
            <CalendarView mode="work-week" events={calendarEvents} />
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <DataChart
            type="pie"
            data={pieChartData}
            title="Attendance Rate"
            height="400px"
            customTooltip={(value) => `${value} days`}
            customLegend={(value) => value}
          />
          <div className="mt-4 text-center">
            <p className="text-2xl font-bold text-gray-900">{attendanceRate}%</p>
            <p className="text-sm text-gray-500">Overall Attendance Rate</p>
            <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
              <div>
                <p className="text-gray-500">Present</p>
                <p className="font-medium text-gray-900">{attendanceData.present}</p>
              </div>
              <div>
                <p className="text-gray-500">Absent</p>
                <p className="font-medium text-gray-900">{attendanceData.absent}</p>
              </div>
              <div>
                <p className="text-gray-500">Late</p>
                <p className="font-medium text-gray-900">{attendanceData.late}</p>
              </div>
              <div>
                <p className="text-gray-500">Excused</p>
                <p className="font-medium text-gray-900">{attendanceData.excused}</p>
              </div>
            </div>
          </div>
        </Grid>
        <Grid item xs={12} md={6}>
          <DataChart
            type="line"
            data={attendanceTrend}
            title="Attendance Trend"
            height="400px"
            dataKeys={['present', 'absent', 'late', 'excused']}
            colors={['#3B82F6', '#EF4444', '#F59E0B', '#8B5CF6']}
            customTooltip={(value) => `${value} days`}
            customLegend={(value) => value}
          />
        </Grid>
      </Grid>
    </Container>
  );
};

export default SingleStudentPage;
