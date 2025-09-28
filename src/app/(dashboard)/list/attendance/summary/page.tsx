'use client';

import React, { useEffect, useMemo, useState } from 'react';

type SummaryRow = {
  scheduleId: number;
  subject: string;
  code: string;
  section: string;
  room: string;
  present: number;
  absent: number;
  late: number;
  excused: number;
  total: number;
  rate: number;
};

export default function AttendanceSummaryPage() {
  const [items, setItems] = useState<SummaryRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [date, setDate] = useState<string>('');
  const [error, setError] = useState<string>('');

  // Demo; swap to logged-in instructor later
  const instructorId = 2;

  async function fetchSummary() {
    try {
      setLoading(true);
      setError('');
      const p = new URLSearchParams();
      p.set('instructorId', String(instructorId));
      if (date) p.set('date', date);

      const res = await fetch(`/api/attendance/summary?${p.toString()}`, {
        cache: 'no-store',
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || 'Failed to load summary');
      setItems(j.items ?? []);
    } catch (e: any) {
      setError(e?.message || 'Failed to load summary');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  const totals = useMemo(() => {
    const sum = <K extends keyof SummaryRow>(k: K) =>
      items.reduce((acc, it) => acc + (it[k] as number), 0);
    const grandTotal = items.reduce((acc, it) => acc + it.total, 0);
    const present = sum('present');
    const overallRate = grandTotal > 0 ? Math.round((present / grandTotal) * 100) : 0;
    return { present, absent: sum('absent'), late: sum('late'), excused: sum('excused'), grandTotal, overallRate };
  }, [items]);

  function rateColor(rate: number) {
    if (rate >= 90) return 'text-emerald-700 bg-emerald-50 ring-1 ring-emerald-100';
    if (rate >= 75) return 'text-blue-700 bg-blue-50 ring-1 ring-blue-100';
    if (rate >= 50) return 'text-amber-700 bg-amber-50 ring-1 ring-amber-100';
    return 'text-rose-700 bg-rose-50 ring-1 ring-rose-100';
  }

  function exportCSV() {
    const headers = ['Code', 'Subject', 'Section', 'Room', 'Present', 'Absent', 'Late', 'Excused', 'Total', 'Rate'];
    const rows = items.map((it) => [
      it.code,
      it.subject,
      it.section,
      it.room,
      it.present,
      it.absent,
      it.late,
      it.excused,
      it.total,
      `${it.rate}%`,
    ]);
    const csv = [headers, ...rows]
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance-summary-${date || 'today'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Class Attendance Summary</h1>
          <p className="text-sm text-gray-500">Per-class counts for the selected date.</p>
        </div>
        <div className="flex gap-2">
          <div className="flex items-center gap-2 rounded-lg border px-3 py-2">
            <label className="text-sm text-gray-600">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="border rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={fetchSummary}
            className="rounded-lg bg-blue-600 px-4 py-2 text-white shadow hover:bg-blue-700 active:translate-y-px"
          >
            Refresh
          </button>
          <button
            onClick={exportCSV}
            disabled={items.length === 0}
            className="rounded-lg bg-gray-100 px-4 py-2 text-gray-700 ring-1 ring-gray-200 hover:bg-gray-200 disabled:opacity-50"
          >
            Export CSV
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border p-4 shadow-sm">
          <div className="text-sm text-gray-500">Overall Present Rate</div>
          <div className="mt-2 flex items-center gap-3">
            <div className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${rateColor(totals.overallRate)}`}>
              {totals.overallRate}%
            </div>
            <div className="h-2 w-full rounded bg-gray-100">
              <div
                className="h-2 rounded bg-blue-500 transition-all"
                style={{ width: `${Math.min(100, totals.overallRate)}%` }}
              />
            </div>
          </div>
        </div>
        <div className="rounded-xl border p-4 shadow-sm">
          <div className="text-sm text-gray-500">Total Records</div>
          <div className="mt-2 text-2xl font-semibold">{totals.grandTotal}</div>
          <div className="mt-1 text-xs text-gray-500">Across all classes</div>
        </div>
        <div className="rounded-xl border p-4 shadow-sm">
          <div className="text-sm text-gray-500">Breakdown</div>
          <div className="mt-2 flex gap-4 text-sm">
            <div><span className="font-semibold">{totals.present}</span> present</div>
            <div><span className="font-semibold">{totals.absent}</span> absent</div>
            <div><span className="font-semibold">{totals.late}</span> late</div>
            <div><span className="font-semibold">{totals.excused}</span> excused</div>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-rose-700">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border shadow-sm">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-gray-50/80 backdrop-blur supports-[backdrop-filter]:bg-gray-50/60">
            <tr className="text-left text-gray-600">
              <th className="px-3 py-2">Code</th>
              <th className="px-3 py-2">Subject</th>
              <th className="px-3 py-2">Section</th>
              <th className="px-3 py-2">Room</th>
              <th className="px-3 py-2 text-right">Present</th>
              <th className="px-3 py-2 text-right">Absent</th>
              <th className="px-3 py-2 text-right">Late</th>
              <th className="px-3 py-2 text-right">Excused</th>
              <th className="px-3 py-2 text-right">Total</th>
              <th className="px-3 py-2 text-right">Rate</th>
            </tr>
          </thead>

          <tbody className="divide-y">
            {/* Loading skeleton */}
            {loading &&
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={`skeleton-${i}`} className="animate-pulse">
                  {Array.from({ length: 10 }).map((__, j) => (
                    <td key={j} className="px-3 py-3">
                      <div className="h-3 w-24 rounded bg-gray-200" />
                    </td>
                  ))}
                </tr>
              ))}

            {!loading && items.length === 0 && (
              <tr>
                <td colSpan={10} className="px-3 py-10 text-center text-gray-500">
                  No data for this filter
                </td>
              </tr>
            )}

            {!loading &&
              items.map((it, idx) => (
                <tr
                  key={it.scheduleId}
                  className={idx % 2 ? 'bg-white' : 'bg-gray-50/30'}
                >
                  <td className="px-3 py-2">{it.code}</td>
                  <td className="px-3 py-2">{it.subject}</td>
                  <td className="px-3 py-2">{it.section}</td>
                  <td className="px-3 py-2">{it.room}</td>
                  <td className="px-3 py-2 text-right">{it.present}</td>
                  <td className="px-3 py-2 text-right">{it.absent}</td>
                  <td className="px-3 py-2 text-right">{it.late}</td>
                  <td className="px-3 py-2 text-right">{it.excused}</td>
                  <td className="px-3 py-2 text-right">{it.total}</td>
                  <td className="px-3 py-2 text-right">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${rateColor(it.rate)}`}>
                      {it.rate}%
                    </span>
                  </td>
                </tr>
              ))}
          </tbody>

          {!loading && items.length > 0 && (
            <tfoot>
              <tr className="bg-gray-100 font-medium">
                <td className="px-3 py-2" colSpan={4}>
                  Totals
                </td>
                <td className="px-3 py-2 text-right">{totals.present}</td>
                <td className="px-3 py-2 text-right">{totals.absent}</td>
                <td className="px-3 py-2 text-right">{totals.late}</td>
                <td className="px-3 py-2 text-right">{totals.excused}</td>
                <td className="px-3 py-2 text-right">{totals.grandTotal}</td>
                <td className="px-3 py-2 text-right">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${rateColor(totals.overallRate)}`}>
                    {totals.overallRate}%
                  </span>
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
