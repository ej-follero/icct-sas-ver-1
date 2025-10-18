"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

// ----- Types that match your /api/reports/view response -----
type ReportStatus =
  | "PENDING"
  | "GENERATING"
  | "COMPLETED"
  | "FAILED"
  | "EXPIRED";

type ReportRow = {
  reportId: number;
  reportName: string;
  reportType: string;
  description: string | null;
  startDate: string;
  endDate: string;
  status: ReportStatus;
  fileFormat: string | null;
  fileSize: number | null;
  filepath: string | null;
  createdAt: string;
  parameters?: unknown;
};

type ApiResponse = {
  items: ReportRow[];
  total: number;
  page: number;
  pageSize: number;
  error?: string;
};

const PAGE_SIZES = [10, 20, 50];
const STATUS_OPTIONS: Array<ReportStatus | "ALL"> = [
  "ALL",
  "PENDING",
  "GENERATING",
  "COMPLETED",
  "FAILED",
  "EXPIRED",
];

// ------------------------------------------------------------

export default function ViewReportsPage() {
  const params = useSearchParams();
  const router = useRouter();

  // read URL params (so links/bookmarks work)
  const instructorId = Number(params.get("instructorId") || 0);
  const [q, setQ] = useState<string>(params.get("q") || "");
  const [status, setStatus] = useState<ReportStatus | "ALL">(
    (params.get("status") as any) || "ALL"
  );
  const [pageSize, setPageSize] = useState<number>(
    Number(params.get("pageSize")) || PAGE_SIZES[0]
  );
  const [page, setPage] = useState<number>(Number(params.get("page")) || 1);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string>("");
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [total, setTotal] = useState<number>(0);

  // keep URL in sync
  useEffect(() => {
    const sp = new URLSearchParams();
    if (instructorId) sp.set("instructorId", String(instructorId));
    if (q) sp.set("q", q);
    if (status && status !== "ALL") sp.set("status", status);
    sp.set("page", String(page));
    sp.set("pageSize", String(pageSize));
    router.replace(`?${sp.toString()}`);
  }, [instructorId, q, status, page, pageSize, router]);

  async function load() {
    if (!instructorId) {
      setErr("Missing instructorId in URL (e.g. ?instructorId=7)");
      setRows([]);
      setTotal(0);
      return;
    }
    try {
      setLoading(true);
      setErr("");
      const u = new URL("/api/reports/view", window.location.origin);
      u.searchParams.set("instructorId", String(instructorId));
      u.searchParams.set("page", String(page));
      u.searchParams.set("pageSize", String(pageSize));
      if (q) u.searchParams.set("q", q);
      if (status !== "ALL") u.searchParams.set("status", status);

      const res = await fetch(u.toString(), { cache: "no-store" });
      const json: ApiResponse = await res.json();

      if (!res.ok || json.error) {
        throw new Error(json.error || `HTTP ${res.status}`);
      }
      setRows(json.items || []);
      setTotal(json.total || 0);
    } catch (e: any) {
      setErr(e?.message || "Failed to fetch reports");
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [instructorId, q, status, page, pageSize]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const clearFilters = () => {
    setQ("");
    setStatus("ALL");
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-6">
          View Attendance Reports
        </h1>

        {/* Controls */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
            <div className="relative flex-1">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="m21 21-5.2-5.2M10 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16z"
                />
              </svg>
              <input
                placeholder="Search report name..."
                className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setPage(1);
                }}
              />
            </div>

            <select
              className="px-3 py-2.5 border border-slate-300 rounded-lg text-sm"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value as any);
                setPage(1);
              }}
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s === "ALL" ? "All Status" : s}
                </option>
              ))}
            </select>

            <button
              onClick={clearFilters}
              className="px-3 py-2.5 border border-slate-300 rounded-lg text-sm hover:bg-slate-50"
            >
              Clear
            </button>

            <select
              className="px-3 py-2.5 border border-slate-300 rounded-lg text-sm"
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
            >
              {PAGE_SIZES.map((n) => (
                <option value={n} key={n}>
                  {n} / page
                </option>
              ))}
            </select>

            <button
              onClick={load}
              disabled={loading}
              className="ml-auto inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
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
                  strokeWidth="2"
                  d="M4 4v5h.6m14.4 2A8 8 0 1 0 4.6 9M20 20v-5h-.6"
                />
              </svg>
              {loading ? "Refreshing…" : "Refresh"}
            </button>
          </div>
        </div>

        {/* Errors */}
        {err && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {err}
          </div>
        )}

        {/* Table */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <Th>#</Th>
                  <Th>Report Name</Th>
                  <Th>Type</Th>
                  <Th>Start Date</Th>
                  <Th>End Date</Th>
                  <Th>Status</Th>
                  <Th>Created</Th>
                  <Th>Action</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="py-10 text-center text-slate-500"
                    >
                      Loading…
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="py-10 text-center text-slate-500"
                    >
                      No reports found
                    </td>
                  </tr>
                ) : (
                  rows.map((r, i) => (
                    <tr key={r.reportId} className="hover:bg-slate-50">
                      <Td className="w-16">{(page - 1) * pageSize + i + 1}</Td>

                      <Td>
                        <div className="font-medium text-slate-900">
                          {r.reportName}
                        </div>
                        {r.description && (
                          <div className="text-xs text-slate-500">
                            {r.description}
                          </div>
                        )}
                      </Td>

                      <Td className="whitespace-nowrap">
                        {prettyReportType(r.reportType)}
                      </Td>

                      <Td className="whitespace-nowrap">
                        {fmtDate(r.startDate)}
                      </Td>

                      <Td className="whitespace-nowrap">
                        {fmtDate(r.endDate)}
                      </Td>

                      <Td>
                        <StatusBadge status={r.status} />
                      </Td>

                      <Td className="whitespace-nowrap">
                        {fmtDate(r.createdAt)}
                      </Td>

                      {/* Action cell with Download + Params popover */}
                      <Td>
                        <div className="flex items-center gap-2">
                          <a
                            href={`/api/reports/file/${r.reportId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-700"
                            title="Download CSV"
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
                                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.6a1 1 0 01.7.3l5.4 5.4a1 1 0 01.3.7V19a2 2 0 01-2 2z"
                              />
                            </svg>
                            Download
                          </a>

                          <ParamsPopover params={r.parameters} />
                        </div>
                      </Td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-4 py-3 border-t border-slate-200 flex items-center justify-between">
            <div className="text-xs text-slate-600">
              Showing{" "}
              <span className="font-medium text-slate-900">
                {rows.length ? (page - 1) * pageSize + 1 : 0}
              </span>{" "}
              to{" "}
              <span className="font-medium text-slate-900">
                {(page - 1) * pageSize + rows.length}
              </span>{" "}
              of <span className="font-medium text-slate-900">{total}</span>{" "}
              entries
            </div>

            <div className="flex items-center gap-2">
              <button
                className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm disabled:opacity-50 hover:bg-slate-50"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                Prev
              </button>
              <span className="text-sm text-slate-700">
                Page {page} / {totalPages}
              </span>
              <button
                className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm disabled:opacity-50 hover:bg-slate-50"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============ small UI helpers ============

function Th({ children }: React.PropsWithChildren) {
  return (
    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
      {children}
    </th>
  );
}

function Td({
  children,
  className = "",
}: React.PropsWithChildren<{ className?: string }>) {
  return <td className={`px-4 py-3 ${className}`}>{children}</td>;
}

function fmtDate(iso?: string | null) {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function prettyReportType(t?: string) {
  if (!t) return "—";
  return t.replace(/_/g, " ");
}

function StatusBadge({ status }: { status: ReportStatus }) {
  const map: Record<ReportStatus, { bg: string; text: string; label: string }> =
    {
      PENDING: { bg: "bg-amber-100", text: "text-amber-800", label: "PENDING" },
      GENERATING: {
        bg: "bg-sky-100",
        text: "text-sky-800",
        label: "GENERATING",
      },
      COMPLETED: {
        bg: "bg-emerald-100",
        text: "text-emerald-800",
        label: "COMPLETED",
      },
      FAILED: { bg: "bg-rose-100", text: "text-rose-800", label: "FAILED" },
      EXPIRED: { bg: "bg-slate-200", text: "text-slate-700", label: "EXPIRED" },
    };
  const c = map[status];
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${c.bg} ${c.text}`}
    >
      {c.label}
    </span>
  );
}

function ParamsPopover({ params }: { params: unknown }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg hover:bg-slate-50"
        title="View parameters"
      >
        ▶ Params
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute z-20 right-0 mt-2 w-80 bg-white border border-slate-200 rounded-lg shadow p-3 text-[13px] text-slate-700 whitespace-pre-wrap break-words">
            {safePretty(params)}
          </div>
        </>
      )}
    </div>
  );
}

function safePretty(v: unknown) {
  try {
    return JSON.stringify(v, null, 2);
  } catch {
    return String(v ?? "");
  }
}
