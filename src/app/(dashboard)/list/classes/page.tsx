'use client';
import { useEffect, useState } from 'react';
import { Calendar, Clock, MapPin, BookOpen, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';

type ClassRow = {
  subjectSchedId: number;
  day: string;
  startTime: string;
  endTime: string;
  subjectCode: string;
  subjectName: string;
  section: string;
  room: string;
};

export default function MyClassesPage() {
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [date, setDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 9;

  const instructorId = 7;

  async function fetchClasses() {
    try {
      setLoading(true);
      setError('');
      const p = new URLSearchParams();
      p.set('instructorId', String(instructorId));
      if (date) p.set('date', date);

      const res = await fetch(`/api/classes/my?${p.toString()}`);
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || 'Failed to load classes');
      setClasses(j.items || []);
    } catch (e: any) {
      setError(e.message || 'Failed to load classes');
      setClasses([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchClasses();
  }, [date]);

  const totalPages = Math.ceil(classes.length / pageSize);
  const displayed = classes.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const getDayColor = (day: string) => {
    const colors: Record<string, string> = {
      'Monday': 'bg-blue-100 text-blue-700 border-blue-200',
      'Tuesday': 'bg-purple-100 text-purple-700 border-purple-200',
      'Wednesday': 'bg-green-100 text-green-700 border-green-200',
      'Thursday': 'bg-orange-100 text-orange-700 border-orange-200',
      'Friday': 'bg-pink-100 text-pink-700 border-pink-200',
      'Saturday': 'bg-cyan-100 text-cyan-700 border-cyan-200',
      'Sunday': 'bg-red-100 text-red-700 border-red-200',
    };
    return colors[day] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                My Classes
              </h1>
              <p className="text-sm text-gray-500 flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                Instructor ID: {instructorId} • {classes.length} total classes
              </p>
            </div>

            <div className="flex gap-3 items-center">
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  type="date"
                  value={date}
                  onChange={(e) => {
                    setCurrentPage(1);
                    setDate(e.target.value);
                  }}
                  className="pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>
              <button
                onClick={fetchClasses}
                disabled={loading}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-white shadow-md hover:shadow-lg hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold">!</span>
              </div>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Classes Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl p-6 border border-gray-100 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-20 mb-3"></div>
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-full"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              </div>
            ))}
          </div>
        ) : displayed.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No classes found</h3>
            <p className="text-sm text-gray-500">Try adjusting your date filter or refresh the page.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayed.map((c) => (
              <div
                key={c.subjectSchedId}
                className="group bg-white rounded-xl shadow-sm hover:shadow-lg border border-gray-100 hover:border-blue-200 p-5 transition-all duration-200 hover:-translate-y-1"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <span className="inline-block px-2.5 py-1 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-semibold mb-2">
                      {c.subjectCode}
                    </span>
                    <h3 className="font-semibold text-gray-900 text-base leading-tight mb-1 group-hover:text-blue-600 transition-colors">
                      {c.subjectName}
                    </h3>
                    <p className="text-xs text-gray-500 font-medium">Section {c.section}</p>
                  </div>
                </div>

                <div className="space-y-2 pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span className={`px-2 py-0.5 rounded-md text-xs font-medium border ${getDayColor(c.day)}`}>
                      {c.day}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span className="font-medium">{c.startTime} - {c.endTime}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span className="font-medium">{c.room}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex justify-between items-center">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>
              
              <div className="flex items-center gap-2">
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`w-9 h-9 rounded-lg text-sm font-medium transition-all ${
                      currentPage === i + 1
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}