'use client';

import { useEffect, useMemo, useState } from 'react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

type Item = {
  studentNumber: string;
  name: string;
  section: string;
  absences: number;
  total: number;
  rate: number;
};

type RangeKey = '7d' | '30d' | '90d' | 'all';

export default function GenerateReportPage() {
  const [q, setQ] = useState('');
  const [range, setRange] = useState<RangeKey>('all');
  const [top, setTop] = useState(10);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const instructorId = 2;

  async function load() {
    setLoading(true);
    const p = new URLSearchParams();
    p.set('instructorId', String(instructorId));
    p.set('range', range);
    p.set('top', String(top));
    if (q) p.set('q', q);
    const r = await fetch(`/api/analytics/absentees?${p.toString()}`, { cache: 'no-store' });
    const j = await r.json();
    setItems(j.items ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range, top]);

  const kpis = useMemo(() => {
    const total = items.reduce((s, it) => s + it.total, 0);
    const present = items.reduce((s, it) => s + (it.total - it.absences), 0);
    const absent = items.reduce((s, it) => s + it.absences, 0);
    const rate = total === 0 ? 0 : Math.round((present / total) * 1000) / 10;
    return { total, present, absent, rate };
  }, [items]);

  const headers = ['ID', 'Name', 'Section', 'Absences', 'Total Records', 'Absence Rate'];
  const rows = items.map(it => [
    it.studentNumber,
    it.name,
    it.section,
    String(it.absences),
    String(it.total),
    `${it.rate}%`,
  ]);

  function downloadBlob(data: Blob, filename: string) {
    const url = URL.createObjectURL(data);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  function exportCSV() {
    const escaped = [headers, ...rows].map(r =>
      r.map(v => `"${(v ?? '').toString().replace(/"/g, '""')}"`).join(',')
    ).join('\r\n');
    const blob = new Blob([escaped], { type: 'text/csv;charset=utf-8;' });
    downloadBlob(blob, `top-absentees-${range}.csv`);
  }

  function exportXLSX() {
    const data = [headers, ...rows];
    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Top Absentees');
    XLSX.writeFile(wb, `top-absentees-${range}.xlsx`);
  }

  function exportPDF() {
    const doc = new jsPDF();
    autoTable(doc, {
      head: [headers],
      body: rows,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [240, 240, 240] },
      theme: 'striped',
      margin: { top: 14 },
    });
    doc.save(`top-absentees-${range}.pdf`);
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Generate Report</h1>
        <div className="flex items-center gap-2">
          <input
            className="border rounded px-3 py-2 text-sm"
            placeholder="Search name / ID / section"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <select className="border rounded px-3 py-2 text-sm" value={range} onChange={(e) => setRange(e.target.value as RangeKey)}>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="all">All time</option>
          </select>
          <select className="border rounded px-3 py-2 text-sm" value={top} onChange={(e) => setTop(Number(e.target.value))}>
            <option value={5}>Top 5</option>
            <option value={10}>Top 10</option>
            <option value={20}>Top 20</option>
          </select>
          <button onClick={load} className="px-4 py-2 rounded bg-gray-900 text-white text-sm">Refresh</button>
          <div className="h-6 w-px bg-gray-200 mx-1" />
          <button onClick={exportCSV} className="px-3 py-2 rounded border text-sm">Export CSV</button>
          <button onClick={exportXLSX} className="px-3 py-2 rounded border text-sm">Export XLSX</button>
          <button onClick={exportPDF} className="px-3 py-2 rounded border text-sm">Export PDF</button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi label="Total Records" value={kpis.total} />
        <Kpi label="Present" value={kpis.present} />
        <Kpi label="Absent" value={kpis.absent} />
        <Kpi label="Attendance Rate" value={`${kpis.rate}%`} />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm border">
          <thead className="bg-gray-50 text-gray-700">
            <tr>
              <th className="px-3 py-2 text-left">#</th>
              <th className="px-3 py-2 text-left">ID</th>
              <th className="px-3 py-2 text-left">Name</th>
              <th className="px-3 py-2 text-left">Section</th>
              <th className="px-3 py-2 text-left">Absences</th>
              <th className="px-3 py-2 text-left">Total Records</th>
              <th className="px-3 py-2 text-left">Absence Rate</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr><td colSpan={7} className="py-6 text-center text-gray-400">Loading…</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={7} className="py-6 text-center text-gray-400">No data</td></tr>
            ) : (
              items.map((it, i) => (
                <tr key={`${it.studentNumber}-${i}`}>
                  <td className="px-3 py-2">{i + 1}</td>
                  <td className="px-3 py-2">{it.studentNumber}</td>
                  <td className="px-3 py-2">{it.name}</td>
                  <td className="px-3 py-2">{it.section}</td>
                  <td className="px-3 py-2">{it.absences}</td>
                  <td className="px-3 py-2">{it.total}</td>
                  <td className="px-3 py-2">{it.rate}%</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded border p-4">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-xl font-semibold mt-1">{value}</div>
    </div>
  );
}
