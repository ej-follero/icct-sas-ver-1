'use client';

import React, { useEffect, useState } from 'react';
import { Loader2, Search, ChevronLeft, ChevronRight, ArrowUpDown, Download, Users, Filter, SortAsc, SortDesc } from 'lucide-react';

type StudentRow = {
  id: number;
  studentIdNum: string;
  firstName: string;
  lastName: string;
  fullName: string;
};

type ApiResp = {
  items: StudentRow[];
  total: number;
  page: number;
  pageSize: number;
  error?: string;
};

const PAGE_SIZES = [10, 25, 50, 100] as const;

export default function StudentsPage() {
  const [items, setItems] = useState<StudentRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<typeof PAGE_SIZES[number]>(10);
  const [q, setQ] = useState('');
  const [qDebounced, setQDebounced] = useState('');
  const [loading, setLoading] = useState(false);
  const [sort, setSort] = useState<'name' | 'studentIdNum'>('name');
  const [order, setOrder] = useState<'asc' | 'desc'>('asc');
  const [error, setError] = useState('');

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => setQDebounced(q), 350);
    return () => clearTimeout(t);
  }, [q]);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
        q: qDebounced,
        sort,
        order,
      });

      const res = await fetch(`/api/students?${params.toString()}`, { cache: 'no-store' });
      const data: ApiResp = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to load students');

      setItems(data.items);
      setTotal(data.total);
    } catch (e: any) {
      setError(e.message || 'Failed to load students');
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setPage(1);
  }, [qDebounced, pageSize, sort, order]);

  useEffect(() => {
    load();
  }, [page, pageSize, qDebounced, sort, order]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  function toggleSort(nextBy: 'name' | 'studentIdNum') {
    if (sort !== nextBy) {
      setSort(nextBy);
      setOrder('asc');
      return;
    }
    setOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
  }

  function exportCSV() {
    const headers = ['ID Number', 'Student ID', 'Last Name', 'First Name', 'Full Name'];
    const rows = items.map((r) => [
      r.studentIdNum,
      r.id,
      r.lastName,
      r.firstName,
      r.fullName,
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `students-page${page}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const getColorForInitials = (initials: string) => {
    const colors = [
      'bg-blue-100 text-blue-700 border-blue-200',
      'bg-purple-100 text-purple-700 border-purple-200',
      'bg-green-100 text-green-700 border-green-200',
      'bg-orange-100 text-orange-700 border-orange-200',
      'bg-pink-100 text-pink-700 border-pink-200',
      'bg-cyan-100 text-cyan-700 border-cyan-200',
      'bg-indigo-100 text-indigo-700 border-indigo-200',
    ];
    const index = initials.charCodeAt(0) % colors.length;
    return colors[index];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="mx-auto max-w-7xl p-6 space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Students
              </h1>
              <p className="text-sm text-gray-500 flex items-center gap-2">
                <Users className="w-4 h-4" />
                {total.toLocaleString()} total students in the system
              </p>
            </div>

            <button
              onClick={exportCSV}
              disabled={items.length === 0}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-white shadow-md hover:shadow-lg hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search by name or ID number..."
                className="w-full rounded-xl border border-gray-200 py-2.5 pl-11 pr-4 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 bg-white">
                <Filter className="w-4 h-4 text-gray-400" />
                <span className="text-xs font-medium text-gray-600">Sort:</span>
                <span className="text-xs font-semibold text-gray-900">
                  {sort === 'name' ? 'Name' : 'ID'}
                </span>
                {order === 'asc' ? (
                  <SortAsc className="w-4 h-4 text-blue-600" />
                ) : (
                  <SortDesc className="w-4 h-4 text-blue-600" />
                )}
              </div>

              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value) as typeof PAGE_SIZES[number])}
                className="rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {PAGE_SIZES.map((n) => (
                  <option key={n} value={n}>
                    {n} per page
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Students Grid */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
                  <th className="px-6 py-4 text-left">
                    <button
                      onClick={() => toggleSort('studentIdNum')}
                      className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-blue-600 transition-colors group"
                    >
                      ID Number
                      <ArrowUpDown className="h-4 w-4 opacity-50 group-hover:opacity-100" />
                    </button>
                  </th>
                  <th className="px-6 py-4 text-left">
                    <button
                      onClick={() => toggleSort('name')}
                      className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-blue-600 transition-colors group"
                    >
                      Student Name
                      <ArrowUpDown className="h-4 w-4 opacity-50 group-hover:opacity-100" />
                    </button>
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    System ID
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {loading && (
                  <>
                    {Array.from({ length: pageSize }).map((_, i) => (
                      <tr key={`sk-${i}`} className="animate-pulse">
                        <td className="px-6 py-4">
                          <div className="h-4 w-32 rounded-lg bg-gray-200" />
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-gray-200" />
                            <div className="space-y-2">
                              <div className="h-4 w-48 rounded-lg bg-gray-200" />
                              <div className="h-3 w-32 rounded-lg bg-gray-200" />
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-4 w-16 rounded-lg bg-gray-200" />
                        </td>
                      </tr>
                    ))}
                  </>
                )}

                {!loading && items.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                          <Users className="w-8 h-8 text-gray-400" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">
                            {error ? 'Error loading students' : 'No students found'}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {error || (q ? 'Try adjusting your search query' : 'No students in the system yet')}
                          </p>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}

                {!loading &&
                  items.map((s) => {
                    const initials = `${(s.firstName || '').charAt(0) || ''}${(s.lastName || '').charAt(0) || ''}`.toUpperCase();
                    const colorClass = getColorForInitials(initials);
                    return (
                      <tr key={s.id} className="hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 text-sm font-mono font-medium">
                            {s.studentIdNum}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-bold ${colorClass}`}>
                              {initials || '—'}
                            </div>
                            <div>
                              <div className="text-gray-900 font-semibold">{s.fullName}</div>
                              <div className="text-xs text-gray-500">
                                {s.firstName} {s.lastName}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-gray-600 font-medium">#{s.id}</span>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          {!loading && items.length > 0 && (
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-t border-gray-200 p-4 bg-gray-50">
              <div className="text-sm text-gray-600">
                Showing{' '}
                <span className="font-semibold text-gray-900">
                  {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)}
                </span>{' '}
                of <span className="font-semibold text-gray-900">{total.toLocaleString()}</span> students
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </button>

                <div className="flex items-center gap-1">
                  {totalPages <= 7 ? (
                    [...Array(totalPages)].map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setPage(i + 1)}
                        className={`w-9 h-9 rounded-lg text-sm font-medium transition-all ${
                          page === i + 1
                            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))
                  ) : (
                    <span className="px-3 text-sm text-gray-600">
                      Page <span className="font-semibold text-gray-900">{page}</span> of {totalPages}
                    </span>
                  )}
                </div>

                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Loading Indicator */}
        {loading && (
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500 py-2">
            <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
            <span>Loading students...</span>
          </div>
        )}
      </div>
    </div>
  );
}