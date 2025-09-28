'use client';

import { useEffect, useState } from 'react';
import { Users, UserCheck, RefreshCw, User, School } from 'lucide-react';

type StudentRow = {
  studentId: number;
  number: string;
  name: string;
  gender: string;
  status: string;
  section: string;
};

export default function Page() {
  const [items, setItems] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(false);

  const search = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : undefined;
  const instructorId = Number(search?.get('instructorId') || 2);

  async function load() {
    setLoading(true);
    try {
      const r = await fetch(`/api/students?instructorId=${instructorId}`, { cache: 'no-store' });
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

  const maleCount = items.filter(it => it.gender?.toUpperCase() === 'MALE').length;
  const femaleCount = items.filter(it => it.gender?.toUpperCase() === 'FEMALE').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="p-6 space-y-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg">
              <Users className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                Student List
              </h1>
              <p className="text-gray-500 mt-1">Manage your enrolled students</p>
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
            icon={<Users className="w-6 h-6" />}
            label="Total Students"
            value={items.length}
            color="from-blue-500 to-cyan-600"
            bgColor="from-blue-50 to-cyan-50"
          />
          <StatCard
            icon={<User className="w-6 h-6" />}
            label="Male Students"
            value={maleCount}
            color="from-indigo-500 to-purple-600"
            bgColor="from-indigo-50 to-purple-50"
          />
          <StatCard
            icon={<UserCheck className="w-6 h-6" />}
            label="Female Students"
            value={femaleCount}
            color="from-pink-500 to-rose-600"
            bgColor="from-pink-50 to-rose-50"
          />
        </div>

        {/* Table */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-white/20 shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left font-semibold text-gray-700 uppercase text-xs tracking-wider">
                    Student Number
                  </th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-700 uppercase text-xs tracking-wider">
                    Student Name
                  </th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-700 uppercase text-xs tracking-wider">
                    <div className="flex items-center gap-1">
                      <School className="w-4 h-4" />
                      Section
                    </div>
                  </th>
                  <th className="px-6 py-4 text-center font-semibold text-gray-700 uppercase text-xs tracking-wider">
                    Gender
                  </th>
                  <th className="px-6 py-4 text-center font-semibold text-gray-700 uppercase text-xs tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <span className="text-gray-500 font-medium">Loading students...</span>
                      </div>
                    </td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="p-4 bg-gray-100 rounded-full">
                          <Users className="w-8 h-8 text-gray-400" />
                        </div>
                        <div>
                          <p className="text-gray-500 font-medium">No students found</p>
                          <p className="text-gray-400 text-sm mt-1">Try refreshing or contact admin</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  items.map((it, index) => (
                    <tr 
                      key={it.studentId} 
                      className="hover:bg-blue-50/50 transition-all duration-200 group"
                      style={{
                        animationDelay: `${index * 30}ms`,
                        animation: 'fadeInUp 0.5s ease-out forwards'
                      }}
                    >
                      <td className="px-6 py-4">
                        <div className="font-bold text-gray-900 group-hover:text-blue-700 transition-colors">
                          {it.number}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center">
                            <User className="w-4 h-4 text-gray-600" />
                          </div>
                          <div className="font-medium text-gray-800">{it.name}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 bg-gradient-to-r from-slate-100 to-slate-200 text-slate-700 rounded-full text-xs font-medium border border-slate-200">
                          {it.section}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          it.gender?.toUpperCase() === 'MALE'
                            ? 'bg-blue-100 text-blue-700 border border-blue-200'
                            : 'bg-pink-100 text-pink-700 border border-pink-200'
                        }`}>
                          {it.gender}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold shadow-sm ${
                            it.status === 'ACTIVE'
                              ? 'bg-gradient-to-r from-green-400 to-emerald-500 text-white'
                              : 'bg-gradient-to-r from-red-400 to-rose-500 text-white'
                          }`}
                        >
                          <div className={`w-2 h-2 rounded-full bg-white`}></div>
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