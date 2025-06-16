"use client";

import { useState, useEffect } from "react";
import { Calendar, RefreshCw } from "lucide-react";
import { Button } from "../../../../components/ui/button";
import Table from "@/components/Table";
import Pagination from "@/components/Pagination";

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50, 100];

export default function ClassSchedulesPage() {
  const [schedules, setSchedules] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    setLoading(true);
    setError("");
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(itemsPerPage),
      search,
    });
    fetch(`/api/schedules?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        setSchedules(data.data || []);
        setTotal(data.total || 0);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to fetch schedules");
        setLoading(false);
      });
  }, [search, page, itemsPerPage]);

  const columns = [
    { header: "Subject", accessor: "subject" },
    { header: "Section", accessor: "section" },
    { header: "Instructor", accessor: "instructor" },
    { header: "Room", accessor: "room" },
    { header: "Day", accessor: "day" },
    { header: "Time", accessor: "time" },
    { header: "Type", accessor: "scheduleType" },
    { header: "Status", accessor: "status" },
    { header: "Semester", accessor: "semester" },
    { header: "Academic Year", accessor: "academicYear" },
  ];

  const renderRow = (sched: any) => (
    <>
      <td className="py-2 px-4 whitespace-nowrap">{sched.subject?.subjectName || "-"}</td>
      <td className="py-2 px-4 whitespace-nowrap">{sched.section?.sectionName || "-"}</td>
      <td className="py-2 px-4 whitespace-nowrap">{sched.instructor ? `${sched.instructor.firstName} ${sched.instructor.lastName}` : "-"}</td>
      <td className="py-2 px-4 whitespace-nowrap">{sched.room?.roomNo || sched.room?.roomId || "-"}</td>
      <td className="py-2 px-4 whitespace-nowrap">{sched.day || "-"}</td>
      <td className="py-2 px-4 whitespace-nowrap">{sched.startTime} - {sched.endTime}</td>
      <td className="py-2 px-4 whitespace-nowrap">{sched.scheduleType}</td>
      <td className="py-2 px-4 whitespace-nowrap">{sched.status}</td>
      <td className="py-2 px-4 whitespace-nowrap">{sched.semester?.semesterName || sched.semesterId}</td>
      <td className="py-2 px-4 whitespace-nowrap">{sched.academicYear}</td>
    </>
  );

  const totalPages = Math.ceil(total / itemsPerPage);

  // Export CSV
  const handleExportCSV = () => {
    const csvRows = [
      columns.map((col) => col.header).join(","),
      ...schedules.map((sched) =>
        [
          sched.subject?.subjectName || "-",
          sched.section?.sectionName || "-",
          sched.instructor ? `${sched.instructor.firstName} ${sched.instructor.lastName}` : "-",
          sched.room?.roomNo || sched.room?.roomId || "-",
          sched.day || "-",
          `${sched.startTime} - ${sched.endTime}`,
          sched.scheduleType,
          sched.status,
          sched.semester?.semesterName || sched.semesterId,
          sched.academicYear,
        ].join(",")
      ),
    ];
    const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `class-schedules-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 bg-white rounded-2xl shadow-md border border-blue-100 animate-fade-in w-full">
      <span className="bg-blue-100 p-4 rounded-full mb-4 animate-pop">
        <Calendar className="w-12 h-12 text-blue-600" />
      </span>
      <h1 className="text-3xl font-extrabold text-blue-800 mb-2">Class Schedules</h1>
      <p className="text-blue-700 text-lg mb-6 text-center max-w-xl">
        View and manage all class schedules for the ICCT Smart Attendance System. Filter, search, and export schedules for planning and attendance tracking.
      </p>
      <div className="w-full max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <input
              type="text"
              placeholder="Search by subject, section, or instructor..."
              className="border border-blue-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-blue-300"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-1 text-xs"
              onClick={() => { setSearch(""); setPage(1); setItemsPerPage(10); }}
              aria-label="Reset preferences"
              title="Reset all filters and pagination to default"
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
            {PAGE_SIZE_OPTIONS.map(size => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
        </div>
        <div className="w-full overflow-x-auto">
          {loading ? (
            <div className="w-full text-center text-blue-400 py-12">Loading schedules...</div>
          ) : error ? (
            <div className="w-full text-center text-red-500 py-12">{error}</div>
          ) : schedules.length === 0 ? (
            <div className="w-full text-center text-blue-400 py-12">No schedules found.</div>
          ) : (
            <Table columns={columns} data={schedules} renderRow={renderRow} ariaLabel="Class Schedules Table" />
          )}
          <div className="mt-4">
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        </div>
      </div>
    </div>
  );
} 