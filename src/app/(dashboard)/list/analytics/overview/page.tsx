"use client";
import { useEffect, useState } from "react";
import { RotateCcw, Users, UserCheck, UserX, Clock, Shield } from "lucide-react";

type OverviewRow = {
  code: string;
  name: string;
  total: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
};

export default function AttendanceOverviewPage() {
  const [items, setItems] = useState<OverviewRow[]>([]);
  const [loading, setLoading] = useState(false);
  const instructorId = 2; // demo

  // Mock data for demonstration
  const mockData = [
    { code: "CS101", name: "Introduction to Computer Science", total: 120, present: 95, absent: 15, late: 8, excused: 2 },
    { code: "MATH201", name: "Calculus II", total: 80, present: 68, absent: 8, late: 3, excused: 1 },
    { code: "ENG150", name: "Academic Writing", total: 95, present: 82, absent: 10, late: 2, excused: 1 },
    { code: "PHYS110", name: "General Physics", total: 110, present: 88, absent: 18, late: 3, excused: 1 },
  ];

  async function load() {
    setLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setItems(mockData);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const totals = items.reduce(
    (s, it) => ({
      total: s.total + it.total,
      present: s.present + it.present,
      absent: s.absent + it.absent,
      late: s.late + it.late,
      excused: s.excused + it.excused,
    }),
    { total: 0, present: 0, absent: 0, late: 0, excused: 0 }
  );

  const getAttendanceRate = (present: number, total: number) => {
    return total > 0 ? ((present / total) * 100).toFixed(1) : '0.0';
  };

  const getStatusColor = (rate: number) => {
    if (rate >= 90) return 'text-green-600 bg-green-50';
    if (rate >= 75) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Attendance Overview</h1>
            <p className="text-gray-600 mt-1">Track student attendance across all your courses</p>
          </div>
          <button 
            onClick={load} 
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-lg font-medium transition-colors shadow-sm"
          >
            <RotateCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <StatCard 
            icon={<Users className="w-5 h-5" />}
            label="Total Records" 
            value={totals.total.toLocaleString()} 
            color="bg-blue-500"
          />
          <StatCard 
            icon={<UserCheck className="w-5 h-5" />}
            label="Present" 
            value={totals.present.toLocaleString()} 
            color="bg-green-500"
            subtitle={`${getAttendanceRate(totals.present, totals.total)}%`}
          />
          <StatCard 
            icon={<UserX className="w-5 h-5" />}
            label="Absent" 
            value={totals.absent.toLocaleString()} 
            color="bg-red-500"
          />
          <StatCard 
            icon={<Clock className="w-5 h-5" />}
            label="Late" 
            value={totals.late.toLocaleString()} 
            color="bg-yellow-500"
          />
          <StatCard 
            icon={<Shield className="w-5 h-5" />}
            label="Excused" 
            value={totals.excused.toLocaleString()} 
            color="bg-purple-500"
          />
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-900">Course Breakdown</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Attendance Rate</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Present</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Absent</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Late</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Excused</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                        <span className="text-gray-500">Loading attendance data...</span>
                      </div>
                    </td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <Users className="w-12 h-12 text-gray-300" />
                        <span className="text-gray-500">No attendance data available</span>
                        <p className="text-sm text-gray-400">Start taking attendance to see your overview here</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  items.map((it, index) => {
                    const rate = parseFloat(getAttendanceRate(it.present, it.total));
                    return (
                      <tr key={it.code} className={`hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}`}>
                        <td className="px-6 py-4">
                          <div>
                            <div className="font-medium text-gray-900">{it.code}</div>
                            <div className="text-sm text-gray-500 truncate max-w-xs">{it.name}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(rate)}`}>
                              {rate}%
                            </span>
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full transition-all duration-300 ${rate >= 90 ? 'bg-green-500' : rate >= 75 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                style={{ width: `${Math.min(rate, 100)}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-green-800 bg-green-100">
                            {it.present}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-red-800 bg-red-100">
                            {it.absent}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-yellow-800 bg-yellow-100">
                            {it.late}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-purple-800 bg-purple-100">
                            {it.excused}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center font-medium text-gray-900">
                          {it.total}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer Stats */}
        {items.length > 0 && (
          <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Overall Summary</h3>
                <p className="text-gray-600">Attendance across {items.length} course{items.length !== 1 ? 's' : ''}</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">{getAttendanceRate(totals.present, totals.total)}%</div>
                <div className="text-sm text-gray-500">Overall attendance rate</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ 
  icon, 
  label, 
  value, 
  color, 
  subtitle 
}: { 
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
  subtitle?: string;
}) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <div className={`p-2 rounded-lg ${color} text-white`}>
              {icon}
            </div>
          </div>
          <div className="text-sm font-medium text-gray-600 mb-1">{label}</div>
          <div className="text-2xl font-bold text-gray-900">{value}</div>
          {subtitle && (
            <div className="text-sm text-gray-500 mt-1">{subtitle}</div>
          )}
        </div>
      </div>
    </div>
  );
}