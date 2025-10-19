"use client";

import React, { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { useSearchParams, useRouter } from "next/navigation";

/* ---------- Types ---------- */

type AttendanceItem = {
  studentId: number;
  idNumber: string;
  name: string;
  section: string;
  subject: string;
  present: number;
  absent: number;
  late: number;
  excused: number;
  lastSeen: string | null;
};

type ReportResponse = {
  meta: {
    instructorId: number;
    start: string;
    end: string;
    totalRecords: number;
    attendanceRate: number;
  };
  items: AttendanceItem[];
};

const PAGE_SIZES = [10, 20, 50];

/* ---------- Page ---------- */

export default function GenerateReportPage() {
  const router = useRouter();
  const params = useSearchParams();

  // Pull instructorId from query (?instructorId=7). Fallback to 7 to keep page usable.
  const instructorId = useMemo<number>(() => {
    const raw = params.get("instructorId");
    const n = raw ? Number(raw) : 7;
    return Number.isFinite(n) && n > 0 ? n : 7;
  }, [params]);

  const [start, setStart] = useState(format(new Date(), "yyyy-MM-dd"));
  const [end, setEnd] = useState(format(new Date(), "yyyy-MM-dd"));
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState<ReportResponse | null>(null);
  const [pageSize, setPageSize] = useState<number>(PAGE_SIZES[0]);
  const [page, setPage] = useState<number>(1);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [savingReport, setSavingReport] = useState(false);

  async function fetchReport() {
    try {
      setLoading(true);
      setError("");
      setData(null);
      setPage(1);

      const url = `/api/reports/generate?instructorId=${instructorId}&start=${start}&end=${end}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: ReportResponse = await res.json();
      setData(json);
    } catch (e: any) {
      console.error(e);
      setError("Failed to fetch report");
    } finally {
      setLoading(false);
    }
  }

  // Fetch on first mount and whenever inputs change
  useEffect(() => {
    fetchReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [instructorId, start, end]);

  const filtered = useMemo(() => {
    const items = data?.items ?? [];
    if (!q.trim()) return items;
    const k = q.toLowerCase();
    return items.filter(
      (r) =>
        r.name.toLowerCase().includes(k) ||
        r.idNumber.toLowerCase().includes(k) ||
        r.section.toLowerCase().includes(k) ||
        r.subject.toLowerCase().includes(k)
    );
  }, [data, q]);

  const totalRows = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageStart = (safePage - 1) * pageSize;
  const pageRows = filtered.slice(pageStart, pageStart + pageSize);

  function onChangePageSize(newSize: number) {
    setPageSize(newSize);
    setPage(1);
  }

  function exportCsv(rows: AttendanceItem[], fileLabel = "all") {
    const header = [
      "Student ID",
      "ID Number",
      "Name",
      "Section",
      "Subject",
      "Present",
      "Absent",
      "Late",
      "Excused",
      "Last Seen",
    ];

    const csv = [
      header.join(","),
      ...rows.map((r) =>
        [
          r.studentId,
          csvEscape(r.idNumber),
          csvEscape(r.name),
          csvEscape(r.section),
          csvEscape(r.subject),
          r.present,
          r.absent,
          r.late,
          r.excused,
          r.lastSeen ? format(new Date(r.lastSeen), "yyyy-MM-dd HH:mm") : "",
        ].join(",")
      ),
    ].join("\n");

    const meta = data?.meta;
    const name = `attendance_${fileLabel}_i${
      meta?.instructorId ?? instructorId
    }_${start}_to_${end}.csv`;
    downloadText(csv, name);
    setShowExportMenu(false);
  }

  const stats = useMemo(() => {
    if (!data) return null;
    const totalPresent = filtered.reduce((sum, r) => sum + r.present, 0);
    const totalAbsent = filtered.reduce((sum, r) => sum + r.absent, 0);
    const totalLate = filtered.reduce((sum, r) => sum + r.late, 0);
    const totalExcused = filtered.reduce((sum, r) => sum + r.excused, 0);
    const total = totalPresent + totalAbsent + totalLate + totalExcused;

    return {
      totalPresent,
      totalAbsent,
      totalLate,
      totalExcused,
      total,
      rate: total > 0 ? ((totalPresent / total) * 100).toFixed(1) : "0.0",
    };
  }, [data, filtered]);

  // Save a row to ReportLog and jump to View Reports
  async function saveToViewReports() {
    try {
      if (!data) return;
      setSavingReport(true);
      const res = await fetch("/api/reports/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instructorId,
          start,
          end,
          reportName: "Attendance Analytics",
          reportType: "STUDENT_ATTENDANCE",
          description: `Analytics from ${start} to ${end}`,
          fileFormat: "CSV",
          parameters: { start, end },
        }),
      });
      const json = await res.json();
      if (!res.ok || !json?.ok) throw new Error(json?.error || "Save failed");

      router.push(`/list/reports/view?instructorId=${instructorId}`);
    } catch (e: any) {
      console.error(e);
      setError(e?.message || "Failed to save report");
    } finally {
      setSavingReport(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Attendance Analytics
            </h1>
            <p className="text-slate-600 mt-1">
              Track and analyze student attendance patterns
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchReport}
              disabled={loading}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              {loading ? "Loading…" : "Refresh Data"}
            </button>
            <button
              onClick={saveToViewReports}
              disabled={savingReport || !data}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              title="Add this result to View Reports"
            >
              {savingReport ? "Saving…" : "Save to View Reports"}
            </button>
            // somewhere in your Generate page header actions
            <button
              onClick={async () => {
                const res = await fetch(`/api/reports/export?instructorId=7`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ start, end }),
                });
                const j = await res.json();
                if (!res.ok) {
                  alert(j?.error || "Export failed");
                  return;
                }
                // optional: auto open download
                if (j.downloadUrl) window.open(j.downloadUrl, "_blank");
                // optional: toast success
              }}
              className="flex items-center gap-2 bg-slate-900 hover:bg-black text-white px-4 py-2 rounded-lg"
            >
              Server Export CSV
            </button>
          </div>
        </div>

        {/* Filters Card */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={start}
                onChange={(e) => setStart(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
              />
            </div>

            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                End Date
              </label>
              <input
                type="date"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
              />
            </div>

            <div className="md:col-span-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Search
              </label>
              <div className="relative">
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <input
                  type="text"
                  placeholder="Search by name, ID, section, or subject…"
                  value={q}
                  onChange={(e) => {
                    setQ(e.target.value);
                    setPage(1);
                  }}
                  className="w-full border border-slate-300 rounded-lg pl-10 pr-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-lg">
            <p className="font-medium">Error: {error}</p>
          </div>
        )}

        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <StatCard
              label="Total Students"
              value={data?.meta.totalRecords || 0}
              bgColor="bg-blue-50"
              textColor="text-blue-700"
              borderColor="border-blue-200"
            />
            <StatCard
              label="Present"
              value={stats.totalPresent}
              bgColor="bg-emerald-50"
              textColor="text-emerald-700"
              borderColor="border-emerald-200"
            />
            <StatCard
              label="Absent"
              value={stats.totalAbsent}
              bgColor="bg-rose-50"
              textColor="text-rose-700"
              borderColor="border-rose-200"
            />
            <StatCard
              label="Late"
              value={stats.totalLate}
              bgColor="bg-amber-50"
              textColor="text-amber-700"
              borderColor="border-amber-200"
            />
            <StatCard
              label="Attendance Rate"
              value={`${stats.rate}%`}
              bgColor="bg-indigo-50"
              textColor="text-indigo-700"
              borderColor="border-indigo-200"
            />
          </div>
        )}

        {/* Table Card */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-200 flex items-center justify-between flex-wrap gap-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Student Records
              </h2>
              <p className="text-sm text-slate-600 mt-0.5">
                {totalRows} {totalRows === 1 ? "entry" : "entries"} found
              </p>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={pageSize}
                onChange={(e) => onChangePageSize(Number(e.target.value))}
                className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {PAGE_SIZES.map((n) => (
                  <option key={n} value={n}>
                    Show {n}
                  </option>
                ))}
              </select>

              <div className="relative">
                <button
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  disabled={!filtered.length}
                  className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  Export CSV
                </button>

                {showExportMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowExportMenu(false)}
                    />
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-slate-200 py-2 z-20">
                      <button
                        onClick={() => exportCsv(filtered, "all")}
                        className="w-full text-left px-4 py-2.5 hover:bg-slate-50 flex items-center justify-between transition-colors"
                      >
                        <span className="font-medium">Export All</span>
                        <span className="text-sm text-slate-500">
                          {filtered.length} rows
                        </span>
                      </button>
                      <button
                        onClick={() => exportCsv(pageRows, `page${safePage}`)}
                        className="w-full text-left px-4 py-2.5 hover:bg-slate-50 flex items-center justify-between transition-colors"
                      >
                        <span className="font-medium">Export Current Page</span>
                        <span className="text-sm text-slate-500">
                          {pageRows.length} rows
                        </span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <Th className="text-slate-600">#</Th>
                  <Th className="text-slate-600">ID Number</Th>
                  <Th className="text-slate-600">Name</Th>
                  <Th className="text-slate-600">Section</Th>
                  <Th className="text-slate-600">Subject</Th>
                  <Th className="text-emerald-700">Present</Th>
                  <Th className="text-rose-700">Absent</Th>
                  <Th className="text-amber-700">Late</Th>
                  <Th className="text-blue-700">Excused</Th>
                  <Th className="text-slate-600">Last Seen</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-slate-500 font-medium">
                          Loading data…
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : pageRows.length ? (
                  pageRows.map((r, i) => (
                    <tr
                      key={`${r.studentId}-${i}`}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <Td className="text-slate-500 font-medium">
                        {pageStart + i + 1}
                      </Td>
                      <Td className="font-mono text-sm text-slate-700">
                        {r.idNumber}
                      </Td>
                      <Td className="font-semibold text-slate-900">{r.name}</Td>
                      <Td className="text-slate-700">{r.section}</Td>
                      <Td className="text-slate-700">{r.subject}</Td>
                      <Td>
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                          {r.present}
                        </span>
                      </Td>
                      <Td>
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-rose-100 text-rose-800">
                          {r.absent}
                        </span>
                      </Td>
                      <Td>
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                          {r.late}
                        </span>
                      </Td>
                      <Td>
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {r.excused}
                        </span>
                      </Td>
                      <Td className="text-slate-600">
                        {r.lastSeen
                          ? format(new Date(r.lastSeen), "MMM dd, yyyy")
                          : "—"}
                      </Td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={10} className="py-12 text-center">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <svg
                          className="w-12 h-12 text-slate-300"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                          />
                        </svg>
                        <p className="text-slate-500 font-medium">
                          No data found
                        </p>
                        <p className="text-sm text-slate-400">
                          Try adjusting your search or filters
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Bar */}
          {pageRows.length > 0 && (
            <div className="px-6 py-4 border-t border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="text-sm text-slate-600">
                Showing{" "}
                <span className="font-semibold text-slate-900">
                  {totalRows ? pageStart + 1 : 0}
                </span>
                {" to "}
                <span className="font-semibold text-slate-900">
                  {Math.min(pageStart + pageRows.length, totalRows)}
                </span>
                {" of "}
                <span className="font-semibold text-slate-900">
                  {totalRows}
                </span>
                {" entries"}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={safePage <= 1}
                  className="px-4 py-2 border border-slate-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors font-medium text-sm"
                >
                  Previous
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) pageNum = i + 1;
                    else if (safePage <= 3) pageNum = i + 1;
                    else if (safePage >= totalPages - 2)
                      pageNum = totalPages - 4 + i;
                    else pageNum = safePage - 2 + i;

                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`w-10 h-10 rounded-lg font-medium text-sm transition-colors ${
                          pageNum === safePage
                            ? "bg-blue-600 text-white"
                            : "hover:bg-slate-100 text-slate-700"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safePage >= totalPages}
                  className="px-4 py-2 border border-slate-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors font-medium text-sm"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------- UI helpers ---------- */

function StatCard({
  label,
  value,
  bgColor,
  textColor,
  borderColor,
}: {
  label: string;
  value: string | number;
  bgColor: string;
  textColor: string;
  borderColor: string;
}) {
  return (
    <div
      className={`${bgColor} border ${borderColor} p-5 rounded-xl transition-all hover:shadow-md`}
    >
      <div className="text-sm font-medium text-slate-600 mb-1">{label}</div>
      <div className={`text-3xl font-bold ${textColor}`}>{value}</div>
    </div>
  );
}

function Th({
  children,
  className = "",
}: React.PropsWithChildren<{ className?: string }>) {
  return (
    <th
      className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider ${className}`}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  className = "",
}: React.PropsWithChildren<{ className?: string }>) {
  return <td className={`px-4 py-4 ${className}`}>{children}</td>;
}

/* ---------- CSV helpers ---------- */

function csvEscape(v: string) {
  if (v == null) return "";
  const needsQuotes = v.includes(",") || v.includes('"') || v.includes("\n");
  const quoted = v.replace(/"/g, '""');
  return needsQuotes ? `"${quoted}"` : quoted;
}

function downloadText(text: string, filename: string) {
  const blob = new Blob([text], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.setAttribute("download", filename);
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
