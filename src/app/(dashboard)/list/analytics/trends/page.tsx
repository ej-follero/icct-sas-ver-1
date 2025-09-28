"use client";

import { useEffect, useMemo, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
  AreaChart,
  Area,
} from "recharts";
import { 
  TrendingUp, 
  Calendar, 
  Filter, 
  RotateCcw, 
  Users, 
  UserCheck, 
  UserX, 
  Clock, 
  Shield,
  BarChart3
} from "lucide-react";

type DayRow = {
  date: string;
  present: number;
  absent: number;
  late: number;
  excused: number;
  total: number;
};

type SubjectMeta = { 
  code: string; 
  name: string; 
};

export default function ClassAttendanceTrendsPage() {
  const instructorId = 2; // demo
  const [days, setDays] = useState<DayRow[]>([]);
  const [subjects, setSubjects] = useState<SubjectMeta[]>([]);
  const [loading, setLoading] = useState(false);
  const [range, setRange] = useState("30");
  const [subject, setSubject] = useState("");
  const [chartType, setChartType] = useState<'line' | 'area'>('line');

  async function load() {
    setLoading(true);
    const p = new URLSearchParams();
    p.set("instructorId", String(instructorId));
    p.set("days", range);
    if (subject) p.set("subject", subject);
    const r = await fetch(`/api/analytics/trends?${p.toString()}`);
    const j = await r.json();
    setDays(j.days ?? []);
    setSubjects(j.subjects ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [range, subject]);

  const aggregates = useMemo(() => {
    return days.reduce(
      (s, it) => ({
        total: s.total + it.total,
        present: s.present + it.present,
        absent: s.absent + it.absent,
        late: s.late + it.late,
        excused: s.excused + it.excused,
      }),
      { total: 0, present: 0, absent: 0, late: 0, excused: 0 }
    );
  }, [days]);

  const getAttendanceRate = () => {
    return aggregates.total > 0 ? ((aggregates.present / aggregates.total) * 100).toFixed(1) : '0.0';
  };

  const getTrendData = () => {
    return days.map(day => ({
      ...day,
      attendanceRate: day.total > 0 ? ((day.present / day.total) * 100) : 0,
      formattedDate: new Date(day.date).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      })
    }));
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200">
          <p className="font-semibold text-gray-900 mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {`${entry.name}: ${entry.value}`}
            </p>
          ))}
          {payload[0] && (
            <p className="text-sm text-gray-600 mt-1 pt-1 border-t">
              Total: {payload.reduce((sum: number, entry: any) => sum + entry.value, 0)}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Attendance Trends</h1>
              <p className="text-gray-600">Track attendance patterns over time</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              >
                <option value="">All subjects</option>
                {subjects.map((s) => (
                  <option key={s.code} value={s.code}>
                    {s.code} — {s.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <select
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                value={range}
                onChange={(e) => setRange(e.target.value)}
              >
                <option value="7">Last 7 days</option>
                <option value="14">Last 14 days</option>
                <option value="30">Last 30 days</option>
                <option value="60">Last 60 days</option>
                <option value="90">Last 90 days</option>
              </select>
            </div>

            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setChartType('line')}
                className={`p-2 rounded-md transition-colors ${
                  chartType === 'line' 
                    ? 'bg-white shadow-sm text-indigo-600' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <TrendingUp className="w-4 h-4" />
              </button>
              <button
                onClick={() => setChartType('area')}
                className={`p-2 rounded-md transition-colors ${
                  chartType === 'area' 
                    ? 'bg-white shadow-sm text-indigo-600' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
              </button>
            </div>
            
            <button
              onClick={load}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-lg font-medium transition-colors shadow-sm"
            >
              <RotateCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Loading...' : 'Refresh'}
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatCard 
            icon={<Users className="w-5 h-5" />}
            label="Total Records" 
            value={aggregates.total.toLocaleString()} 
            color="bg-blue-500"
          />
          <StatCard 
            icon={<UserCheck className="w-5 h-5" />}
            label="Present" 
            value={aggregates.present.toLocaleString()} 
            color="bg-green-500"
          />
          <StatCard 
            icon={<UserX className="w-5 h-5" />}
            label="Absent" 
            value={aggregates.absent.toLocaleString()} 
            color="bg-red-500"
          />
          <StatCard 
            icon={<Clock className="w-5 h-5" />}
            label="Late" 
            value={aggregates.late.toLocaleString()} 
            color="bg-yellow-500"
          />
          <StatCard 
            icon={<Shield className="w-5 h-5" />}
            label="Excused" 
            value={aggregates.excused.toLocaleString()} 
            color="bg-purple-500"
          />
          <StatCard 
            icon={<TrendingUp className="w-5 h-5" />}
            label="Attendance Rate" 
            value={`${getAttendanceRate()}%`} 
            color="bg-indigo-500"
          />
        </div>

        {/* Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-900">Attendance Trends</h2>
            <p className="text-sm text-gray-600 mt-1">
              {subject ? `Showing data for ${subject}` : 'Showing data for all subjects'} 
              {' '}over the last {range} days
            </p>
          </div>
          
          <div className="p-6">
            {loading ? (
              <div className="py-16 flex flex-col items-center gap-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                <span className="text-gray-500">Loading trend data...</span>
              </div>
            ) : days.length === 0 ? (
              <div className="py-16 flex flex-col items-center gap-3">
                <TrendingUp className="w-12 h-12 text-gray-300" />
                <span className="text-gray-500">No trend data available</span>
                <p className="text-sm text-gray-400">Try adjusting your filters or date range</p>
              </div>
            ) : (
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  {chartType === 'line' ? (
                    <LineChart data={getTrendData()}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis 
                        dataKey="formattedDate" 
                        fontSize={12}
                        tick={{ fill: '#6b7280' }}
                        axisLine={{ stroke: '#e5e7eb' }}
                      />
                      <YAxis 
                        allowDecimals={false} 
                        fontSize={12}
                        tick={{ fill: '#6b7280' }}
                        axisLine={{ stroke: '#e5e7eb' }}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="present" 
                        stroke="#10b981" 
                        strokeWidth={3} 
                        dot={{ fill: '#10b981', r: 4 }}
                        name="Present"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="absent" 
                        stroke="#ef4444" 
                        strokeWidth={3} 
                        dot={{ fill: '#ef4444', r: 4 }}
                        name="Absent"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="late" 
                        stroke="#f59e0b" 
                        strokeWidth={3} 
                        dot={{ fill: '#f59e0b', r: 4 }}
                        name="Late"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="excused" 
                        stroke="#8b5cf6" 
                        strokeWidth={3} 
                        dot={{ fill: '#8b5cf6', r: 4 }}
                        name="Excused"
                      />
                    </LineChart>
                  ) : (
                    <AreaChart data={getTrendData()}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis 
                        dataKey="formattedDate" 
                        fontSize={12}
                        tick={{ fill: '#6b7280' }}
                        axisLine={{ stroke: '#e5e7eb' }}
                      />
                      <YAxis 
                        allowDecimals={false} 
                        fontSize={12}
                        tick={{ fill: '#6b7280' }}
                        axisLine={{ stroke: '#e5e7eb' }}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="present"
                        stackId="1"
                        stroke="#10b981"
                        fill="#10b981"
                        fillOpacity={0.7}
                        name="Present"
                      />
                      <Area
                        type="monotone"
                        dataKey="late"
                        stackId="1"
                        stroke="#f59e0b"
                        fill="#f59e0b"
                        fillOpacity={0.7}
                        name="Late"
                      />
                      <Area
                        type="monotone"
                        dataKey="excused"
                        stackId="1"
                        stroke="#8b5cf6"
                        fill="#8b5cf6"
                        fillOpacity={0.7}
                        name="Excused"
                      />
                      <Area
                        type="monotone"
                        dataKey="absent"
                        stackId="1"
                        stroke="#ef4444"
                        fill="#ef4444"
                        fillOpacity={0.7}
                        name="Absent"
                      />
                    </AreaChart>
                  )}
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-900">Daily Breakdown</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Present</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Absent</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Late</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Excused</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Rate</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {days.length === 0 && !loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                      No data available for the selected period
                    </td>
                  </tr>
                ) : (
                  days.map((d, index) => {
                    const rate = d.total > 0 ? ((d.present / d.total) * 100) : 0;
                    const formattedDate = new Date(d.date).toLocaleDateString('en-US', { 
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    });
                    
                    return (
                      <tr key={d.date} className={`hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}`}>
                        <td className="px-6 py-4 font-medium text-gray-900">{formattedDate}</td>
                        <td className="px-6 py-4 text-center">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-green-800 bg-green-100">
                            {d.present}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-red-800 bg-red-100">
                            {d.absent}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-yellow-800 bg-yellow-100">
                            {d.late}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-purple-800 bg-purple-100">
                            {d.excused}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center font-medium text-gray-900">
                          {d.total}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            rate >= 90 ? 'text-green-800 bg-green-100' :
                            rate >= 75 ? 'text-yellow-800 bg-yellow-100' :
                            'text-red-800 bg-red-100'
                          }`}>
                            {rate.toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ 
  icon, 
  label, 
  value, 
  color 
}: { 
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3 mb-2">
        <div className={`p-2 rounded-lg ${color} text-white`}>
          {icon}
        </div>
      </div>
      <div className="text-sm font-medium text-gray-600 mb-1">{label}</div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
    </div>
  );
}