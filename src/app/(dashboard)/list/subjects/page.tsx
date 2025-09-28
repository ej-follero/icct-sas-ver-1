'use client';

import { useEffect, useState } from 'react';
import { BookOpen, Users, Calendar, RefreshCw, GraduationCap, Building2 } from 'lucide-react';

type SubjectRow = {
  subjectId: number;
  code: string;
  name: string;
  department: string;
  course: string;
  academicYear: string;
  semester: string;
  status: string;
  sections: number;
  students: number;
};

export default function Page() {
  const [items, setItems] = useState<SubjectRow[]>([]);
  const [loading, setLoading] = useState(false);

  // Demo: read ?instructorId from URL or default to 2
  const search = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : undefined;
  const instructorId = Number(search?.get('instructorId') || 2);

  async function load() {
    setLoading(true);
    try {
      const r = await fetch(`/api/subjects?instructorId=${instructorId}`, { cache: 'no-store' });
      const j = await r.json();
      setItems(j.items ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [instructorId]);

  const totalSections = items.reduce((s, it) => s + it.sections, 0);
  const totalStudents = items.reduce((s, it) => s + it.students, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="p-6 space-y-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg">
              <GraduationCap className="w-8 h-8 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                  My Subjects
                </h1>
                <span className="px-3 py-1 text-xs font-semibold rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg">
                  v2
                </span>
              </div>
              <p className="text-gray-500 mt-1">Academic Year 2024-2025</p>
            </div>
          </div>
          <button
            onClick={load}
            disabled={loading}
            className="group flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-300'}`} />
            Refresh
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <StatCard
            icon={<BookOpen className="w-6 h-6" />}
            label="Total Subjects"
            value={items.length}
            color="from-emerald-500 to-teal-600"
            bgColor="from-emerald-50 to-teal-50"
          />
          <StatCard
            icon={<Building2 className="w-6 h-6" />}
            label="Total Sections"
            value={totalSections}
            color="from-blue-500 to-cyan-600"
            bgColor="from-blue-50 to-cyan-50"
          />
          <StatCard
            icon={<Users className="w-6 h-6" />}
            label="Total Students"
            value={totalStudents}
            color="from-violet-500 to-purple-600"
            bgColor="from-violet-50 to-purple-50"
          />
        </div>

        {/* Table */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-white/20 shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left font-semibold text-gray-700 uppercase text-xs tracking-wider">
                    Subject Code
                  </th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-700 uppercase text-xs tracking-wider">
                    Subject Name
                  </th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-700 uppercase text-xs tracking-wider">
                    Course
                  </th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-700 uppercase text-xs tracking-wider">
                    Department
                  </th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-700 uppercase text-xs tracking-wider">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      AY / Semester
                    </div>
                  </th>
                  <th className="px-6 py-4 text-center font-semibold text-gray-700 uppercase text-xs tracking-wider">
                    Sections
                  </th>
                  <th className="px-6 py-4 text-center font-semibold text-gray-700 uppercase text-xs tracking-wider">
                    Students
                  </th>
                  <th className="px-6 py-4 text-center font-semibold text-gray-700 uppercase text-xs tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <span className="text-gray-500 font-medium">Loading subjects...</span>
                      </div>
                    </td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="p-4 bg-gray-100 rounded-full">
                          <BookOpen className="w-8 h-8 text-gray-400" />
                        </div>
                        <div>
                          <p className="text-gray-500 font-medium">No subjects found</p>
                          <p className="text-gray-400 text-sm mt-1">Try refreshing or contact admin</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  items.map((it, index) => (
                    <tr 
                      key={it.subjectId} 
                      className="hover:bg-blue-50/50 transition-all duration-200 group"
                      style={{
                        animationDelay: `${index * 50}ms`,
                        animation: 'fadeInUp 0.5s ease-out forwards'
                      }}
                    >
                      <td className="px-6 py-4">
                        <div className="font-bold text-gray-900 group-hover:text-blue-700 transition-colors">
                          {it.code}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-800">{it.name}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                          {it.course}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="flex items-center gap-2 text-gray-600">
                          <Building2 className="w-4 h-4" />
                          {it.department}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-gray-600 font-medium">
                          {it.academicYear}
                        </div>
                        <div className="text-xs text-gray-500">{it.semester}</div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="inline-flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-700 rounded-full font-bold text-sm">
                          {it.sections}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="inline-flex items-center justify-center min-w-[2rem] h-8 bg-purple-100 text-purple-700 rounded-full font-bold text-sm px-3">
                          {it.students}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold shadow-sm ${
                            it.status === 'ACTIVE'
                              ? 'bg-gradient-to-r from-green-400 to-emerald-500 text-white'
                              : 'bg-gradient-to-r from-red-400 to-rose-500 text-white'
                          }`}
                        >
                          <div className={`w-2 h-2 rounded-full ${
                            it.status === 'ACTIVE' ? 'bg-white' : 'bg-white'
                          }`}></div>
                          {it.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}

function StatCard({ 
  icon, 
  label, 
  value, 
  color, 
  bgColor 
}: { 
  icon: React.ReactNode; 
  label: string; 
  value: number | string; 
  color: string;
  bgColor: string;
}) {
  return (
    <div className={`relative rounded-2xl border border-white/20 shadow-lg overflow-hidden bg-gradient-to-br ${bgColor} backdrop-blur-sm hover:shadow-xl transition-all duration-300 transform hover:scale-105`}>
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-gray-600 mb-2">{label}</div>
            <div className="text-3xl font-bold text-gray-800">{value}</div>
          </div>
          <div className={`p-3 rounded-xl bg-gradient-to-r ${color} shadow-lg`}>
            <div className="text-white">
              {icon}
            </div>
          </div>
        </div>
      </div>
      <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${color}`}></div>
    </div>
  );
}