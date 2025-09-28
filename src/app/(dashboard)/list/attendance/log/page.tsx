"use client";

import { useEffect, useState } from "react";

type AttendanceLog = {
  date: string;
  studentId: string;
  studentName: string;
  subject: string;
  section: string;
  room: string;
  status: string;
  remarks: string;
};

export default function AttendanceLogPage() {
  const [logs, setLogs] = useState<AttendanceLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [date, setDate] = useState<string>("");
  const [status, setStatus] = useState<string>("ALL");
  const [student, setStudent] = useState<string>("");

  // ⚠️ For now we hardcode instructorId=2 for demo
  const instructorId = 2;

  const fetchLogs = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("instructorId", String(instructorId));
    if (date) params.set("date", date);
    if (status) params.set("status", status);
    if (student) params.set("student", student);

    const res = await fetch(`/api/attendance/logs?${params.toString()}`);
    const data = await res.json();
    setLogs(data.items || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, status, student]);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">My Attendance Logs</h1>

      <div className="flex gap-4 items-center">
        <div>
          <label className="text-sm text-gray-600">Date</label>
          <input
            type="date"
            className="border rounded px-3 py-1 text-sm ml-2"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>

        <div>
          <label className="text-sm text-gray-600">Status</label>
          <select
            className="border rounded px-3 py-1 text-sm ml-2"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="ALL">All</option>
            <option value="PRESENT">Present</option>
            <option value="ABSENT">Absent</option>
            <option value="LATE">Late</option>
            <option value="EXCUSED">Excused</option>
          </select>
        </div>

        <div>
          <label className="text-sm text-gray-600">Student</label>
          <input
            type="text"
            placeholder="Search name or ID"
            className="border rounded px-3 py-1 text-sm ml-2"
            value={student}
            onChange={(e) => setStudent(e.target.value)}
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm border">
          <thead className="bg-gray-50 text-gray-700">
            <tr>
              <th className="px-3 py-2 text-left">Date</th>
              <th className="px-3 py-2 text-left">Student ID</th>
              <th className="px-3 py-2 text-left">Student Name</th>
              <th className="px-3 py-2 text-left">Subject</th>
              <th className="px-3 py-2 text-left">Section</th>
              <th className="px-3 py-2 text-left">Room</th>
              <th className="px-3 py-2 text-left">Status</th>
              <th className="px-3 py-2 text-left">Remarks</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr>
                <td colSpan={8} className="text-center py-6 text-gray-400">
                  Loading...
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-6 text-gray-400">
                  No records found
                </td>
              </tr>
            ) : (
              logs.map((log, i) => (
                <tr key={i}>
                  <td className="px-3 py-2">{log.date}</td>
                  <td className="px-3 py-2">{log.studentId}</td>
                  <td className="px-3 py-2">{log.studentName}</td>
                  <td className="px-3 py-2">{log.subject}</td>
                  <td className="px-3 py-2">{log.section}</td>
                  <td className="px-3 py-2">{log.room}</td>
                  <td className="px-3 py-2">{log.status}</td>
                  <td className="px-3 py-2">{log.remarks}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
