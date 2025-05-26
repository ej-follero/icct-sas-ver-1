"use client";

import { useState } from "react";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import {
  School as SchoolIcon,
  Group as GroupIcon,
  CheckCircle as CheckCircleIcon,
  AccessTime as AccessTimeIcon,
  Cancel as CancelIcon,
  Person as PersonIcon,
  Warning as WarningIcon,
  FileDownload as FileDownloadIcon,
  Print as PrintIcon,
} from "@mui/icons-material";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// Mock data - replace with actual API calls later
const mockSummaryData = {
  totalClasses: 48,
  totalStudentsExpected: 1200,
  totalPresent: 1050,
  totalLate: 120,
  totalAbsent: 150,
  totalInstructorsExpected: 38,
  instructorsPresent: 36,
  rfidIssues: 5,
};

const mockInstructorData = [
  {
    id: 1,
    name: "Mr. Santos",
    subject: "ICT 101",
    section: "BSIT 2A",
    time: "8:00-9:00 AM",
    room: "203",
    status: "present",
  },
  {
    id: 2,
    name: "Ms. Reyes",
    subject: "Math 102",
    section: "BSED 1B",
    time: "10:00-11:00 AM",
    room: "102",
    status: "absent",
  },
];

const mockSectionData = [
  {
    id: 1,
    section: "BSIT 2A",
    scheduled: 40,
    present: 36,
    late: 2,
    absent: 2,
    rate: 90,
  },
  {
    id: 2,
    section: "BSED 1B",
    scheduled: 35,
    present: 28,
    late: 5,
    absent: 2,
    rate: 80,
  },
];

const mockTimeData = [
  { hour: "7:00-8:00", scans: 150 },
  { hour: "8:00-9:00", scans: 380 },
  { hour: "9:00-10:00", scans: 220 },
  { hour: "10:00-11:00", scans: 300 },
  { hour: "11:00-12:00", scans: 250 },
  { hour: "12:00-1:00", scans: 100 },
  { hour: "1:00-2:00", scans: 280 },
  { hour: "2:00-3:00", scans: 320 },
  { hour: "3:00-4:00", scans: 180 },
];

const mockAlerts = [
  {
    id: 1,
    type: "missing_instructor",
    message: "Mr. Dela Cruz has not scanned in for ICT 101 (BSIT 2A)",
    severity: "high",
  },
  {
    id: 2,
    type: "unknown_rfid",
    message: "Unknown RFID scan detected at Room 203",
    severity: "medium",
  },
  {
    id: 3,
    type: "duplicate_scan",
    message: "Multiple scans detected for Student ID: 2023-0001",
    severity: "low",
  },
];

const DailySummaryPage = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const handleExportPDF = () => {
    // TODO: Implement PDF export
    console.log("Exporting to PDF...");
  };

  const handleExportExcel = () => {
    // TODO: Implement Excel export
    console.log("Exporting to Excel...");
  };

  const handlePrint = () => {
    // TODO: Implement print functionality
    console.log("Printing...");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100/50">
      <div className="max-w-[1920px] mx-auto p-6">
        <div className="bg-white rounded-2xl shadow-lg ring-1 ring-gray-100/50 backdrop-blur-sm">
          {/* Header */}
          <div className="p-8 border-b border-gray-100">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  Daily Attendance Summary
                </h1>
                <p className="text-sm text-gray-500 mt-2">
                  View and analyze attendance data for any date
                </p>
              </div>
              <div className="flex items-center gap-4">
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    value={selectedDate}
                    onChange={(newValue) => newValue && setSelectedDate(newValue)}
                    className="w-full sm:w-64"
                  />
                </LocalizationProvider>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleExportPDF}
                    className="p-3 rounded-xl text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-all duration-200"
                  >
                    <FileDownloadIcon style={{ fontSize: 20 }} />
                  </button>
                  <button
                    onClick={handlePrint}
                    className="p-3 rounded-xl text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-all duration-200"
                  >
                    <PrintIcon style={{ fontSize: 20 }} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-sm ring-1 ring-gray-100">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <SchoolIcon className="text-blue-500" style={{ fontSize: 24 }} />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Classes</p>
                  <p className="text-2xl font-semibold text-gray-900">{mockSummaryData.totalClasses}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm ring-1 ring-gray-100">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-50 rounded-lg">
                  <GroupIcon className="text-green-500" style={{ fontSize: 24 }} />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Present</p>
                  <p className="text-2xl font-semibold text-gray-900">{mockSummaryData.totalPresent}</p>
                  <p className="text-sm text-gray-500">of {mockSummaryData.totalStudentsExpected} expected</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm ring-1 ring-gray-100">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-yellow-50 rounded-lg">
                  <AccessTimeIcon className="text-yellow-500" style={{ fontSize: 24 }} />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Late Arrivals</p>
                  <p className="text-2xl font-semibold text-gray-900">{mockSummaryData.totalLate}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm ring-1 ring-gray-100">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-red-50 rounded-lg">
                  <CancelIcon className="text-red-500" style={{ fontSize: 24 }} />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Absent</p>
                  <p className="text-2xl font-semibold text-gray-900">{mockSummaryData.totalAbsent}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Instructor Attendance */}
          <div className="p-8 border-t border-gray-100">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Instructor Attendance</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Instructor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Subject
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Section
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Room
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {mockInstructorData.map((instructor) => (
                    <tr key={instructor.id} className="hover:bg-gray-50/50 transition-colors duration-200">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-50 rounded-lg">
                            <PersonIcon className="text-blue-500" style={{ fontSize: 20 }} />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{instructor.name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {instructor.subject}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {instructor.section}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {instructor.time}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {instructor.room}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold ${
                            instructor.status === "present"
                              ? "bg-green-50 text-green-700 ring-1 ring-green-100"
                              : "bg-red-50 text-red-700 ring-1 ring-red-100"
                          }`}
                        >
                          {instructor.status.charAt(0).toUpperCase() + instructor.status.slice(1)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section Summary */}
          <div className="p-8 border-t border-gray-100">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Section Summary</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Section
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Scheduled
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Present
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Late
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Absent
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Attendance Rate
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {mockSectionData.map((section) => (
                    <tr
                      key={section.id}
                      className="hover:bg-gray-50/50 transition-colors duration-200 cursor-pointer"
                      onClick={() => {
                        // TODO: Navigate to section details
                        console.log("Navigate to section:", section.section);
                      }}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-purple-50 rounded-lg">
                            <SchoolIcon className="text-purple-500" style={{ fontSize: 20 }} />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{section.section}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {section.scheduled}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {section.present}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {section.late}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {section.absent}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-gray-100 rounded-full h-2">
                            <div
                              className="bg-blue-500 h-2 rounded-full"
                              style={{ width: `${section.rate}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium text-gray-900">{section.rate}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Time-Based Attendance Chart */}
          <div className="p-8 border-t border-gray-100">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Attendance by Hour</h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mockTimeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="scans" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Alerts Panel */}
          <div className="p-8 border-t border-gray-100">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Alerts & Issues</h2>
            <div className="space-y-4">
              {mockAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-start gap-4 p-4 rounded-xl bg-white shadow-sm ring-1 ring-gray-100"
                >
                  <div
                    className={`p-2 rounded-lg ${
                      alert.severity === "high"
                        ? "bg-red-50"
                        : alert.severity === "medium"
                        ? "bg-yellow-50"
                        : "bg-blue-50"
                    }`}
                  >
                    <WarningIcon
                      className={
                        alert.severity === "high"
                          ? "text-red-500"
                          : alert.severity === "medium"
                          ? "text-yellow-500"
                          : "text-blue-500"
                      }
                      style={{ fontSize: 20 }}
                    />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{alert.message}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {alert.type.split("_").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DailySummaryPage; 