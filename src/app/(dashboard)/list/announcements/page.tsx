// app/list/announcements/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";

type Item = {
  id: number;
  title: string;
  content: string;
  isGeneral: boolean;
  userType: "ADMIN" | "TEACHER" | "STUDENT" | "GUARDIAN";
  status: "ACTIVE" | "INACTIVE";
  priority: "LOW" | "NORMAL" | "HIGH" | "URGENT";
  createdAt: string;
  updatedAt: string;
  section: { id: number; name: string } | null;
};

function fmtDate(s: string) {
  try {
    return new Date(s).toLocaleDateString();
  } catch {
    return s;
  }
}

export default function AnnouncementsIndex() {
  const [q, setQ] = useState("");
  const [openFilters, setOpenFilters] = useState(false);
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<Item[]>([]);
  const [total, setTotal] = useState(0);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total, pageSize]);

  useEffect(() => {
    const ctrl = new AbortController();
    setLoading(true);
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (role) params.set("role", role);
    if (status) params.set("status", status);
    if (priority) params.set("priority", priority);
    params.set("page", String(page));
    params.set("pageSize", String(pageSize));
    fetch(`/api/announcements?${params.toString()}`, { cache: "no-store", signal: ctrl.signal })
      .then((r) => r.json())
      .then((j) => {
        setItems(j.items ?? []);
        setTotal(j.total ?? 0);
      })
      .finally(() => setLoading(false));
    return () => ctrl.abort();
  }, [q, role, status, priority, page, pageSize]);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">All Announcements</h1>
        <div className="flex items-center gap-2">
          <div className="relative">
            <input
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
              placeholder="Search..."
              className="pl-9 pr-3 py-2 border rounded-lg text-sm w-72"
            />
            <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
          </div>
          <button
            onClick={() => setOpenFilters((v) => !v)}
            className="px-3 py-2 border rounded-lg text-sm"
            aria-expanded={openFilters}
          >
            Filter ▾
          </button>
        </div>
      </div>

      {openFilters && (
        <div className="border rounded-lg p-3 bg-gray-50 flex flex-wrap gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Role</label>
            <select
              value={role}
              onChange={(e) => {
                setRole(e.target.value);
                setPage(1);
              }}
              className="border rounded-md px-2 py-2 text-sm"
            >
              <option value="">Any</option>
              <option value="STUDENT">STUDENT</option>
              <option value="TEACHER">TEACHER</option>
              <option value="ADMIN">ADMIN</option>
              <option value="GUARDIAN">GUARDIAN</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Status</label>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="border rounded-md px-2 py-2 text-sm"
            >
              <option value="">Any</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Priority</label>
            <select
              value={priority}
              onChange={(e) => {
                setPriority(e.target.value);
                setPage(1);
              }}
              className="border rounded-md px-2 py-2 text-sm"
            >
              <option value="">Any</option>
              <option value="LOW">LOW</option>
              <option value="NORMAL">NORMAL</option>
              <option value="HIGH">HIGH</option>
              <option value="URGENT">URGENT</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Per page</label>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(parseInt(e.target.value, 10));
                setPage(1);
              }}
              className="border rounded-md px-2 py-2 text-sm"
            >
              {[10, 20, 50, 100].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
          {(role || status || priority || q) && (
            <button
              onClick={() => {
                setQ("");
                setRole("");
                setStatus("");
                setPriority("");
                setPage(1);
              }}
              className="px-3 py-2 border rounded-lg text-sm"
            >
              Clear
            </button>
          )}
        </div>
      )}

      <div className="border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-700">
            <tr>
              <th className="px-4 py-3 text-left">Title</th>
              <th className="px-4 py-3 text-left">Class</th>
              <th className="px-4 py-3 text-left">Date</th>
              <th className="px-4 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading
              ? Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-4 py-4">
                      <div className="h-4 bg-gray-200 rounded w-2/3" />
                    </td>
                    <td className="px-4 py-4">
                      <div className="h-4 bg-gray-200 rounded w-24" />
                    </td>
                    <td className="px-4 py-4">
                      <div className="h-4 bg-gray-200 rounded w-28" />
                    </td>
                    <td className="px-4 py-4">
                      <div className="h-8 bg-gray-200 rounded w-24" />
                    </td>
                  </tr>
                ))
              : items.length === 0
              ? (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-gray-400">
                    No announcements found
                  </td>
                </tr>
                )
              : items.map((a) => (
                  <tr key={a.id}>
                    <td className="px-4 py-3">
                      <div className="font-medium">{a.title}</div>
                      <div className="text-xs text-gray-500 truncate max-w-[640px]">
                        {a.content}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {a.section?.name ?? (a.isGeneral ? "General" : "—")}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">{fmtDate(a.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <a
                          href={`/list/announcements/${a.id}`}
                          className="px-3 py-1.5 rounded-md border text-xs hover:bg-gray-50"
                        >
                          View
                        </a>
                        <form
                          action={async () => {
                            await fetch("/api/announcements?action=delete", {
                              method: "POST",
                              headers: { "content-type": "application/json" },
                              body: JSON.stringify({ id: a.id }),
                            });
                            const newCount = total - 1;
                            if ((page - 1) * pageSize >= newCount && page > 1) {
                              setPage(page - 1);
                            } else {
                              setPage(page);
                            }
                          }}
                        >
                          <button
                            type="button"
                            onClick={async () => {
                              if (!confirm("Delete announcement?")) return;
                              await fetch("/api/announcements?action=delete", {
                                method: "POST",
                                headers: { "content-type": "application/json" },
                                body: JSON.stringify({ id: a.id }),
                              });
                              // soft refresh
                              const params = new URLSearchParams();
                              if (q) params.set("q", q);
                              if (role) params.set("role", role);
                              if (status) params.set("status", status);
                              if (priority) params.set("priority", priority);
                              params.set("page", String(page));
                              params.set("pageSize", String(pageSize));
                              const r = await fetch(`/api/announcements?${params.toString()}`, { cache: "no-store" });
                              const j = await r.json();
                              setItems(j.items ?? []);
                              setTotal(j.total ?? 0);
                            }}
                            className="px-3 py-1.5 rounded-md bg-gray-200 text-xs hover:bg-gray-300"
                          >
                            Delete
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>

        <div className="px-4 py-3 border-t bg-white flex items-center justify-between text-sm">
          <div>
            Showing {items.length ? (page - 1) * pageSize + 1 : 0}–
            {Math.min(page * pageSize, total)} of {total}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-2 py-1.5 rounded-md border disabled:opacity-40"
            >
              ‹
            </button>
            <span>
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-2 py-1.5 rounded-md border disabled:opacity-40"
            >
              ›
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
