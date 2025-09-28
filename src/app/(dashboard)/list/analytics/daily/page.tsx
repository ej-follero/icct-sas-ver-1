"use client";

import { useEffect, useMemo, useState } from "react";

type Row = {
  scheduleId: number;
  code: string;
  subject: string;
  section: string;
  room: string;
  present: number;
  absent: number;
  late: number;
  excused: number;
  total: number;
  rate: number;
  academicYear: string;
  semester: string;
};

type Payload = {
  date: string;
  totals: { present: number; absent: number; late: number; excused: number; total: number; rate: number };
  items: Row[];
};

export default function DailyPage() {
  const instructorId = 2;
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [data, setData] = useState<Payload | null>(null);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");

  async function load() {
    setLoading(true);
    try {
      const r = await fetch(`/api/analytics/daily?instructorId=${instructorId}&date=${date}`);
      const j = (await r.json()) as Payload;
      setData(j);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  const filtered = useMemo(() => {
    if (!data?.items) return [];
    const term = q.trim().toLowerCase();
    if (!term) return data.items;
    return data.items.filter(
      it =>
        it.code.toLowerCase().includes(term) ||
        it.subject.toLowerCase().includes(term) ||
        it.section.toLowerCase().includes(term) ||
        it.room.toLowerCase().includes(term)
    );
  }, [q, data]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">Daily</h1>
          <span className="text-gray-500">for</span>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="border rounded px-3 py-1 text-sm"
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            placeholder="Search subject / code / section / room"
            className="border rounded px-3 py-1 text-sm w-72"
            value={q}
            onChange={e => setQ(e.target.value)}
          />
          <button
            onClick={load}
            className="px-4 py-2 rounded bg-gray-900 text-white text-sm disabled:opacity-50"
            disabled={loading}
          >
            {loading ? "Loading…" : "Refresh"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-4">
        <Stat label="Total Records" value={data?.totals.total ?? 0} />
        <Stat label="Present" value={data?.totals.present ?? 0} />
        <Stat label="Absent" value={data?.totals.absent ?? 0} />
        <Stat label="Late" value={data?.totals.late ?? 0} />
        <Stat label="Attendance Rate" value={`${data?.totals.rate ?? 0}%`} />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm border">
          <thead className="bg-gray-50 text-gray-700">
            <tr>
              <Th>Code</Th>
              <Th>Subject</Th>
              <Th>Section</Th>
              <Th>Room</Th>
              <Th className="text-right">Present</Th>
              <Th className="text-right">Absent</Th>
              <Th className="text-right">Late</Th>
              <Th className="text-right">Excused</Th>
              <Th className="text-right">Total</Th>
              <Th className="text-right">Rate</Th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr>
                <td colSpan={10} className="py-8 text-center text-gray-400">
                  Loading…
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-8 text-center text-gray-400">
                  No data
                </td>
              </tr>
            ) : (
              filtered.map(it => (
                <tr key={it.scheduleId} className="hover:bg-gray-50">
                  <Td>{it.code}</Td>
                  <Td>{it.subject}</Td>
                  <Td>{it.section}</Td>
                  <Td>{it.room}</Td>
                  <Td className="text-right">{it.present}</Td>
                  <Td className="text-right">{it.absent}</Td>
                  <Td className="text-right">{it.late}</Td>
                  <Td className="text-right">{it.excused}</Td>
                  <Td className="text-right">{it.total}</Td>
                  <Td className="text-right">{it.rate}%</Td>
                </tr>
              ))
            )}
          </tbody>
          {!loading && filtered.length > 0 && (
            <tfoot>
              <tr className="bg-gray-50 font-medium">
                <Td colSpan={4}>Totals</Td>
                <Td className="text-right">
                  {filtered.reduce((s, i) => s + i.present, 0)}
                </Td>
                <Td className="text-right">
                  {filtered.reduce((s, i) => s + i.absent, 0)}
                </Td>
                <Td className="text-right">
                  {filtered.reduce((s, i) => s + i.late, 0)}
                </Td>
                <Td className="text-right">
                  {filtered.reduce((s, i) => s + i.excused, 0)}
                </Td>
                <Td className="text-right">
                  {filtered.reduce((s, i) => s + i.total, 0)}
                </Td>
                <Td className="text-right">
                  {(() => {
                    const p = filtered.reduce((s, i) => s + i.present, 0);
                    const t = filtered.reduce((s, i) => s + i.total, 0);
                    return t === 0 ? "0%" : `${Math.round((p / t) * 100)}%`;
                  })()}
                </Td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded border p-4">
      <div className="text-sm text-gray-500">{label}</div>
      <div className="text-2xl font-semibold">{value}</div>
    </div>
  );
}

function Th({ children, className = "" }: any) {
  return <th className={`px-3 py-2 text-left ${className}`}>{children}</th>;
}
function Td({ children, className = "", colSpan }: any) {
  return (
    <td className={`px-3 py-2 ${className}`} colSpan={colSpan}>
      {children}
    </td>
  );
}
