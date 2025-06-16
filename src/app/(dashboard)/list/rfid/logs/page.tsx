"use client";

import { useState, useEffect, useMemo } from "react";
import { ScanLine, RefreshCw } from "lucide-react";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import Pagination from "@/components/Pagination";
import { Button } from "../../../../../components/ui/button";
import { Badge } from "../../../../../components/ui/badge";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "../../../../../components/ui/select";
import { Input } from "../../../../../components/ui/input";

const SEVERITY_OPTIONS = [
  { value: "all", label: "All Severities" },
  { value: "DEBUG", label: "Debug" },
  { value: "INFO", label: "Info" },
  { value: "WARNING", label: "Warning" },
  { value: "ERROR", label: "Error" },
  { value: "CRITICAL", label: "Critical" },
];
const EVENT_TYPE_OPTIONS = [
  { value: "all", label: "All Events" },
  { value: "SCAN_SUCCESS", label: "Scan Success" },
  { value: "SCAN_ERROR", label: "Scan Error" },
  { value: "CONNECTION_LOST", label: "Connection Lost" },
  { value: "CONNECTION_RESTORED", label: "Connection Restored" },
  { value: "BATTERY_LOW", label: "Battery Low" },
  { value: "BATTERY_CRITICAL", label: "Battery Critical" },
  { value: "SIGNAL_WEAK", label: "Signal Weak" },
  { value: "SIGNAL_LOST", label: "Signal Lost" },
  { value: "RESTART", label: "Restart" },
  { value: "CONFIGURATION_CHANGE", label: "Config Change" },
  { value: "FIRMWARE_UPDATE", label: "Firmware Update" },
  { value: "MAINTENANCE_REQUIRED", label: "Maintenance Required" },
  { value: "SYSTEM_ERROR", label: "System Error" },
];

const PAGE_SIZE = 10;

type Log = {
  id: number;
  timestamp: string;
  reader: {
    readerId: number;
    deviceId: string;
    deviceName: string;
    roomId: number;
  } | null;
  eventType: string;
  severity: string;
  message?: string;
  details?: any;
  ipAddress?: string;
  resolution?: string;
  resolvedAt?: string | null;
};

type Reader = {
  readerId: number;
  deviceId: string;
  deviceName: string;
  roomId: number;
};

export default function RFIDReaderLogsPage() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [severity, setSeverity] = useState("all");
  const [eventType, setEventType] = useState("all");
  const [readerId, setReaderId] = useState("all");
  const [readers, setReaders] = useState<Reader[]>([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState("timestamp");
  const [sortDir, setSortDir] = useState("desc");
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    setLoading(true);
    setError("");
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(PAGE_SIZE),
      search,
      severity: severity === "all" ? "" : severity,
      eventType: eventType === "all" ? "" : eventType,
      readerId: readerId === "all" ? "" : readerId,
      startDate,
      endDate,
      sortBy,
      sortDir,
    });
    fetch(`/api/rfid/logs?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        setLogs(data.data || []);
        setTotal(data.total || 0);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to fetch logs");
        setLoading(false);
      });
  }, [search, severity, eventType, readerId, startDate, endDate, page, sortBy, sortDir]);

  useEffect(() => {
    fetch("/api/rfid/readers?page=1&pageSize=100")
      .then((res) => res.json())
      .then((data) => setReaders(data.data || []));
  }, []);

  const columns = [
    { header: "Timestamp", accessor: "timestamp" },
    { header: "Reader", accessor: "reader" },
    { header: "Event Type", accessor: "eventType" },
    { header: "Severity", accessor: "severity" },
    { header: "Message", accessor: "message" },
    { header: "IP Address", accessor: "ipAddress" },
    { header: "Resolution", accessor: "resolution" },
    { header: "Resolved At", accessor: "resolvedAt" },
  ];

  const renderRow = (log: Log) => (
    <>
      <td className="py-2 px-4 whitespace-nowrap">{new Date(log.timestamp).toLocaleString()}</td>
      <td className="py-2 px-4 whitespace-nowrap">{log.reader?.deviceName || log.reader?.deviceId || "-"}</td>
      <td className="py-2 px-4 whitespace-nowrap">{log.eventType.replace(/_/g, " ")}</td>
      <td className="py-2 px-4 whitespace-nowrap">
        <Badge variant={
          log.severity === "CRITICAL"
            ? "destructive"
            : log.severity === "ERROR"
            ? "destructive"
            : log.severity === "WARNING"
            ? "warning"
            : log.severity === "INFO"
            ? "info"
            : "secondary"
        }>
          {log.severity}
        </Badge>
      </td>
      <td className="py-2 px-4 whitespace-nowrap max-w-xs truncate" title={log.message}>{log.message}</td>
      <td className="py-2 px-4 whitespace-nowrap">{log.ipAddress || "-"}</td>
      <td className="py-2 px-4 whitespace-nowrap max-w-xs truncate" title={log.resolution}>{log.resolution || "-"}</td>
      <td className="py-2 px-4 whitespace-nowrap">{log.resolvedAt ? new Date(log.resolvedAt).toLocaleString() : "-"}</td>
    </>
  );

  const totalPages = Math.ceil(total / itemsPerPage);

  // Export CSV
  const handleExportCSV = () => {
    const csvRows = [
      columns.map((col) => col.header).join(","),
      ...logs.map((log) =>
        [
          new Date(log.timestamp).toLocaleString(),
          log.reader?.deviceName || log.reader?.deviceId || "-",
          log.eventType,
          log.severity,
          log.message?.replace(/\n/g, " ").replace(/,/g, ";"),
          log.ipAddress,
          log.resolution?.replace(/\n/g, " ").replace(/,/g, ";"),
          log.resolvedAt ? new Date(log.resolvedAt).toLocaleString() : "-",
        ].join(",")
      ),
    ];
    const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rfid-reader-logs-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 bg-white rounded-2xl shadow-md border border-blue-100 animate-fade-in w-full">
      <span className="bg-blue-100 p-4 rounded-full mb-4 animate-pop">
        <ScanLine className="w-12 h-12 text-blue-600" />
      </span>
      <h1 className="text-3xl font-extrabold text-blue-800 mb-2">RFID Reader Logs</h1>
      <p className="text-blue-700 text-lg mb-6 text-center max-w-xl">
        View and analyze all logs from RFID readers in the ICCT Smart Attendance System. Filter, search, and export logs for auditing and troubleshooting.
      </p>
      <div className="w-full max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <input
              type="text"
              placeholder="Search logs..."
              className="border border-blue-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-blue-300"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <select
              className="border border-blue-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-blue-300"
              value={severity}
              onChange={e => setSeverity(e.target.value)}
            >
              {SEVERITY_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <select
              className="border border-blue-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-blue-300"
              value={eventType}
              onChange={e => setEventType(e.target.value)}
            >
              {EVENT_TYPE_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <select
              className="border border-blue-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-blue-300"
              value={readerId}
              onChange={e => setReaderId(e.target.value)}
            >
              <option value="all">All Readers</option>
              {readers.map(r => (
                <option key={r.readerId} value={String(r.readerId)}>{r.deviceName || r.deviceId}</option>
              ))}
            </select>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="border border-blue-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-blue-300 min-w-[120px]"
            />
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="border border-blue-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-blue-300 min-w-[120px]"
            />
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-1 text-xs"
              onClick={() => {
                setSearch("");
                setSeverity("all");
                setEventType("all");
                setReaderId("all");
                setStartDate("");
                setEndDate("");
                setPage(1);
                setItemsPerPage(10);
              }}
              aria-label="Reset preferences"
              title="Reset all filters, columns, and sorting to default"
            >
              <RefreshCw className="w-4 h-4" /> Reset
            </Button>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExportCSV}>Export CSV</Button>
          </div>
        </div>
        <div className="flex gap-2 items-center mb-4">
          <label className="text-xs text-blue-700 mr-1" htmlFor="pageSize">Rows:</label>
          <select
            id="pageSize"
            className="border border-blue-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-300"
            value={itemsPerPage}
            onChange={e => { setItemsPerPage(Number(e.target.value)); setPage(1); }}
            style={{ width: 60 }}
          >
            {[5, 10, 20, 50, 100].map(size => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
        </div>
        <div className="w-full overflow-x-auto">
          {loading ? (
            <div className="w-full text-center text-blue-400 py-12">Loading logs...</div>
          ) : error ? (
            <div className="w-full text-center text-red-500 py-12">{error}</div>
          ) : logs.length === 0 ? (
            <div className="w-full text-center text-blue-400 py-12">No logs found.</div>
          ) : (
            <Table columns={columns} data={logs} renderRow={renderRow} ariaLabel="RFID Reader Logs Table" />
          )}
          <div className="mt-4">
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        </div>
      </div>
    </div>
  );
} 