"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

/** ---------- Types ---------- */
type FileRow = { name: string; size: number; mtime: string; url: string };

/** ---------- CSV Utils (robust + fast) ---------- */
function parseCsv(text: string): string[][] {
  const out: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let i = 0;
  let inQuotes = false;

  while (i < text.length) {
    const ch = text[i];

    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i += 2;
        } else {
          inQuotes = false;
          i += 1;
        }
      } else {
        cell += ch;
        i += 1;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
        i += 1;
      } else if (ch === ",") {
        row.push(cell);
        cell = "";
        i += 1;
      } else if (ch === "\n") {
        row.push(cell);
        out.push(row);
        row = [];
        cell = "";
        i += 1;
      } else if (ch === "\r") {
        i += 1;
      } else {
        cell += ch;
        i += 1;
      }
    }
  }
  row.push(cell);
  out.push(row);

  // remove possible trailing empty last row
  const last = out[out.length - 1];
  if (last && last.length === 1 && last[0] === "") out.pop();

  return out;
}

/** ---------- Format helpers ---------- */
function formatBytes(bytes: number) {
  if (!bytes) return "0 B";
  const k = 1024,
    sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

function formatDate(iso: string) {
  try {
    const date = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    
    return date.toLocaleDateString();
  } catch {
    return iso;
  }
}

/** ---------- Debounce ---------- */
function useDebouncedValue<T>(value: T, delay = 250) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

/** ---------- Icons ---------- */
interface IconProps {
  className?: string;
}

const SearchIcon = ({ className = "w-4 h-4" }: IconProps) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m21 21-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const DownloadIcon = ({ className = "w-4 h-4" }: IconProps) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
  </svg>
);

const TrashIcon = ({ className = "w-4 h-4" }: IconProps) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const FileIcon = ({ className = "w-4 h-4" }: IconProps) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const RefreshIcon = ({ className = "w-4 h-4" }: IconProps) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

const ChevronLeftIcon = ({ className = "w-4 h-4" }: IconProps) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
  </svg>
);

const ChevronRightIcon = ({ className = "w-4 h-4" }: IconProps) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);

/** ---------- Component ---------- */
export default function ViewReportsPage() {
  const [items, setItems] = useState<FileRow[]>([]);
  const [loadingList, setLoadingList] = useState(false);

  const [activeName, setActiveName] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewErr, setPreviewErr] = useState<string | null>(null);
  const [rows, setRows] = useState<string[][]>([]);
  const [rawSize, setRawSize] = useState<number>(0);

  const [search, setSearch] = useState("");
  const q = useDebouncedValue(search, 300);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(100);

  const tableWrapRef = useRef<HTMLDivElement>(null);

  /** Load list */
  const loadList = useCallback(async () => {
    setLoadingList(true);
    try {
      const r = await fetch("/api/reports", { cache: "no-store" });
      const j = await r.json();
      setItems(j.items ?? []);
    } finally {
      setLoadingList(false);
    }
  }, []);

  /** Load preview */
  const loadPreview = useCallback(async (name: string) => {
    setActiveName(name);
    setPreviewLoading(true);
    setPreviewErr(null);
    setRows([]);
    try {
      const r = await fetch(`/reports/${encodeURIComponent(name)}`, {
        cache: "no-store",
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const text = await r.text();
      setRawSize(text.length);
      const parsed = parseCsv(text);
      setRows(parsed);
      setPage(1);
      // scroll preview into view on mobile
      setTimeout(() => {
        tableWrapRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 10);
    } catch (e: any) {
      setPreviewErr(e?.message || "Failed to preview file");
    } finally {
      setPreviewLoading(false);
    }
  }, []);

  /** Delete file */
  const remove = useCallback(async (name: string) => {
    if (!confirm(`Delete "${name}"?`)) return;
    try {
      await fetch("/api/reports?action=delete", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (activeName === name) {
        setActiveName(null);
        setRows([]);
      }
      loadList();
    } catch (error) {
      console.error("Failed to delete file:", error);
      alert("Failed to delete file");
    }
  }, [activeName, loadList]);

  /** List init */
  useEffect(() => {
    loadList();
  }, [loadList]);

  /** Filter rows (client-side) */
  const { header, filteredBody, totalFiltered } = useMemo(() => {
    const h = rows[0] ?? [];
    const body = rows.slice(1);

    if (!q.trim()) return { header: h, filteredBody: body, totalFiltered: body.length };

    const qq = q.toLowerCase();
    const fb = body.filter((r) => r.some((c) => (c ?? "").toLowerCase().includes(qq)));
    return { header: h, filteredBody: fb, totalFiltered: fb.length };
  }, [rows, q]);

  /** Pagination */
  const totalPages = Math.max(1, Math.ceil(totalFiltered / perPage));
  const pageSafe = Math.min(page, totalPages);
  const viewRows = useMemo(() => {
    const start = (pageSafe - 1) * perPage;
    return filteredBody.slice(start, start + perPage);
  }, [filteredBody, pageSafe, perPage]);

  /** UI */
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Reports Dashboard</h1>
            <p className="text-slate-600 mt-1">Manage and preview your CSV reports</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={async () => {
                await fetch("/api/reports?action=save-sample", { method: "POST" });
                loadList();
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50 hover:border-slate-400 transition-colors shadow-sm"
            >
              <FileIcon />
              Save Sample CSV
            </button>
            <button
              onClick={loadList}
              disabled={loadingList}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 transition-colors shadow-sm disabled:opacity-50"
            >
              <RefreshIcon />
              {loadingList ? "Loading..." : "Refresh"}
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Files List */}
          <div className="xl:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-slate-900">Files ({items.length})</h2>
                  {loadingList && (
                    <div className="flex items-center gap-2 text-slate-500">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-slate-300 border-t-slate-600"></div>
                      <span className="text-sm">Loading...</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="max-h-[60vh] overflow-auto">
                {items.length === 0 ? (
                  <div className="px-6 py-12 text-center">
                    <FileIcon className="mx-auto h-8 w-8 text-slate-400 mb-3" />
                    <p className="text-slate-500 font-medium">No files found</p>
                    <p className="text-slate-400 text-sm mt-1">Upload some CSV reports to get started</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {items.map((item) => {
                      const isSelected = activeName === item.name;
                      return (
                        <div
                          key={item.name}
                          className={`p-4 hover:bg-slate-50 transition-colors cursor-pointer ${
                            isSelected ? "bg-blue-50 border-r-2 border-blue-500" : ""
                          }`}
                          onClick={() => loadPreview(item.name)}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <p className={`font-medium truncate ${isSelected ? "text-blue-700" : "text-slate-900"}`}>
                                {item.name}
                              </p>
                              <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
                                <span>{formatBytes(item.size)}</span>
                                <span>•</span>
                                <span>{formatDate(item.mtime)}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <a
                                href={item.url}
                                download
                                onClick={(e) => e.stopPropagation()}
                                className="p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                                title="Download"
                              >
                                <DownloadIcon />
                              </a>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  remove(item.name);
                                }}
                                className="p-2 rounded-lg bg-slate-200 text-slate-700 hover:bg-red-100 hover:text-red-700 transition-colors"
                                title="Delete"
                              >
                                <TrashIcon />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Preview Panel */}
          <div className="xl:col-span-2" ref={tableWrapRef}>
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              {/* Preview Header */}
              <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h2 className="font-semibold text-slate-900">
                      {activeName ? activeName : "Preview"}
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">
                      {activeName ? (
                        <>
                          {formatBytes(rawSize)} • {totalFiltered.toLocaleString()} rows
                          {q && ` • ${totalFiltered} of ${rows.length - 1} filtered`}
                        </>
                      ) : (
                        "Select a file to preview its contents"
                      )}
                    </p>
                  </div>

                  {activeName && (
                    <div className="flex flex-wrap items-center gap-3">
                      {/* Search */}
                      <div className="relative">
                        
                        <input
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                          placeholder="Search rows..."
                          className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent w-48"
                        />
                      </div>

                      {/* Rows per page */}
                      <div className="flex items-center gap-2">
                        <label className="text-sm text-slate-600">Show</label>
                        <select
                          value={perPage}
                          onChange={(e) => {
                            setPerPage(Number(e.target.value));
                            setPage(1);
                          }}
                          className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          {[50, 100, 250, 500, 1000].map((n) => (
                            <option key={n} value={n}>
                              {n}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Pagination */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setPage((p) => Math.max(1, p - 1))}
                          disabled={pageSafe <= 1}
                          className="p-2 rounded-lg border border-slate-300 disabled:opacity-40 hover:bg-slate-50 disabled:hover:bg-white transition-colors"
                          title="Previous page"
                        >
                          <ChevronLeftIcon />
                        </button>
                        <span className="px-3 py-2 text-sm font-medium text-slate-700">
                          {pageSafe} of {totalPages}
                        </span>
                        <button
                          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                          disabled={pageSafe >= totalPages}
                          className="p-2 rounded-lg border border-slate-300 disabled:opacity-40 hover:bg-slate-50 disabled:hover:bg-white transition-colors"
                          title="Next page"
                        >
                          <ChevronRightIcon />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Preview Content */}
              <div className="relative">
                {previewLoading ? (
                  <div className="flex items-center justify-center py-24">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-300 border-t-slate-600 mx-auto mb-4"></div>
                      <p className="text-slate-600 font-medium">Loading preview...</p>
                      <p className="text-slate-500 text-sm mt-1">Processing CSV data</p>
                    </div>
                  </div>
                ) : previewErr ? (
                  <div className="p-8 text-center">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                      <p className="text-red-800 font-medium">Error loading file</p>
                      <p className="text-red-600 text-sm mt-2">{previewErr}</p>
                    </div>
                  </div>
                ) : !activeName ? (
                  <div className="flex items-center justify-center py-24">
                    <div className="text-center">
                      <FileIcon className="mx-auto h-12 w-12 text-slate-400 mb-4" />
                      <p className="text-slate-600 font-medium">No file selected</p>
                      <p className="text-slate-500 text-sm mt-1">Click on a file from the list to preview</p>
                    </div>
                  </div>
                ) : rows.length === 0 ? (
                  <div className="p-8 text-center">
                    <p className="text-slate-600 font-medium">Empty file</p>
                    <p className="text-slate-500 text-sm mt-1">This CSV file contains no data</p>
                  </div>
                ) : (
                  <div className="overflow-auto max-h-[70vh]">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-100/80 sticky top-0 z-10 backdrop-blur-sm">
                        <tr>
                          {header.map((h, i) => (
                            <th
                              key={i}
                              className="px-4 py-3 text-left font-semibold text-slate-900 border-b border-slate-200 whitespace-nowrap"
                              title={h}
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {viewRows.map((row, rowIndex) => (
                          <tr key={rowIndex} className="hover:bg-slate-50 transition-colors">
                            {header.map((_, colIndex) => (
                              <td key={colIndex} className="px-4 py-3 text-slate-700 align-top whitespace-pre-wrap border-slate-100">
                                {row[colIndex] ?? ""}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    
                    {/* Footer with row info */}
                    <div className="px-6 py-3 bg-slate-50/80 border-t border-slate-200 sticky bottom-0 backdrop-blur-sm">
                      <p className="text-sm text-slate-600">
                        Showing {(pageSafe - 1) * perPage + 1}–{Math.min(pageSafe * perPage, totalFiltered)} of{" "}
                        {totalFiltered.toLocaleString()} rows
                        {q && " (filtered)"}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Info */}
        <div className="text-center">
          <p className="text-sm text-slate-500">
            Files are stored in <code className="px-2 py-1 bg-slate-200 rounded text-slate-700">public/reports/</code>
            • Click filenames to preview • Use search and pagination controls
          </p>
        </div>
      </div>
    </div>
  );
}